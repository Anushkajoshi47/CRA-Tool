import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const REPORT_DL  = new Date('2026-09-11');
const ENFORCE_DL = new Date('2027-12-11');
const daysUntil  = (d: Date) => Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));

// ─── Inject keyframes once ────────────────────────────────────────────────────
if (!document.getElementById('cra-home-kf')) {
  const s = document.createElement('style');
  s.id = 'cra-home-kf';
  s.textContent = `
    @keyframes spinZ  { to { transform: rotateZ(360deg);  } }
    @keyframes spinZR { to { transform: rotateZ(-360deg); } }
    @keyframes floatY { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
    @keyframes orbPulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
  `;
  document.head.appendChild(s);
}

// ─── Particle network canvas ──────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<any>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const mouse = { x: -999, y: -999 };

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * W(), y: Math.random() * H(),
      z: Math.random(),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; };
    canvas.parentElement?.addEventListener('mousemove', onMove);
    canvas.parentElement?.addEventListener('mouseleave', onLeave);

    function tick() {
      ctx.clearRect(0, 0, W(), H());
      pts.forEach(p => {
        // gentle mouse attraction
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 160 && d > 0) { p.vx += (dx / d) * 0.007 * p.z; p.vy += (dy / d) * 0.007 * p.z; }

        // speed cap + move
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 0.7) { p.vx *= 0.96; p.vy *= 0.96; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W()) p.vx *= -1;
        if (p.y < 0 || p.y > H()) p.vy *= -1;
        p.x = Math.max(0, Math.min(W(), p.x));
        p.y = Math.max(0, Math.min(H(), p.y));

        // draw dot
        const r  = 1 + p.z * 2.2;
        const a  = 0.12 + p.z * 0.55;
        const c  = p.z > 0.55 ? `rgba(196,249,20,${a})` : `rgba(0,200,200,${a * 0.8})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = c; ctx.fill();

        // draw edges
        pts.forEach(o => {
          if (o === p) return;
          const ex = p.x - o.x, ey = p.y - o.y;
          const ed = Math.sqrt(ex * ex + ey * ey);
          if (ed < 115) {
            const la = (1 - ed / 115) * 0.13 * ((p.z + o.z) / 2);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = `rgba(196,249,20,${la})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(tick);
    }
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('mousemove', onMove);
      canvas.parentElement?.removeEventListener('mouseleave', onLeave);
    };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ─── 3D Compliance Orb ────────────────────────────────────────────────────────
const PILLARS = [
  { top: '7%',  left: '58%', label: 'Security',   color: '#c4f914' },
  { top: '52%', left: '84%', label: 'Vulns',       color: '#00c8c8' },
  { top: '80%', left: '26%', label: 'Reporting',   color: '#c4f914' },
  { top: '16%', left: '4%',  label: 'Docs',        color: '#00c8c8' },
];

function ComplianceOrb() {
  const ref = useRef<any>(null);
  const [rot, setRot] = useState({ x: 15, y: -12 });

  function onMove(e) {
    const r = ref.current.getBoundingClientRect();
    setRot({
      x: ((e.clientY - r.top  - r.height / 2) / r.height) * -38,
      y: ((e.clientX - r.left - r.width  / 2) / r.width)  *  38,
    });
  }

  const ring = (inset, tilt, dur, rev, border, dashed) => (
    /* tilt wrapper */
    <div style={{ position: 'absolute', inset, transform: tilt, transformStyle: 'preserve-3d' }}>
      {/* spinning child */}
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        border: `${dashed ? '1px dashed' : '1.5px solid'} ${border}`,
        animation: `${rev ? 'spinZR' : 'spinZ'} ${dur}s linear infinite`,
      }} />
    </div>
  );

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => setRot({ x: 15, y: -12 })}
      style={{ width: '300px', height: '300px', position: 'relative', flexShrink: 0, cursor: 'pointer' }}>

      {/* ambient glow */}
      <div style={{ position: 'absolute', inset: '20px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,249,20,0.13) 0%, transparent 70%)', filter: 'blur(18px)', animation: 'orbPulse 3s ease-in-out infinite' }} />

      {/* 3D rotating container */}
      <div style={{
        width: '100%', height: '100%',
        transform: `perspective(700px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        transition: 'transform 0.12s ease-out',
        transformStyle: 'preserve-3d',
        position: 'relative',
      }}>
        {ring('8px',  'rotateX(78deg)',              9,  false, 'rgba(196,249,20,0.28)', false)}
        {ring('8px',  'rotateY(78deg)',              7,  true,  'rgba(0,200,200,0.38)',  false)}
        {ring('28px', 'rotateX(50deg) rotateZ(30deg)', 13, false, 'rgba(196,249,20,0.15)', true)}
        {ring('48px', 'rotateY(50deg) rotateZ(-20deg)', 5, true, 'rgba(0,200,200,0.22)',  false)}

        {/* center sphere */}
        <div style={{
          position: 'absolute', inset: '74px', borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 32%, rgba(196,249,20,0.18), rgba(0,0,0,0.5))',
          border: '1.5px solid rgba(196,249,20,0.35)',
          boxShadow: '0 0 40px rgba(196,249,20,0.12) inset, 0 0 20px rgba(196,249,20,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        }}>
          <span style={{ fontSize: '34px', fontWeight: 800, color: '#c4f914', lineHeight: 1, letterSpacing: '-2px' }}>31</span>
          <span style={{ fontSize: '7.5px', color: 'rgba(196,249,20,0.5)', letterSpacing: '0.22em', marginTop: '4px' }}>CONTROLS</span>
        </div>

        {/* pillar labels */}
        {PILLARS.map(p => (
          <div key={p.label} style={{ position: 'absolute', top: p.top, left: p.left, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: p.color, boxShadow: `0 0 7px ${p.color}`, flexShrink: 0 }} />
            <span style={{ fontSize: '9px', color: p.color, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.85, whiteSpace: 'nowrap' }}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 3D tilt feature card ─────────────────────────────────────────────────────
function TiltCard({ no, title, body }) {
  const ref = useRef<any>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  function onMove(e) {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top)  / r.height;
    setTilt({ x: (py - 0.5) * -14, y: (px - 0.5) * 14 });
    setGlow({ x: px * 100, y: py * 100 });
  }
  function onLeave() { setTilt({ x: 0, y: 0 }); setGlow({ x: 50, y: 50 }); }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{
        background: 'var(--card)', padding: '28px 24px', position: 'relative', overflow: 'hidden',
        transform: `perspective(500px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
        transition: 'transform 0.1s ease-out', cursor: 'default', willChange: 'transform',
      }}>
      {/* moving shine spot */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.09,
        background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, #c4f914, transparent 55%)`,
      }} />
      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 700, marginBottom: '14px', letterSpacing: '0.05em' }}>{no}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.4 }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.75 }}>{body}</div>
    </div>
  );
}

