import type { jsPDF as JsPdf } from 'jspdf';
import { compactDateTime } from '@/lib/format';
import { imageAsDataUrl } from './download';
import pdfLogoArt from '@/assets/brand/indiyana-logo-pdf.png';

/** Who the document is from — the store's letterhead. */
export interface Letterhead {
  storeName: string;
  storeAddress: string;
  contact: string;
}

type RGB = [number, number, number];
const INK: RGB = [10, 20, 48];
const MUTED: RGB = [100, 116, 139];
const LINE: RGB = [226, 232, 240];
/** The logo's navy and gold. */
const NAVY: RGB = [2, 44, 113];
const GOLD: RGB = [183, 127, 55];

// jsPDF's built-in fonts have no ₹ glyph (it prints a stray character), so documents use "Rs.".
const pdfText = (v: unknown) => String(v ?? '—').replace(/₹\s?/g, 'Rs. ');

export function statusColor(status: string): RGB {
  const s = status.toUpperCase();
  if (s === 'SUCCESS' || s === 'APPROVED') return [5, 150, 105];
  if (s === 'PENDING') return GOLD;
  return [225, 29, 72];
}

// A small copy of the logo (the full-size artwork would bloat every PDF).
let logoCache: Promise<string | null> | null = null;
const brandLogo = () => (logoCache ??= imageAsDataUrl(pdfLogoArt.src));

async function newDoc(orientation: 'portrait' | 'landscape' = 'portrait'): Promise<JsPdf> {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'pt', format: 'a4', orientation });
}

/**
 * The band across the top: the store's name, address and contact on the left, the Indiyana Payments
 * logo on the right, and a navy-to-gold rule beneath. Returns the y below it.
 */
async function drawLetterhead(doc: JsPdf, head: Letterhead, left: number, right: number, top: number): Promise<number> {
  const logo = await brandLogo();
  const height = 64;
  let textRight = right - 18;
  if (logo) {
    const { width, height: h } = doc.getImageProperties(logo);
    const logoH = 44;
    const logoW = (width / h) * logoH;
    doc.addImage(logo, 'PNG', right - logoW, top + (height - logoH) / 2, logoW, logoH);
    textRight = right - logoW - 16;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text(doc.splitTextToSize(head.storeName || 'Indiyana Payments', textRight - left)[0] ?? '', left, top + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const sub = [head.storeAddress, head.contact && `Contact ${head.contact}`].filter(Boolean).join('  ·  ');
  doc.text(doc.splitTextToSize(sub, textRight - left)[0] ?? '', left, top + 42);

  // Navy, then a short run of gold — the logo's two colours.
  const ruleY = top + height + 4;
  const split = left + (right - left) * 0.8;
  doc.setLineWidth(2);
  doc.setDrawColor(...NAVY);
  doc.line(left, ruleY, split, ruleY);
  doc.setDrawColor(...GOLD);
  doc.line(split, ruleY, right, ruleY);
  doc.setLineWidth(1);
  return ruleY;
}

export interface ReceiptSpec {
  title: string;
  status: string;
  rows: [string, unknown][];
  fileName: string;
  /** Optional bank logo shown beside the status. */
  bankLogoUrl?: string | null;
}

/** A one-page receipt: letterhead, title, status, key/value lines. */
export async function buildReceipt(spec: ReceiptSpec, head: Letterhead): Promise<JsPdf> {
  const doc = await newDoc();
  const left = 48;
  const right = doc.internal.pageSize.getWidth() - 48;
  let y = await drawLetterhead(doc, head, left, right, 40);

  y += 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...INK);
  doc.text(spec.title, left, y);

  const status = (spec.status || '—').toUpperCase();
  const color = statusColor(status);
  doc.setFillColor(...color);
  doc.setFontSize(9.5);
  const pillW = doc.getTextWidth(status) + 26;
  doc.roundedRect(right - pillW, y - 15, pillW, 20, 10, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(status, right - pillW / 2, y - 1.5, { align: 'center' });

  if (spec.bankLogoUrl) {
    const logo = await imageAsDataUrl(spec.bankLogoUrl);
    if (logo) {
      try {
        const { width, height } = doc.getImageProperties(logo);
        const scale = Math.min(70 / width, 30 / height, 1);
        doc.addImage(logo, 'PNG', right - pillW - 16 - width * scale, y - 18, width * scale, height * scale);
      } catch {
        /* an image jsPDF can't read (e.g. SVG) is simply left out */
      }
    }
  }

  y += 22;
  doc.setDrawColor(...LINE);
  doc.line(left, y, right, y);
  y += 26;

  doc.setFontSize(10.5);
  for (const [label, value] of spec.rows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, left, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INK);
    doc.text(pdfText(value), right, y, { align: 'right', maxWidth: (right - left) * 0.62 });
    y += 10;
    doc.setDrawColor(241, 245, 249);
    doc.line(left, y, right, y);
    y += 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`Computer-generated receipt · ${new Date().toLocaleString('en-IN')}`, (left + right) / 2, y + 18, { align: 'center' });
  return doc;
}

export interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'right';
}

