import { describe, it, expect } from 'vitest';
import { isStaleWrite } from './concurrency';

describe('isStaleWrite', () => {
  const now = new Date('2026-07-20T10:00:00.000Z');

  it('is not stale when the expected timestamp matches current', () => {
    expect(isStaleWrite(now, now.toISOString())).toBe(false);
    expect(isStaleWrite(now, now)).toBe(false);
  });

  it('is stale when another write moved updatedAt forward', () => {
    const older = '2026-07-20T09:59:00.000Z';
    expect(isStaleWrite(now, older)).toBe(true);
  });

  it('proceeds (not stale) when no precondition is supplied', () => {
    expect(isStaleWrite(now, undefined)).toBe(false);
    expect(isStaleWrite(now, null)).toBe(false);
    expect(isStaleWrite(now, '')).toBe(false);
  });

  it('proceeds when a timestamp is unparseable rather than blocking the write', () => {
    expect(isStaleWrite(now, 'not-a-date')).toBe(false);
  });

  it('compares by instant, not string form', () => {
    expect(isStaleWrite(now, '2026-07-20T10:00:00Z')).toBe(false);   // same instant, shorter form
  });
});