// ─── Deadline block ───────────────────────────────────────────────────────────
function DeadlineBlock({ label, ref_, date, days, color, hex, urgent, right }: any) {
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

// ─── Home ─────────────────────────────────────────────────────────────────────
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
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(196,249,20,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L13.5 4v4.5c0 3.5-2.5 6-5.5 6.5-3-.5-5.5-3-5.5-6.5V4z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/><path d="M5.5 8.5l2 2 3.5-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>CRA Comply</span>
          <span style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 6px' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.02em' }}>Innomotics Medium Voltage Drives</span>
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
      <section style={{ padding: '80px 48px 80px', position: 'relative', overflow: 'hidden', minHeight: '520px', display: 'flex', alignItems: 'center' }}>
        {/* Canvas particle bg */}
        <ParticleCanvas />

        {/* Top edge glow line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(196,249,20,0.35), transparent)' }} />

        {/* 3D perspective grid floor */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(196,249,20,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(196,249,20,0.07) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          transform: 'perspective(380px) rotateX(68deg)',
          transformOrigin: 'bottom center',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
        }} />

        {/* Content: text left, orb right */}
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>

          {/* Left — text */}
          <div style={{ maxWidth: '520px', animation: 'fadeUp 0.7s ease both' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(196,249,20,0.06)', border: '1px solid rgba(196,249,20,0.18)', borderRadius: '20px', padding: '5px 14px', fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '32px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'orbPulse 2s ease-in-out infinite' }} />
              EU Cyber Resilience Act — Regulation (EU) 2024/2847
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.035em', color: 'var(--text)', marginBottom: '24px' }}>
              Enterprise CRA compliance<br />
              <span style={{ color: 'var(--accent)' }}>for the GH180.</span>
            </h1>

            <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.8, marginBottom: '44px' }}>
              Track all 31 EU Cyber Resilience Act requirements for the Innomotics
              Perfect Harmony GH180 medium voltage drive. Built for industrial teams.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(loggedIn ? '/dashboard' : '/signup')}>
                {loggedIn ? 'Open Dashboard' : 'Get started free'}
              </button>
              {!loggedIn && <button className="btn btn-ghost btn-lg" onClick={() => navigate('/login')}>Sign in</button>}
            </div>
          </div>

          {/* Right — 3D orb (hidden on very small screens) */}
          <div style={{ animation: 'fadeUp 0.9s 0.15s ease both', opacity: 0, animationFillMode: 'forwards' }}>
            <ComplianceOrb />
          </div>
        </div>
      </section>

      {/* Deadline strip */}
      <section style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 48px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr' }}>
          <DeadlineBlock label="Vulnerability Reporting" ref_="Article 14" date="11 Sep 2026" days={reportD} color="var(--warning)" hex="#f97316" urgent={reportD < 180} />
          <div style={{ background: 'var(--border)', margin: '24px 0' }} />
          <DeadlineBlock label="Full CRA Enforcement" ref_="Annex I" date="11 Dec 2027" days={enforceD} color="var(--accent)" hex="#c4f914" urgent={false} right />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 48px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div className="section-label" style={{ marginBottom: '24px' }}>Platform capabilities</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {[
            { no: '01', title: '31 CRA Requirements',  body: 'Pre-loaded across security properties, vulnerability handling, incident reporting, and documentation.' },
            { no: '02', title: 'Live Compliance Score', body: 'Per-product and per-pillar progress updated in real time as you mark requirements complete.' },
            { no: '03', title: 'Deadline Monitoring',   body: 'Live countdowns to September 2026 and December 2027 with urgent alerts under 180 days.' },
            { no: '04', title: 'Evidence Tracking',     body: 'Attach notes and evidence references to each requirement. Mark items for review.' },
          ].map(f => <TiltCard key={f.no} {...f} />)}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '16px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>CRA Comply — Innomotics Medium Voltage Drives</span>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>For awareness only. Not legal advice or formal certification.</span>
      </footer>
    </div>
  );
}
