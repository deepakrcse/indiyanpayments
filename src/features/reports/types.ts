import type { ComponentType, ReactNode } from 'react';

export interface ReportParams {
  fromDate: string;
  toDate: string;
  /** Only sent by admins: a customer's wallet, or 0 for every wallet. */
  walletId?: number;
  status?: string;
}

export interface ReportColumn<R> {
  header: string;
  /** What the table shows. Defaults to `value`. */
  cell?: (r: R) => ReactNode;
  /** The flat value exported to Excel/PDF and matched by search. */
  value: (r: R) => string | number | null | undefined;
  align?: 'left' | 'right';
  /** Relative width in the PDF. */
  width?: number;
  /** Shown on screen only, or exported only. */
  only?: 'screen' | 'export';
  /** Colour in the PDF (e.g. green profit). */
  pdfColor?: (r: R) => [number, number, number] | null;
}

export interface ReceiptLines {
  title: string;
  status: string;
  rows: [string, unknown][];
}

export interface ReportDefinition<R = unknown> {
  key: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  /** Where Back goes when the report was opened directly. */
  parent: 'reports' | 'admin';
  fetch: (p: ReportParams) => Promise<R[]>;
  columns: ReportColumn<R>[];
  rowKey: (r: R, index: number) => string | number;
  /** Extra text a row matches on, beyond its columns. */
  searchText?: (r: R) => (string | null | undefined)[];
  statusOptions?: string[];
  /** The admin picks one retailer whose wallet the report reads. */
  needsCustomer?: boolean;
  /** The endpoint ignores dates, so rows are narrowed to the range here. */
  clientDateFilter?: (r: R) => string | null;
  /** Rows that can be re-checked with the bank. */
  pending?: { isPending: (r: R) => boolean; reference: (r: R) => string; id: (r: R) => number };
  receipt?: (r: R) => ReceiptLines;
  /** Admin: refund a row. */
  refundable?: boolean;
  /** Show the rows as two tables side by side. */
  split?: { label: string; tone: 'success' | 'warning'; test: (r: R) => boolean }[];
}
