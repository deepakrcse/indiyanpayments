import 'server-only';
import { env } from '@/server/config/env';

/** Calendar parts of an instant as seen in a time zone. */
function partsIn(timeZone: string, at: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** The zone's offset from UTC at an instant, in milliseconds. */
function offsetMs(timeZone: string, at: Date): number {
  const p = partsIn(timeZone, at);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** "YYYY-MM-DD" for today (or `daysFromToday` away) in the portal's time zone. */
export function isoDateInZone(daysFromToday = 0, timeZone = env().APP_TIMEZONE): string {
  const p = partsIn(timeZone, new Date());
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + daysFromToday));
  return d.toISOString().slice(0, 10);
}

/**
 * The instant of the coming midnight in the portal's time zone. A sign-in lasts until then:
 * staff sign in once in the morning and are asked again the next day.
 */
export function nextMidnight(timeZone = env().APP_TIMEZONE): Date {
  const now = new Date();
  const p = partsIn(timeZone, now);
  const midnightAsUtc = Date.UTC(p.year, p.month - 1, p.day + 1, 0, 0, 0);
  return new Date(midnightAsUtc - offsetMs(timeZone, now));
}

/** "YYYY-MM-DD" in the portal's time zone for an instant (or `daysAway` from it). */
export function isoDateAt(at: number, daysAway = 0, timeZone = env().APP_TIMEZONE): string {
  const p = partsIn(timeZone, new Date(at));
  return new Date(Date.UTC(p.year, p.month - 1, p.day + daysAway)).toISOString().slice(0, 10);
}

/**
 * The instant for a zone-local timestamp with no offset ("2026-11-10T12:53:07.13"), the way the
 * payments service writes its times. Null when it cannot be read.
 */
export function zoneLocalToEpoch(local: string | null | undefined, timeZone = env().APP_TIMEZONE): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/.exec(local ?? '');
  if (!m) return null;
  const ms = m[7] ? Math.round(Number(`0.${m[7]}`) * 1000) : 0;
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6], ms);
  return naive - offsetMs(timeZone, new Date(naive));
}
