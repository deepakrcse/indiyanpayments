import { buildReceipt, buildTableReport, type Letterhead } from '@/lib/export/pdf';
import { saveBlob, shareFile } from '@/lib/export/download';
import { buildXlsx, XLSX_MIME } from '@/lib/export/xlsx';
import type { ReceiptLines, ReportDefinition } from './types';

const exportColumns = <R,>(def: ReportDefinition<R>) => def.columns.filter((c) => c.only !== 'screen');

export function rowValues<R>(def: ReportDefinition<R>, r: R) {
  return exportColumns(def).map((c) => c.value(r) ?? '');
}

/** A real .xlsx workbook — references and UTRs stay exact, unlike CSV. */
export function exportExcel<R>(def: ReportDefinition<R>, rows: R[], fileStem: string) {
  const bytes = buildXlsx({ sheetName: def.label, headers: exportColumns(def).map((c) => c.header), rows: rows.map((r) => rowValues(def, r)) });
  saveBlob(new Blob([bytes as BlobPart], { type: XLSX_MIME }), `${fileStem}.xlsx`);
}

export async function exportPdf<R>(def: ReportDefinition<R>, rows: R[], fileStem: string, subtitle: string, head: Letterhead) {
  const cols = exportColumns(def);
  const doc = await buildTableReport({
    title: def.label,
    subtitle,
    head,
    columns: cols.map((c) => ({ header: c.header, width: c.width ?? 1, align: c.align })),
    rows: rows.map((r) => rowValues(def, r)),
    cellColor: (ri, header) => cols.find((c) => c.header === header)?.pdfColor?.(rows[ri]) ?? null,
  });
  doc.save(`${fileStem}.pdf`);
}

async function receiptDoc(lines: ReceiptLines, head: Letterhead, fileName: string) {
  return buildReceipt({ ...lines, fileName }, head);
}

export async function receiptAction(kind: 'print' | 'download' | 'share', lines: ReceiptLines, head: Letterhead, fileName: string) {
  const doc = await receiptDoc(lines, head, fileName);
  if (kind === 'download') return doc.save(fileName);
  if (kind === 'print') {
    doc.autoPrint();
    const win = window.open(doc.output('bloburl'), '_blank');
    if (!win) throw new Error('Allow pop-ups for this site to print the receipt.');
    return;
  }
  const text = [lines.title, ...lines.rows.map(([k, v]) => `${k}: ${v ?? '—'}`)].join('\n');
  await shareFile(doc.output('blob'), fileName, lines.title, text);
}
