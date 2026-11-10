// Customers this retailer has made links for before — the name and the card's last four digits
// only, the same two values every report already shows — so a returning card needs no retyping.
// The full card number, expiry and CVV are entered on the gateway's page and never pass through here.

export interface SavedPayer {
  name: string;
  card: string;
}

const MAX = 8;
const key = (walletId: number) => `indiyan.pg.payers.${walletId}`;

export const LAST_REFERENCE_KEY = 'indiyan.pg.lastReference';

export function loadPayers(walletId: number): SavedPayer[] {
  try {
    const list = JSON.parse(localStorage.getItem(key(walletId)) || '[]');
    return Array.isArray(list) ? list.filter((p) => p?.name && /^\d{4}$/.test(p.card)) : [];
  } catch {
    return [];
  }
}

export function savePayer(walletId: number, name: string, card: string): SavedPayer[] {
  const rest = loadPayers(walletId).filter((p) => !(p.name.toLowerCase() === name.toLowerCase() && p.card === card));
  const next = [{ name, card }, ...rest].slice(0, MAX);
  try {
    localStorage.setItem(key(walletId), JSON.stringify(next));
  } catch {
    /* storage unavailable — the form just isn't prefilled next time */
  }
  return next;
}

export function rememberReference(reference: string) {
  try {
    localStorage.setItem(LAST_REFERENCE_KEY, reference);
  } catch {
    /* storage unavailable */
  }
}
