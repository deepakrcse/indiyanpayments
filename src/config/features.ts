const on = (value: string | undefined, fallback: boolean) => (value === undefined || value === '' ? fallback : value === 'true');

/**
 * Feature switches. While a switch is on, its tiles and menu items are greyed out and its pages
 * say they are unavailable even if someone types the address. Reports of past payments are
 * never affected. Set the NEXT_PUBLIC_* variables to change them (needs a rebuild).
 */
export const features = {
  /** IMPS and credit card bill payments. */
  payOutDisabled: on(process.env.NEXT_PUBLIC_PAY_OUT_DISABLED, false),
  /** The Static QR tile on Home. Admin QR screens and QR reports are untouched. */
  staticQrDisabled: on(process.env.NEXT_PUBLIC_STATIC_QR_DISABLED, false),
} as const;
