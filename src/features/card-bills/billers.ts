import type { Biller, BillerParam } from '@/types/bbps';

// Bank symbols for the BBPS credit card billers, from public sources: the open-source
// indian-banks logo set (keyed by the bank's 4-letter IFSC code), and Google's favicon service
// for the few banks that set does not cover. Keyed by the exact billerId — prefixes are shared
// ("BANK…" is BoB, Bank of India and Bank of Maharashtra), so a prefix alone would mislead.
const IFSC_LOGO = (code: string) => `https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/${code}/symbol.svg`;
const FAVICON = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const LOGOS: Record<string, string> = {
  AUBA00000NAT3Q: IFSC_LOGO('aubl'),
  AXIS00000NATKF: IFSC_LOGO('utib'),
  BAND00010NATWS: IFSC_LOGO('bdbl'),
  BANK00026NATRG: IFSC_LOGO('bkid'),
  BANK00000NAT0Q: IFSC_LOGO('mahb'),
  BANK00000NATKB: IFSC_LOGO('barb'),
  ONEB00000NATS1: IFSC_LOGO('barb'),
  CANA00000NATDO: IFSC_LOGO('cnrb'),
  CSBO00026NATWL: IFSC_LOGO('csbk'),
  EDGE00000NATWS: IFSC_LOGO('csbk'),
  CUBC00000NATGR: IFSC_LOGO('ciub'),
  DBSB00000NATPR: FAVICON('dbs.com'),
  DCBB00017NATCL: IFSC_LOGO('dcbl'),
  DHAN00000NAT6X: IFSC_LOGO('dlxb'),
  ESAF00000NATPB: IFSC_LOGO('esmf'),
  FEDE00000NATDL: IFSC_LOGO('fdrl'),
  HDFC00000NATW1: IFSC_LOGO('hdfc'),
  HDFC00000NATBH: IFSC_LOGO('hdfc'),
  HSBC00000NAT4M: FAVICON('hsbc.co.in'),
  ICIC00000NATSI: IFSC_LOGO('icic'),
  IDBI00000NAT7G: IFSC_LOGO('ibkl'),
  IDFC00000NATFQ: IFSC_LOGO('idfb'),
  INDI00000NATFA: IFSC_LOGO('idib'),
  INDI00000NAT8I: IFSC_LOGO('idib'),
  INDU00000NATL1: IFSC_LOGO('indb'),
  IOBC00000NATI3: IFSC_LOGO('ioba'),
  JAND00020NAT9D: IFSC_LOGO('jaka'),
  KOTA00000NATED: IFSC_LOGO('kkbk'),
  PUNJ00000NATEY: IFSC_LOGO('punb'),
  RBLB00000NATN3: IFSC_LOGO('ratn'),
  SBIC00000NATDN: IFSC_LOGO('sbin'),
  SLIC00016NAT9L: FAVICON('www.slice.bank.in'),
  SOUT00000NAT68: IFSC_LOGO('sibl'),
  TAMI00027NAT9C: IFSC_LOGO('tmbl'),
  UNIO00000NATG9: IFSC_LOGO('ubin'),
  YESB00000NAT8U: IFSC_LOGO('yesb'),
};

export const billerLogo = (billerId: string) => LOGOS[billerId] ?? null;

/** The largest issuers, shown first as a one-tap row — only those the API actually returned. */
export const POPULAR_BILLERS = [
  { id: 'HDFC00000NATW1', label: 'HDFC' },
  { id: 'SBIC00000NATDN', label: 'SBI Card' },
  { id: 'ICIC00000NATSI', label: 'ICICI' },
  { id: 'AXIS00000NATKF', label: 'Axis' },
  { id: 'KOTA00000NATED', label: 'Kotak' },
  { id: 'INDU00000NATL1', label: 'IndusInd' },
  { id: 'IDFC00000NATFQ', label: 'IDFC FIRST' },
  { id: 'RBLB00000NATN3', label: 'RBL' },
];

/** HDFC accepts no single payment above this. */
export const HDFC_LIMIT = 49_999;
export const isHdfc = (b: Biller) => /hdfc/i.test(`${b.billerId} ${b.billerName}`);

export type FieldKind = 'mobile' | 'card' | 'other';

export interface BillerField extends BillerParam {
  kind: FieldKind;
}

/** Each biller names its inputs differently; they are recognised by meaning so every bank gets the same clean form. */
function kindOf(p: BillerParam): FieldKind {
  const name = p.paramName.toLowerCase();
  if (/mobile/.test(name)) return 'mobile';
  if (/last\s*4|4\s*digit/.test(name)) return 'card';
  return 'other';
}

const ORDER: Record<FieldKind, number> = { card: 0, mobile: 1, other: 2 };

export const fieldsFor = (biller: Biller | null): BillerField[] =>
  [...(biller?.customerParams ?? [])].map((p) => ({ ...p, kind: kindOf(p) })).sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);

export function cleanValue(field: BillerField, raw: string): string {
  if (field.kind === 'mobile') {
    // A pasted "+91 98765 43210" or "098765 43210" keeps the number, not the prefix.
    return raw.replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, '').slice(0, 10);
  }
  if (field.kind === 'card') {
    const allowed = field.dataType === 'ALPHANUMERIC' ? /[^A-Za-z0-9]/g : /\D/g;
    return raw.replace(allowed, '').toUpperCase().slice(0, 4);
  }
  return field.dataType === 'NUMERIC' ? raw.replace(/\D/g, '') : raw;
}

export function fieldError(field: BillerField, value: string): string | null {
  if (!value) return field.optional ? null : 'Required.';
  if (field.kind === 'mobile' && !/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10-digit mobile number.';
  if (field.kind === 'card' && value.length !== 4) return 'Enter the last 4 digits of the card.';
  return null;
}

/** "HDFC Credit Card" -> "HD", "One - BOBCARD Credit Card" -> "BO". */
export function billerInitials(name: string): string {
  const words = name.replace(/^one\s*-\s*/i, '').split(/\s+/).filter((w) => !/^(bank|credit|card|of|the|ltd|limited|-)$/i.test(w));
  const first = words[0] ?? name;
  return (first.length > 1 && first === first.toUpperCase() ? first.slice(0, 2) : (words[0]?.[0] ?? '') + (words[1]?.[0] ?? first[1] ?? '')).toUpperCase();
}
