// A minimal .xlsx writer: one sheet, a styled header row, column widths, a frozen header and a filter.
//
// Why not CSV: Excel guesses each CSV cell's type and turns digits-only cells into numbers —
// dropping leading zeros and keeping only 15 digits, so a 21-digit reference becomes 6.1E+19.
// In a workbook every cell carries its own type, so identifiers stay text and show exactly.

import { strToU8, zipSync } from 'fflate';

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;
const xmlText = (value: unknown) =>
  String(value ?? '')
    .replace(INVALID_XML, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** 0 -> A, 25 -> Z, 26 -> AA. */
export function columnName(index: number): string {
  let name = '';
  for (let n = index; n >= 0; n = Math.floor(n / 26) - 1) name = String.fromCharCode(65 + (n % 26)) + name;
  return name;
}

// Plain figures are numbers (so they sum and sort); identifiers stay text — long digit strings
// (references, UTRs, account numbers) and anything with a leading zero (a card ending 0011).
const isIdentifier = (t: string) => /^\d{11,}$/.test(t) || /^0\d+$/.test(t);
const isPlainNumber = (t: string) => /^-?\d+(\.\d+)?$/.test(t) && !isIdentifier(t) && t.length <= 15;

function cell(ref: string, value: unknown, style: number): string {
  const text = String(value ?? '');
  if (text === '') return style ? `<c r="${ref}" s="${style}"/>` : '';
  if (!style && isPlainNumber(text)) return `<c r="${ref}"><v>${text}</v></c>`;
  // Style 3 is the text format (@): the cell stays text even if edited.
  const s = style || (isIdentifier(text) ? 3 : 0);
  return `<c r="${ref}"${s ? ` s="${s}"` : ''} t="inlineStr"><is><t xml:space="preserve">${xmlText(text)}</t></is></c>`;
}

const STYLES = `${XML_HEAD}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF022C71"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

export function buildXlsx({ sheetName = 'Report', headers, rows }: { sheetName?: string; headers: string[]; rows: unknown[][] }): Uint8Array {
  const widths = headers.map((h, c) => Math.min(46, Math.max(9, Math.max(h.length + 2, ...rows.map((r) => String(r[c] ?? '').length)) + 2)));
  const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  const headerRow = `<row r="1" ht="22" customHeight="1">${headers.map((h, c) => cell(`${columnName(c)}1`, h, 1)).join('')}</row>`;
  const body = rows.map((row, i) => `<row r="${i + 2}">${headers.map((_, c) => cell(`${columnName(c)}${i + 2}`, row[c], 0)).join('')}</row>`).join('');
  const lastRef = `${columnName(headers.length - 1)}${rows.length + 1}`;

  const sheet = `${XML_HEAD}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${lastRef}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${cols}</cols>
<sheetData>${headerRow}${body}</sheetData>
<autoFilter ref="A1:${lastRef}"/>
</worksheet>`;

  // Excel limits sheet names to 31 characters and a few symbols.
  const safeName = xmlText(String(sheetName).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Report');

  return zipSync(
    {
      '[Content_Types].xml': strToU8(`${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
      '_rels/.rels': strToU8(`${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
      'xl/workbook.xml': strToU8(`${XML_HEAD}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeName}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
      'xl/_rels/workbook.xml.rels': strToU8(`${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
      'xl/styles.xml': strToU8(STYLES),
      'xl/worksheets/sheet1.xml': strToU8(sheet),
    },
    { level: 6 },
  );
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
