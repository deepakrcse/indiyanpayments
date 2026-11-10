/** Formats shared by the forms and the API — one definition, so the two never disagree. */
export const PATTERNS = {
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  aadhaar: /^\d{12}$/,
  gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  indianMobile: /^[6-9]\d{9}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  accountNumber: /^\d{9,18}$/,
  pin4: /^\d{4}$/,
  transferPin: /^\d{4,6}$/,
  isoDate: /^\d{4}-\d{2}-\d{2}$/,
  /** A gateway reference number as the status page accepts it. */
  reference: /^[A-Za-z0-9_-]{6,64}$/,
} as const;

export const MESSAGES = {
  pan: 'Enter a valid PAN, e.g. AAAAA0000A.',
  aadhaar: 'Aadhaar must be exactly 12 digits.',
  gstin: 'Enter a valid 15-character GSTIN.',
  indianMobile: 'Enter a valid 10-digit Indian mobile number.',
  ifsc: 'Enter a valid IFSC code, e.g. SBIN0013351.',
  accountNumber: 'Enter a valid account number.',
  amount: 'Enter a valid amount.',
} as const;

/** Keeps a typed amount to digits and one decimal point, with at most `decimals` places. */
export function sanitizeAmount(raw: string, decimals = 2): string | null {
  const v = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  const re = new RegExp(`^\\d*(\\.\\d{0,${decimals}})?$`);
  return re.test(v) ? v : null;
}

/** "+91 98765 43210" / "098765 43210" -> "9876543210". */
export function sanitizeMobile(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}