/**
 * A tabular report across as many pages as it takes: letterhead, title, period, then the rows.
 * Columns are sized by relative weight; wide reports switch to landscape.
 */
export async function buildTableReport(opts: {
  title: string;
  subtitle: string;
  columns: TableColumn[];
  rows: unknown[][];
  head: Letterhead;
  /** Optional per-cell colour, e.g. green profit. */
  cellColor?: (rowIndex: number, column: string) => RGB | null;
}): Promise<JsPdf> {
  const doc = await newDoc(opts.columns.length > 10 ? 'landscape' : 'portrait');
  const left = 36;
  const right = doc.internal.pageSize.getWidth() - 36;
  const pageH = doc.internal.pageSize.getHeight();

  const total = opts.columns.reduce((s, c) => s + c.width, 0);
  let cursor = left;
  const cols = opts.columns.map((c) => {
    const w = (c.width / total) * (right - left);
    const x = c.align === 'right' ? cursor + w - 4 : cursor;
    const col = { ...c, x, w };
    cursor += w;
    return col;
  });

  let y = await drawLetterhead(doc, opts.head, left, right, 32);
  y += 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text(opts.title, left, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(opts.subtitle, left, y);
  y += 24;

  const header = () => {
    doc.setFillColor(238, 243, 252);
    doc.rect(left, y - 12, right - left, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    cols.forEach((c) => doc.text(c.header.toUpperCase(), c.x + (c.align === 'right' ? 0 : 4), y + 1, { align: c.align ?? 'left' }));
    y += 22;
  };
  header();

  doc.setFontSize(7.8);
  opts.rows.forEach((row, ri) => {
    if (y > pageH - 40) {
      doc.addPage();
      y = 44;
      header();
      doc.setFontSize(7.8);
    }
    cols.forEach((c, ci) => {
      const raw = row[ci];
      const text = pdfText(c.header === 'Time' && typeof raw === 'string' && /T\d/.test(raw) ? compactDateTime(raw) : raw === '' ? '' : raw);
      doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
      doc.setTextColor(...(opts.cellColor?.(ri, c.header) ?? INK));
      const clipped = doc.splitTextToSize(text, c.w - 6)[0] ?? '';
      doc.text(clipped, c.x + (c.align === 'right' ? 0 : 4), y, { align: c.align ?? 'left' });
    });
    y += 6;
    doc.setDrawColor(241, 245, 249);
    doc.line(left, y, right, y);
    y += 11;
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${p} of ${pages}`, right, pageH - 20, { align: 'right' });
    doc.text(`Generated ${new Date().toLocaleString('en-IN')} · Indiyana Payments`, left, pageH - 20);
  }
  return doc;
}
