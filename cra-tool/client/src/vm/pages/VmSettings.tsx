import React, { useState } from 'react';
import { getStages, saveStages, resetStages, DEFAULT_STAGES, StageConfig } from '../utils/lifecycleConfig';
import { getTheme, applyTheme, ThemeMode } from '../../shared/theme';

// Settings for the Vulnerability Management workspace: the editable
// lifecycle (stage names & descriptions) and appearance.

export default function VmSettings() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="section-label" style={{ marginBottom: 6 }}>Vulnerability Management</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>
          Customize how the vulnerability-handling lifecycle is presented across the VM workspace.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <LifecycleEditor />
        <AppearanceSection />
      </div>
    </div>
  );
}

/* ── Lifecycle stage editor ──────────────────────────────────── */
function LifecycleEditor() {
  const [stages, setStages]   = useState<StageConfig[]>(getStages());
  const [message, setMessage] = useState('');

  function update(key: string, field: 'label' | 'desc', value: string) {
    setStages(prev => prev.map(s => (s.key === key ? { ...s, [field]: value } : s)));
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
    <section className="card card-flat" style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Lifecycle Stages</h2>
        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '4px 0 14px', lineHeight: 1.55 }}>
          Rename stages and edit their descriptions — changes apply everywhere the lifecycle is shown
          (dashboard journey, case progress bar, status badges). The underlying workflow and its rules are unchanged.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.map((s, i) => {
          const def = DEFAULT_STAGES[i];
          return (
            <div key={s.key} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 10, alignItems: 'start' }}>
                <div>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                    Stage Name
                  </label>
                  <input
                    className="input"
                    value={s.label}
                    onChange={e => update(s.key, 'label', e.target.value)}
                    placeholder={def.label}
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input
                    className="input"
                    value={s.desc}
                    onChange={e => update(s.key, 'desc', e.target.value)}
                    placeholder={def.desc}
                  />
                </div>
              </div>
              {(s.label !== def.label || s.desc !== def.desc) && (
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>
                  Default: {def.label} — {def.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {message && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 12 }}>{message}</div>}

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={save}>Save Lifecycle</button>
        <button className="btn btn-ghost btn-sm" onClick={reset}>Reset to Defaults</button>
      </div>
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
    <section className="card card-flat" style={{ padding: '20px 24px' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>Appearance</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => choose(o.value)}
            className="card card-flat"
            style={{
              padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
              border: `1px solid ${mode === o.value ? 'var(--accent)' : 'var(--border)'}`,
              background: mode === o.value ? 'var(--accent-dim)' : 'var(--card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${mode === o.value ? 'var(--accent)' : 'var(--text-3)'}`,
                background: mode === o.value ? 'var(--accent)' : 'transparent',
              }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{o.label}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{o.desc}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
