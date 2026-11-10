// Which announcements this person has already been shown, on this browser.
//  - The popup opens the first time someone is signed in on a given calendar day (everything active).
//  - After that, only announcements they have not been shown yet pop up.
// Kept per person in localStorage, with an in-memory copy for browsers that block storage.

const dayKey = (userId: number) => `indiyan.announcements.day.${userId}`;
const knownKey = (userId: number) => `indiyan.announcements.known.${userId}`;
const memoryKnown = new Map<number, Set<number>>();

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function shownToday(userId: number): boolean {
  try {
    return localStorage.getItem(dayKey(userId)) === today();
  } catch {
    return false;
  }
}

export function markShownToday(userId: number) {
  try {
    localStorage.setItem(dayKey(userId), today());
  } catch {
    /* storage blocked — it may show again next load; harmless */
  }
}

export function knownIds(userId: number): Set<number> {
  const ids = new Set(memoryKnown.get(userId) ?? []);
  try {
    (JSON.parse(localStorage.getItem(knownKey(userId)) || '[]') as number[]).forEach((id) => ids.add(id));
  } catch {
    /* unreadable — fall back to this page load's memory */
  }
  return ids;
}

export function addKnownIds(userId: number, ids: number[]) {
  const all = knownIds(userId);
  ids.forEach((id) => all.add(id));
  memoryKnown.set(userId, all);
  try {
    localStorage.setItem(knownKey(userId), JSON.stringify([...all].slice(-500)));
  } catch {
    /* storage blocked */
  }
}
