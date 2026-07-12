import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = localStorage.getItem('email') || '';

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/login');
  }

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    color: isActive(path) ? '#C8D400' : '#a0a0b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive(path) ? 600 : 400,
    fontFamily: 'Inter, sans-serif',
    padding: '4px 0',
    borderBottom: isActive(path) ? '2px solid #C8D400' : '2px solid transparent',
    transition: 'color 0.15s',
  });

  return (
    <nav style={{
      background: '#0f0f1a',
      borderBottom: '1px solid #22223a',
      padding: '0 32px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
        <Link to="/" style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          fontSize: '18px',
          color: '#C8D400',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
        }}>
          ⚡ CRA Comply
        </Link>
        <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
          <Link to="/products" style={linkStyle('/products')}>Products</Link>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {email && <span style={{ color: '#6b6b8a', fontSize: '13px' }}>{email}</span>}
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid #22223a',
            color: '#a0a0b8',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
