/* ── Theme mode (dark / light) ───────────────────────────────── */
// The light palette lives in styles/index.css under :root[data-theme="light"].
export type ThemeMode = 'dark' | 'light';

export function getTheme(): ThemeMode {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem('theme', mode);
}

export function initTheme() {
  document.documentElement.dataset.theme = getTheme();
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

// CSS variable values mirrored as JS constants for use in inline styles.
// The canonical source is styles/index.css — keep in sync if tokens change.
export const colors = {
  bg:       '#0a0a0f',
  sidebarBg:'#0d0d14',
  card:     '#111118',
  cardHi:   '#16161f',
  border:   '#1e1e2e',
  borderHi: '#2c2c40',
  accent:   '#E1F000',
  text:     '#f0f0f5',
  text2:    '#a8a8c8',
  text3:    '#646480',
  success:  '#00e676',
  warning:  '#f97316',
  amber:    '#f59e0b',
  red:      '#f87171',
  teal:     '#00c8c8',
};

// Colour per VM ticket status — used by StatusBadge and ClockWidget
export const STATUS_COLORS = {
  received:                  '#a8a8c8',
  validating:                '#60a5fa',
  invalid:                   '#f87171',
  verifying:                 '#a78bfa',
  not_reproducible:          '#f97316',
  assessing_risk:            '#f59e0b',
  not_exploitable:           '#00e676',
  confirming_active_exploit: '#ef4444',
  not_active:                '#a8a8c8',
  standard_remediation:      '#60a5fa',
  urgent_remediation:        '#f87171',
  risk_not_acceptable:       '#f87171',
  risk_acceptable:           '#00e676',
  advisory_published:        '#00e676',
  reported_to_authority:     '#00c8c8',
  closed:                    '#646480',
};
