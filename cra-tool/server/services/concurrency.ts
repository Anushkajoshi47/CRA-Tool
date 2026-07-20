// Optimistic-concurrency guard for shared cases.
//
// Seven officers across China / US / Germany / India work the same caseload
// around the clock, so two of them editing or transitioning the SAME case
// within the same window is routine. Every case mutation bumps `updatedAt`,
// so a client that sends the `updatedAt` it last saw lets the server detect
// "someone changed this since you loaded it" and reject the stale write with
// a 409 instead of silently clobbering the other officer's work.
//
// When no precondition is supplied the write proceeds (backward-compatible),
// so this only ever adds safety, never breaks an un-migrated caller.

export function isStaleWrite(current: Date | string, expected?: string | Date | null): boolean {
  if (!expected) return false;
  const c = new Date(current).getTime();
  const e = new Date(expected).getTime();
  if (Number.isNaN(c) || Number.isNaN(e)) return false;
  return c !== e;
}

export const STALE_WRITE_MESSAGE =
  'This case was changed by another officer since you opened it. Reload to see the latest, then reapply your change.';
