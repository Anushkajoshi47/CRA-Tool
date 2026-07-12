import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ModuleSwitcher from './ModuleSwitcher';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../ThemeToggle';

const VM_NAV = [
  { label: 'Dashboard',         path: '/vm',              Icon: GridIcon },
  { label: 'Ticket Queue',      path: '/vm/tickets',      Icon: QueueIcon },
  { label: 'Log Vulnerability', path: '/vm/tickets/new',  Icon: PlusIcon  },
  { label: 'Advisories',        path: '/vm/advisories',   Icon: ShieldIcon },
  { label: 'Settings',          path: '/settings',        Icon: GearIcon },
];

export default function VmSidebar() {
  const location                = useLocation();
  const { email, name, logout } = useAuth();
  const initial                 = name[0]?.toUpperCase() || 'U';

  // Exact match for /vm (dashboard) and /new so they don't bleed into other routes
  const isActive = (p) =>
    p === '/vm' || p === '/vm/tickets/new'
      ? location.pathname === p
      : location.pathname === p || location.pathname.startsWith(p + '/');

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <Link to="/dashboard" className="sidebar-logo">
          <div className="sidebar-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L14 4.5v4c0 3-2.5 5.5-6 6-3.5-.5-6-3-6-6v-4z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M5.5 8l2 2 3-3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              CRA Comply
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-2)', fontWeight: 500, letterSpacing: '0.04em', marginTop: 2 }}>
              Innomotics GH180
            </div>
          </div>
        </Link>

        {/* Module switcher */}
        <ModuleSwitcher />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px 10px', overflowY: 'auto' }}>
          <div className="nav-section-label">Vuln. Management</div>
          {VM_NAV.map(({ label, path, Icon }) => (
            <Link key={path} to={path} className={`nav-link${isActive(path) ? ' active' : ''}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}

          <div className="nav-section-label" style={{ marginTop: 8 }}>Regulation</div>
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(248,113,113,0.04)',
            border: '1px solid rgba(248,113,113,0.12)',
            marginBottom: 4,
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              CRA Art. 14
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Vulnerability Handling
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#f87171', marginTop: 4 }}>
              24h / 72h / 14-day
            </div>
          </div>
        </nav>

        {/* User */}
        <div className="sidebar-user">
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div className="sidebar-avatar">{initial}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={logout}
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, justifyContent: 'center', fontSize: 11.5 }}
              >
                Sign Out
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="mobile-nav">
        {VM_NAV.filter(n => n.path !== '/vm/tickets/new').map(({ label, path, Icon }) => (
          <Link key={path} to={path} className={`mobile-nav-item${isActive(path) ? ' active' : ''}`}>
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

/* ── Icons ──────────────────────────────────────────────────── */
function GridIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5"/>
      <rect x="9"   y="1.5" width="5.5" height="5.5" rx="1.5"/>
      <rect x="1.5" y="9"   width="5.5" height="5.5" rx="1.5"/>
      <rect x="9"   y="9"   width="5.5" height="5.5" rx="1.5"/>
    </svg>
  );
}
function GearIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.2"/>
      <path d="M13.2 8c0-.4 0-.8-.1-1.1l1.4-1.1-1.3-2.2-1.7.6c-.6-.5-1.2-.9-1.9-1.1L9.3 1.3H6.7l-.3 1.8c-.7.2-1.3.6-1.9 1.1l-1.7-.6-1.3 2.2 1.4 1.1c-.1.3-.1.7-.1 1.1s0 .8.1 1.1l-1.4 1.1 1.3 2.2 1.7-.6c.6.5 1.2.9 1.9 1.1l.3 1.8h2.6l.3-1.8c.7-.2 1.3-.6 1.9-1.1l1.7.6 1.3-2.2-1.4-1.1c.1-.3.1-.7.1-1.1z"/>
    </svg>
  );
}
function QueueIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="2" y="2.5" width="12" height="2" rx="1"/>
      <rect x="2" y="7"   width="12" height="2" rx="1"/>
      <rect x="2" y="11.5" width="8"  height="2" rx="1"/>
    </svg>
  );
}
function PlusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 3v10M3 8h10"/>
    </svg>
  );
}
function ShieldIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L13.5 4v4.5c0 3.5-2.5 6-5.5 6.5-3-.5-5.5-3-5.5-6.5V4z"/>
      <path d="M8 6v3M8 11h.01"/>
    </svg>
  );
}
