import React, { useState } from 'react';
import { getTheme, applyTheme, ThemeMode } from '../../shared/theme';
import { TIMEZONES, getTimezone, setTimezone, fmtDateTime } from '../../shared/timezone';
import { Stack, Row, Grid } from '../../components/primitives/layout';
import s from './VmSettings.module.css';

// Settings for the Vulnerability Management workspace: display timezone
// and appearance.

export default function VmSettings() {
  return (
    <div className={s.page}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Vulnerability Management</div>
        <h1 className={s.title}>Settings</h1>
        <p className={s.subtitle}>
          Preferences for the VM workspace — how times are shown and the app's appearance.
        </p>
      </div>

      <Stack gap={6}>
        <TimezoneSection />
        <AppearanceSection />
      </Stack>
    </div>
  );
}

/* ── Display timezone ────────────────────────────────────────── */
function TimezoneSection() {
  const [tz, setTz] = useState(getTimezone());
  const now = new Date().toISOString();

  function choose(id: string) {
    setTimezone(id);
    setTz(id);
  }

  return (
    <section className={`card card-flat ${s.section}`}>
      <h2 className={s.sectionTitle}>Display Timezone</h2>
      <p className={s.sectionDesc}>
        The team works across regions, so pick the zone all dates and times are shown in throughout
        the app. Times are always stored in UTC — this only changes how they're displayed for you.
      </p>

      <Grid min="220px" gap={3}>
        {TIMEZONES.map(z => {
          const active = tz === z.id;
          return (
            <button key={z.id} onClick={() => choose(z.id)} className={`card card-flat ${s.themeCard}`} data-active={active}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <span className={s.themeDot} data-active={active} />
                <span className={s.themeLabel}>{z.label}</span>
              </div>
              <div className={`mono ${s.themeDesc}`}>{fmtDateTime(now, z.id)}</div>
            </button>
          );
        })}
      </Grid>
    </section>
  );
}

/* ── Appearance ──────────────────────────────────────────────── */
function AppearanceSection() {
  const [mode, setMode] = useState<ThemeMode>(getTheme());

  function choose(m: ThemeMode) {
    applyTheme(m);
    setMode(m);
  }

  const OPTIONS: { value: ThemeMode; label: string; desc: string }[] = [
    { value: 'dark',  label: 'Dark',  desc: 'Default — high-contrast dark workspace.' },
    { value: 'light', label: 'Light', desc: 'Corporate light theme for offices and projectors.' },
  ];

  return (
    <section className={`card card-flat ${s.section}`}>
      <h2 className={s.appearanceTitle}>Appearance</h2>
      <Grid min="200px" gap={3}>
        {OPTIONS.map(o => {
          const active = mode === o.value;
          return (
            <button key={o.value} onClick={() => choose(o.value)} className={`card card-flat ${s.themeCard}`} data-active={active}>
              <Row gap={2} style={{ marginBottom: 'var(--space-1)' }}>
                <span className={s.themeDot} data-active={active} />
                <span className={s.themeLabel}>{o.label}</span>
              </Row>
              <div className={s.themeDesc}>{o.desc}</div>
            </button>
          );
        })}
      </Grid>
    </section>
  );
}
