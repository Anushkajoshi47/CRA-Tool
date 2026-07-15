import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';

const APPS = [
  {
    key: 'cra',
    title: 'CRA Comply',
    subtitle: 'EU Cyber Resilience Act',
    desc: 'Track all 31 CRA requirements, manage products, and monitor compliance progress for the GH180.',
    color: '#c4f914',
    dim: 'rgba(196,249,20,0.08)',
    path: '/cra/dashboard',
    Icon: ShieldIcon,
  },
  {
    key: 'vm',
    title: 'Vulnerability Management',
    subtitle: 'Ticketing & Advisories',
    desc: 'Log vulnerabilities, track remediation tickets, and manage public security advisories.',
    color: '#00c8c8',
    dim: 'rgba(0,200,200,0.08)',
    path: '/vm',
    Icon: TicketIcon,
  },
];

export default function AppHub() {
  const navigate    = useNavigate();
  const { email, logout } = useAuth();
  const name  = email ? email.split('@')[0] : 'User';

  return (
    <div style={{ minHeight: 'var(--full-h)', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ height: '60px', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          CRA Comply <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>/ Platform</span>
        </span>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Welcome back, <span style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{name}</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Choose a workspace
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '760px', width: '100%' }}>
          {APPS.map(app => (
            <button key={app.key} onClick={() => navigate(app.path)} className="card card-click"
              style={{ padding: '32px 28px', textAlign: 'left', border: `1px solid var(--border)`, background: 'var(--card)', cursor: 'pointer' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: app.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <app.Icon size={20} color={app.color} />
              </div>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: app.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                {app.subtitle}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', letterSpacing: '-0.01em' }}>
                {app.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                {app.desc}
              </div>
              <div style={{ marginTop: '20px', fontSize: '11.5px', fontWeight: 700, color: app.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                Open workspace
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2.5L8 6l-4 3.5"/></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShieldIcon({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L13.5 4v4.5c0 3.5-2.5 6-5.5 6.5-3-.5-5.5-3-5.5-6.5V4z"/>
      <path d="M5.5 8.5l2 2 3.5-4"/>
    </svg>
  );
}
function TicketIcon({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6a1.5 1.5 0 000 3v1.5A1.5 1.5 0 003.5 12h9a1.5 1.5 0 001.5-1.5V9a1.5 1.5 0 000-3V4.5A1.5 1.5 0 0012.5 3h-9A1.5 1.5 0 002 4.5V6z"/>
      <path d="M6.5 3v9" strokeDasharray="1.5 1.5"/>
    </svg>
  );
}
