/* ── Display timezone (team spans several regions) ──────────────
   Every timestamp is stored as UTC. This module holds the single
   preference for which zone times are *shown* in across the whole app,
   plus formatters and a hook so any component re-renders when it changes. */
import { useSyncExternalStore } from 'react';

export interface Zone { id: string; label: string; }

// 'local' = the viewer's own browser zone. The rest are the team's regions.
export const TIMEZONES: Zone[] = [
  { id: 'local',            label: 'My local time' },
  { id: 'Europe/Berlin',    label: 'Germany (CET/CEST)' },
  { id: 'Asia/Kolkata',     label: 'India (IST)' },
  { id: 'Asia/Shanghai',    label: 'China (CST)' },
  { id: 'America/New_York', label: 'US East (ET)' },
];

const KEY = 'vm.timezone';
let current = readStored();
const listeners = new Set<() => void>();

function readStored(): string {
  try { return localStorage.getItem(KEY) || 'local'; } catch { return 'local'; }
}

export function getTimezone(): string { return current; }

export function setTimezone(id: string): void {
  current = id;
  try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
  listeners.forEach(l => l());
}

export function zoneLabel(id: string): string {
  return TIMEZONES.find(z => z.id === id)?.label ?? id;
}

// A named IANA zone, or undefined to mean the browser's local zone.
function resolve(tz: string): string | undefined { return tz === 'local' ? undefined : tz; }

export function fmtDateTime(iso?: string | null, tz: string = current): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    timeZone: resolve(tz), day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

export function fmtDate(iso?: string | null, tz: string = current): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    timeZone: resolve(tz), day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function fmtTime(iso?: string | null, tz: string = current): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', {
    timeZone: resolve(tz), hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

/* ── Zoned entry helpers (for editing a time in a chosen zone) ── */
// Stored UTC ISO → "YYYY-MM-DDTHH:mm" wall clock in `tz` (for datetime-local).
export function toZonedInput(iso: string | undefined, tz: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: resolve(tz), year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d).replace(' ', 'T');
}

// "YYYY-MM-DDTHH:mm" typed as wall-clock in `tz` → the matching UTC ISO.
export function zonedInputToISO(local: string, tz: string): string {
  if (!local) return '';
  const asUTC = new Date(local + ':00Z');
  if (isNaN(asUTC.getTime())) return '';
  const wall = new Intl.DateTimeFormat('sv-SE', {
    timeZone: resolve(tz), year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(asUTC).replace(' ', 'T');
  const offset = new Date(wall + 'Z').getTime() - asUTC.getTime();
  return new Date(asUTC.getTime() - offset).toISOString();
}

/* ── React hooks ─────────────────────────────────────────────── */
function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

export function useTimezone(): string {
  return useSyncExternalStore(subscribe, getTimezone, getTimezone);
}

// Formatters bound to the active zone; the component re-renders on change.
export function useTimeFmt() {
  const tz = useTimezone();
  return {
    tz,
    dateTime: (iso?: string | null) => fmtDateTime(iso, tz),
    date:     (iso?: string | null) => fmtDate(iso, tz),
    time:     (iso?: string | null) => fmtTime(iso, tz),
  };
}
