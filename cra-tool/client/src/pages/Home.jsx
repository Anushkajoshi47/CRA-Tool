import React from 'react';
import { useNavigate } from 'react-router-dom';

const REPORT_DL  = new Date('2026-09-11');
const ENFORCE_DL = new Date('2027-12-11');
const daysUntil  = (d) => Math.max(0, Math.ceil((d - new Date()) / 86400000));

export default function Home() {
  const navigate  = useNavigate();
  const loggedIn  = !!localStorage.getItem('token');
  const reportD   = daysUntil(REPORT_DL);
  const enforceD  = daysUntil(ENFORCE_DL);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Topbar */}
      <header style={{ height: '60px', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,200,200,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L13.5 4v4.5c0 3.5-2.5 6-5.5 6.5-3-.5-5.5-3-5.5-6.5V4z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/><path d="M5.5 8.5l2 2 3.5-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>CRA Comply</span>
          <span style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 6px' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.02em' }}>Innomotics GH180</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {loggedIn
            ? <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>Open Dashboard</button>
            : <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign in</button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/signup')}>Get started</button>
              </>
          }
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient" style={{ padding: '100px 48px 88px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,200,200,0.4), transparent)' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,200,200,0.06)', border: '1px solid rgba(0,200,200,0.18)', borderRadius: '20px', padding: '5px 14px', fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
            EU Cyber Resilience Act — Regulation (EU) 2024/2847
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.035em', color: 'var(--text)', maxWidth: '720px', marginBottom: '24px' }}>
            Enterprise CRA compliance<br />
            <span style={{ color: 'var(--accent)' }}>for the GH180.</span>
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.8, maxWidth: '540px', marginBottom: '44px' }}>
            Track all 31 EU Cyber Resilience Act requirements for the Innomotics
            Perfect Harmony GH180 medium voltage drive. Built for industrial teams.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(loggedIn ? '/dashboard' : '/signup')}>
              {loggedIn ? 'Open Dashboard' : 'Get started free'}
            </button>
            {!loggedIn && (
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('/login')}>Sign in</button>
            )}
          </div>
        </div>
      </section>

      {/* Deadline strip */}
      <section style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 48px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr' }}>
          <DeadlineBlock label="Vulnerability Reporting" ref_="Article 14" date="11 Sep 2026" days={reportD} color="var(--warning)" hex="#f97316" urgent={reportD < 180} />
          <div style={{ background: 'var(--border)', margin: '24px 0' }} />
          <DeadlineBlock label="Full CRA Enforcement" ref_="Annex I" date="11 Dec 2027" days={enforceD} color="var(--accent)" hex="#00c8c8" urgent={false} right />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 48px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div className="section-label" style={{ marginBottom: '24px' }}>Platform capabilities</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {[
            { no: '01', title: '31 CRA Requirements', body: 'Pre-loaded across security properties, vulnerability handling, incident reporting, and documentation.' },
            { no: '02', title: 'Live Compliance Score', body: 'Per-product and per-pillar progress updated in real time as you mark requirements complete.' },
            { no: '03', title: 'Deadline Monitoring', body: 'Live countdowns to September 2026 and December 2027 with urgent alerts under 180 days.' },
            { no: '04', title: 'Evidence Tracking', body: 'Attach notes and evidence references to each requirement. Mark items for review.' },
          ].map(f => (
            <div key={f.no} style={{ background: 'var(--card)', padding: '28px 24px' }}>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 700, marginBottom: '14px', letterSpacing: '0.05em' }}>{f.no}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.4 }}>{f.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.75 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '16px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>CRA Comply — Innomotics Perfect Harmony GH180</span>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>For awareness only. Not legal advice or formal certification.</span>
      </footer>
    </div>
  );
}

function DeadlineBlock({ label, ref_, date, days, color, hex, urgent, right }) {
  return (
    <div style={{ padding: '32px 0', paddingLeft: right ? '40px' : '0', paddingRight: right ? '0' : '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>{ref_}</div>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-2)' }}>{date}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className={`mono${urgent ? ' urgent-pulse' : ''}`}
          style={{ fontSize: '44px', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-2px', filter: `drop-shadow(0 0 12px ${hex}44)` }}>
          {days}
        </div>
        <div className="mono" style={{ fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.15em', marginTop: '3px' }}>DAYS</div>
      </div>
    </div>
  );
}
