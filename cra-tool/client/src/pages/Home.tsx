import React from 'react';
import { useNavigate } from 'react-router-dom';

const REPORT_DL  = new Date('2026-09-11');
const ENFORCE_DL = new Date('2027-12-11');
const daysUntil  = (d: Date) => Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ no, title, body }: any) {
  return (
    <div style={{ background: 'var(--card)', padding: '26px 24px' }}>
      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 700, marginBottom: '12px', letterSpacing: '0.05em' }}>{no}</div>
      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.4 }}>{title}</div>
      <div style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

// ─── Deadline block ───────────────────────────────────────────────────────────
function DeadlineBlock({ label, ref_, date, days, color, urgent, right }: any) {
  return (
    <div style={{ padding: '32px 0', paddingLeft: right ? '40px' : '0', paddingRight: right ? '0' : '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>{ref_}</div>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-2)' }}>{date}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className={`mono${urgent ? ' urgent-pulse' : ''}`}
          style={{ fontSize: '44px', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-2px' }}>
          {days}
        </div>
        <div className="mono" style={{ fontSize: '9.5px', color: 'var(--text-3)', letterSpacing: '0.15em', marginTop: '3px' }}>DAYS</div>
      </div>
    </div>
  );
}

// ─── Module summary card (hero right side) ────────────────────────────────────
function ModuleCard({ eyebrow, title, points, color }: any) {
  return (
    <div className="card card-flat" style={{ padding: '20px 22px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: '9.5px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{eyebrow}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>{title}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {points.map((p: string) => (
          <li key={p} style={{ fontSize: '12px', color: 'var(--text-2)', display: 'flex', gap: '8px', lineHeight: 1.5 }}>
            <span style={{ color, flexShrink: 0 }}>—</span>{p}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate  = useNavigate();
  const loggedIn  = !!localStorage.getItem('token');
  const reportD   = daysUntil(REPORT_DL);
  const enforceD  = daysUntil(ENFORCE_DL);

  return (
    <div style={{ minHeight: 'var(--full-h)', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Topbar */}
      <header style={{ height: '60px', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50, background: 'var(--panel-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L13.5 4v4.5c0 3.5-2.5 6-5.5 6.5-3-.5-5.5-3-5.5-6.5V4z" stroke="var(--accent-contrast)" strokeWidth="1.5" strokeLinejoin="round"/><path d="M5.5 8.5l2 2 3.5-4" stroke="var(--accent-contrast)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>CRA Comply</span>
          <span style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 6px' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.02em' }}>Product Compliance & Vulnerability Management</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {loggedIn
            ? <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>Open Workspace</button>
            : <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/signup')}>Create account</button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Sign in</button>
              </>
          }
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '72px 48px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '48px', flexWrap: 'wrap' }}>

          {/* Left — text */}
          <div style={{ maxWidth: '500px', flex: '1 1 380px' }} className="fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)', borderRadius: '20px', padding: '5px 14px', fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '28px' }}>
              Regulation (EU) 2024/2847 — Cyber Resilience Act
            </div>

            <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 48px)', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: '20px' }}>
              CRA compliance and vulnerability handling, in one workspace.
            </h1>

            <p style={{ fontSize: '14.5px', color: 'var(--text-2)', lineHeight: 1.8, marginBottom: '36px' }}>
              Track every CRA requirement per product, run the PSIRT vulnerability
              process to the VDMA guideline, and meet the Article 14 reporting
              deadlines — with a full audit trail.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(loggedIn ? '/dashboard' : '/login')}>
                {loggedIn ? 'Open Workspace' : 'Sign in'}
              </button>
              {!loggedIn && <button className="btn btn-ghost btn-lg" onClick={() => navigate('/signup')}>Create account</button>}
            </div>
          </div>

          {/* Right — module summary */}
          <div style={{ flex: '1 1 320px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="fade-up">
            <ModuleCard
              eyebrow="Module 01 — Compliance"
              title="CRA Requirements Tracking"
              color="var(--accent)"
              points={[
                'All 31 requirements across the four Annex I pillars',
                'Per-product status, evidence notes, and review flags',
                'Live compliance score and deadline countdowns',
              ]}
            />
            <ModuleCard
              eyebrow="Module 02 — PSIRT"
              title="Vulnerability Management"
              color="#00c8c8"
              points={[
                'Guided case workflow per the VDMA CRA guideline',
                'CRA Art. 14 clocks — 24h / 72h / final report',
                'Security advisories and researcher communications',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Deadline strip */}
      <section style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 48px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr' }}>
          <DeadlineBlock label="Vulnerability Reporting" ref_="Article 14" date="11 Sep 2026" days={reportD} color="var(--warning)" urgent={reportD < 180} />
          <div style={{ background: 'var(--border)', margin: '24px 0' }} />
          <DeadlineBlock label="Full CRA Enforcement" ref_="Annex I" date="11 Dec 2027" days={enforceD} color="var(--accent)" urgent={false} right />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 48px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div className="section-label" style={{ marginBottom: '24px' }}>Platform capabilities</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {[
            { no: '01', title: '31 CRA Requirements',      body: 'Pre-loaded across security properties, vulnerability handling, incident reporting, and documentation.' },
            { no: '02', title: 'PSIRT Case Workflow',      body: 'Guided vulnerability lifecycle with decision tracking, standard researcher responses, and audit trail.' },
            { no: '03', title: 'Art. 14 Deadline Clocks',  body: 'Live 24-hour, 72-hour, and final-report countdowns from the moment active exploitation is confirmed.' },
            { no: '04', title: 'Advisories & Evidence',    body: 'Draft and publish security advisories; attach evidence and notes to every requirement and decision.' },
          ].map(f => <FeatureCard key={f.no} {...f} />)}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '16px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>CRA Comply · Internal compliance tool</span>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>For awareness only. Not legal advice or formal certification.</span>
      </footer>
    </div>
  );
}
