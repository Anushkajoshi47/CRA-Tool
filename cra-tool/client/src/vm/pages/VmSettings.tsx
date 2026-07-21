import React, { useState } from 'react';
import { getStages, saveStages, resetStages, DEFAULT_STAGES, StageConfig } from '../utils/lifecycleConfig';
import { getTheme, applyTheme, ThemeMode } from '../../shared/theme';
import { Stack, Row, Grid } from '../../components/primitives/layout';
import s from './VmSettings.module.css';

// Settings for the Vulnerability Management workspace: the editable
// lifecycle (stage names & descriptions) and appearance.

export default function VmSettings() {
  return (
    <div className={s.page}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Vulnerability Management</div>
        <h1 className={s.title}>Settings</h1>
        <p className={s.subtitle}>
          Customize how the vulnerability-handling lifecycle is presented across the VM workspace.
        </p>
      </div>

      <Stack gap={6}>
        <LifecycleEditor />
        <AppearanceSection />
      </Stack>
    </div>
  );
}

/* ── Lifecycle stage editor ──────────────────────────────────── */
function LifecycleEditor() {
  const [stages, setStages]   = useState<StageConfig[]>(getStages());
  const [message, setMessage] = useState('');

  function update(key: string, field: 'label' | 'desc', value: string) {
    setStages(prev => prev.map(st => (st.key === key ? { ...st, [field]: value } : st)));
    setMessage('');
  }

  function save() {
    saveStages(stages);
    setStages(getStages());
    setMessage('Lifecycle saved. Stage names and descriptions now apply across the dashboard, stepper, and case pages.');
  }

  function reset() {
    resetStages();
    setStages(getStages());
    setMessage('Lifecycle reset to defaults.');
  }

  return (
    <section className={`card card-flat ${s.section}`}>
      <h2 className={s.sectionTitle}>Lifecycle Stages</h2>
      <p className={s.sectionDesc}>
        Rename stages and edit their descriptions — changes apply everywhere the lifecycle is shown
        (dashboard journey, case progress bar, status badges). The underlying workflow and its rules are unchanged.
      </p>

      <Stack gap={2}>
        {stages.map((st, i) => {
          const def = DEFAULT_STAGES[i];
          return (
            <div key={st.key} className={`card ${s.stageCard}`}>
              <div className={s.stageGrid}>
                <div>
                  <label className={`label ${s.stageNumLabel}`}>
                    <span className={`mono ${s.stageNum}`}>{String(i + 1).padStart(2, '0')}</span>
                    Stage Name
                  </label>
                  <input className="input" value={st.label} onChange={e => update(st.key, 'label', e.target.value)} placeholder={def.label} />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input className="input" value={st.desc} onChange={e => update(st.key, 'desc', e.target.value)} placeholder={def.desc} />
                </div>
              </div>
              {(st.label !== def.label || st.desc !== def.desc) && (
                <div className={s.stageDefault}>Default: {def.label} — {def.desc}</div>
              )}
            </div>
          );
        })}
      </Stack>

      {message && <div className={s.saved}>{message}</div>}

      <Row gap={2} style={{ marginTop: 'var(--space-4)' }}>
        <button className="btn btn-primary btn-sm" onClick={save}>Save Lifecycle</button>
        <button className="btn btn-ghost btn-sm" onClick={reset}>Reset to Defaults</button>
      </Row>
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
