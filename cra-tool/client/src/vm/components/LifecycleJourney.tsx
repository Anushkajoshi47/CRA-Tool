import React from 'react';

// Static, educational overview of the vulnerability-handling lifecycle
// (VDMA CRA guideline). Not per-ticket tracking — the "how our process
// works" strip on the VM dashboard, mirroring the CRA Compliance Journey.

const PHASES = [
  {
    n: '01', label: 'Receive', color: '#60a5fa',
    desc: 'Report arrives · ticket & acknowledgement to researcher',
    Icon: InboxIcon,
  },
  {
    n: '02', label: 'Validate', color: '#818cf8',
    desc: 'PSSE checks scope & plausibility per CVD policy',
    Icon: FilterIcon,
  },
  {
    n: '03', label: 'Verify', color: '#a78bfa',
    desc: 'Development reproduces it in our product',
    Icon: MagnifierIcon,
  },
  {
    n: '04', label: 'Assess Risk', color: '#f59e0b',
    desc: 'CVSS & exploitability under practical conditions',
    Icon: ScaleIcon,
  },
  {
    n: '05', label: 'Remediate', color: '#f97316',
    desc: 'Root cause → fix → deploy · loop until risk acceptable ↺',
    Icon: WrenchIcon,
  },
  {
    n: '06', label: 'Disclose', color: '#00c8c8',
    desc: 'Advisory published · users & researcher informed',
    Icon: MegaphoneIcon,
  },
  {
    n: '07', label: 'Report & Close', color: '#00e676',
    desc: 'ENISA reports filed · case archived',
    Icon: FlagIcon,
  },
];

export default function LifecycleJourney() {
  return (
    <div className="card card-flat" style={{ padding: '22px 26px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Vulnerability Handling Journey</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>
            How every report travels through the PSIRT process — per the VDMA CRA guideline
          </div>
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
          EU 2024/2847 · ART. 14
        </span>
      </div>

      {/* Journey strip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4 }}>
        {PHASES.map((p, i) => (
          <React.Fragment key={p.n}>
            {i > 0 && (
              <div style={{
                flex: 1, minWidth: 18, height: 2, marginTop: 21, borderRadius: 1,
                background: `linear-gradient(90deg, ${PHASES[i - 1].color}55, ${p.color}55)`,
              }} />
            )}
            <div
              className="fade-up"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 108, flexShrink: 0, animationDelay: `${i * 70}ms` }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${p.color}`,
                background: `${p.color}14`,
                color: p.color,
                boxShadow: `0 0 14px ${p.color}22`,
              }}>
                <p.Icon />
              </div>
              <div style={{
                fontSize: 10, fontWeight: 800, color: p.color, textTransform: 'uppercase',
                letterSpacing: '0.07em', marginTop: 9, textAlign: 'center', lineHeight: 1.3,
              }}>
                {p.label}
              </div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2 }}>{p.n}</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.45, marginTop: 5, maxWidth: 104 }}>
                {p.desc}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Urgent branch callout */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        marginTop: 18, padding: '10px 14px',
        background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.25)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <span style={{ fontSize: 12 }}>⚡</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.5, flex: 1, minWidth: 220 }}>
          <strong style={{ color: 'var(--red)' }}>Actively exploited?</strong>{' '}
          The case skips ahead to urgent verification and the CRA Art. 14 clock starts immediately:
        </span>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['24h early warning', '72h notification', 'final report'].map(chip => (
            <span key={chip} className="mono" style={{
              fontSize: 9.5, fontWeight: 700, color: 'var(--red)',
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
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9.5h3l1 2h4l1-2h3" /><path d="M3.5 3.5h9l1.5 6v3.5h-12V9.5z" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5h12L9.5 9v4.5l-3-1.5V9z" />
    </svg>
  );
}
function MagnifierIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="7" cy="7" r="4" /><path d="M13.5 13.5 10 10" />
    </svg>
  );
}
function ScaleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2.5v11M4 4l-2.5 5a2.5 2.5 0 0 0 5 0zM12 4l-2.5 5a2.5 2.5 0 0 0 5 0zM5 13.5h6" /><path d="M4 4h8" />
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 4.5a3 3 0 0 1 4-2.8L11 4.2l.8 .8 2.5-2.5a3 3 0 0 1-4.1 4L5 11.7A1.5 1.5 0 1 1 2.9 9.6z" />
    </svg>
  );
}
function MegaphoneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5v3l2 .5 1.5 3 1.5-.5-1-2.7L13 12V3.5L4 6z" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 14V2.5M3.5 3h9l-2 3 2 3h-9" />
    </svg>
  );
}
