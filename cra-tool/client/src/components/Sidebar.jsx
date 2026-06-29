import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV = [
  { label: 'Dashboard',    path: '/dashboard',    Icon: GridIcon },
  { label: 'Products',     path: '/products',     Icon: BoxIcon },
  { label: 'Compliance',   path: '/compliance',   Icon: ShieldIcon },
  { label: 'Requirements', path: '/requirements', Icon: ListIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const email     = localStorage.getItem('email') || '';
  const name      = email ? email.split('@')[0] : 'User';
  const initial   = name ? name[0].toUpperCase() : 'U';

  const isActive = (p) => location.pathname === p || location.pathname.startsWith(p + '/');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/login');
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar">

        {/* Logo */}
        <Link to="/" className="sidebar-logo">
          <div className="sidebar-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L14 4.5v4c0 3-2.5 5.5-6 6-3.5-.5-6-3-6-6v-4z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M5.5 8l2 2 3-3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              CRA Comply
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-2)', fontWeight: 500, letterSpacing: '0.04em', marginTop: '2px' }}>
              Innomotics GH180
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '6px 10px', overflowY: 'auto' }}>
          <div className="nav-section-label">Main Menu</div>
          {NAV.map(({ label, path, Icon }) => (
            <Link key={path} to={path} className={`nav-link${isActive(path) ? ' active' : ''}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}

          <div className="nav-section-label" style={{ marginTop: '8px' }}>Regulation</div>
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,200,200,0.04)', border: '1px solid rgba(0,200,200,0.1)', marginBottom: '4px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              EU 2024/2847
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.5 }}>
              Cyber Resilience Act
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', marginTop: '4px' }}>
              Enforcement: Dec 2027
            </div>
          </div>
        </nav>

        {/* User profile card */}
        <div className="sidebar-user">
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div className="sidebar-avatar">{initial}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{name}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
              </div>
            </div>
            <button onClick={logout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '11.5px' }}>
              <LogoutIcon size={12} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {NAV.map(({ label, path, Icon }) => (
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
function BoxIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5.5L8 2.5l6 3v5L8 13.5 2 10.5V5.5z"/>
      <path d="M8 2.5v11M2 5.5l6 3 6-3"/>
    </svg>
  );
}
function ShieldIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L13.5 4v4.5c0 3.5-2.5 6-5.5 6.5-3-.5-5.5-3-5.5-6.5V4z"/>
      <path d="M5.5 8.5l2 2 3.5-4"/>
    </svg>
  );
}
function ListIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M6 4h8M6 8h8M6 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01"/>
    </svg>
  );
}
function LogoutIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/>
      <path d="M10.5 11.5L14 8l-3.5-3.5M14 8H6"/>
    </svg>
  );
}
