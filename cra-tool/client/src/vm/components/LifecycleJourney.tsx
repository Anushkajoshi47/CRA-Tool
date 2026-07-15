import React from 'react';
import { getStages } from '../utils/lifecycleConfig';

// Overview of the vulnerability-handling lifecycle (VDMA CRA guideline).
// Stage names & descriptions are editable in VM Settings. Uses a wrapping
// grid so the strip always fits the frame — no horizontal scrolling.

const STAGE_STYLE: Record<string, { color: string; Icon: () => React.ReactElement }> = {
  receipt:      { color: '#60a5fa', Icon: InboxIcon },
  validation:   { color: '#818cf8', Icon: FilterIcon },
  verification: { color: '#a78bfa', Icon: ScaleIcon },
  remediation:  { color: '#f97316', Icon: WrenchIcon },
  advisory:     { color: '#f59e0b', Icon: MagnifierIcon },
  disclosure:   { color: '#00c8c8', Icon: MegaphoneIcon },
  reporting:    { color: '#00e676', Icon: FlagIcon },
  closed:       { color: '#646480', Icon: ArchiveIcon },
};

export default function LifecycleJourney() {
  const stages = getStages();

  return (
    <div className="card card-flat" style={{ padding: '22px 26px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>Vulnerability Handling Journey</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-2)', marginTop: 2 }}>
            How every report travels through the PSIRT process — editable in Settings
          </div>
        </div>
        <span className="mono" style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
          EU 2024/2847 · ART. 14
        </span>
      </div>

      {/* Journey strip — all stages on a single line, columns shrink to fit */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`, gap: '16px 8px' }}>
        {stages.map((s, i) => {
          const st = STAGE_STYLE[s.key] || STAGE_STYLE.receipt;
          return (
            <div
              key={s.key}
              className="fade-up"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, animationDelay: `${i * 70}ms` }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${st.color}`,
                background: `${st.color}14`,
                color: st.color,
                boxShadow: `0 0 14px ${st.color}22`,
              }}>
                <st.Icon />
              </div>
              <div style={{
                fontSize: 9, fontWeight: 800, color: st.color, textTransform: 'uppercase',
                letterSpacing: '0.06em', marginTop: 8, textAlign: 'center', lineHeight: 1.3,
              }}>
                {s.label}
              </div>
              <div className="mono" style={{ fontSize: 8, color: 'var(--text-3)', marginTop: 2 }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 8.5, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.45, marginTop: 4 }}>
                {s.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Urgent branch callout */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        marginTop: 18, padding: '10px 14px',
        background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.25)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <span style={{ color: 'var(--red)', display: 'flex', flexShrink: 0 }}><AlertIcon /></span>
        <span style={{ fontSize: 10.5, color: 'var(--text-2)', lineHeight: 1.5, flex: 1, minWidth: 220 }}>
          <strong style={{ color: 'var(--red)' }}>Classified Actively Exploitable?</strong>{' '}
          The case takes highest priority and the CRA Art. 14 clock starts immediately:
        </span>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['24h early warning', '72h notification', 'final report'].map(chip => (
            <span key={chip} className="mono" style={{
              fontSize: 8.5, fontWeight: 700, color: 'var(--red)',
              border: '1px solid rgba(248,113,113,0.35)', borderRadius: 20, padding: '3px 9px',
              whiteSpace: 'nowrap',
            }}>
              {chip}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/* ── Icons (16px stroke set) ─────────────────────────────────── */
function InboxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9.5h3l1 2h4l1-2h3" /><path d="M3.5 3.5h9l1.5 6v3.5h-12V9.5z" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5h12L9.5 9v4.5l-3-1.5V9z" />
    </svg>
  );
}
function MagnifierIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="7" cy="7" r="4" /><path d="M13.5 13.5 10 10" />
    </svg>
  );
}
function ScaleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2.5v11M4 4l-2.5 5a2.5 2.5 0 0 0 5 0zM12 4l-2.5 5a2.5 2.5 0 0 0 5 0zM5 13.5h6" /><path d="M4 4h8" />
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 4.5a3 3 0 0 1 4-2.8L11 4.2l.8 .8 2.5-2.5a3 3 0 0 1-4.1 4L5 11.7A1.5 1.5 0 1 1 2.9 9.6z" />
    </svg>
  );
}
function MegaphoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5v3l2 .5 1.5 3 1.5-.5-1-2.7L13 12V3.5L4 6z" />
    </svg>
  );
}
function ArchiveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="3.5" rx="1" /><path d="M3.5 6.5V13h9V6.5M6.5 9.5h3" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 14V2.5M3.5 3h9l-2 3 2 3h-9" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2 1.5 13.5h13z" /><path d="M8 6.5v3.5" /><circle cx="8" cy="12" r="0.3" fill="currentColor" />
    </svg>
  );
}
