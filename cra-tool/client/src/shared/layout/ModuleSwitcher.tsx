import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ModuleSwitcher() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isVm      = location.pathname.startsWith('/vm');

  function Pill({ label, path, active }) {
    return (
      <button
        onClick={() => navigate(path)}
        style={{
          flex: 1,
          padding: '5px 0',
          fontSize: 11.5,
          fontWeight: active ? 700 : 500,
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          background: active ? 'var(--accent)' : 'transparent',
          color: active ? '#000' : 'var(--text-2)',
          transition: 'all 150ms ease',
          fontFamily: 'var(--sans)',
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div style={{
      margin: '10px 12px',
      padding: 3,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      display: 'flex',
      gap: 2,
    }}>
      <Pill label="Compliance"   path="/cra/dashboard" active={!isVm} />
      <Pill label="Vuln. Mgmt"   path="/vm/tickets"  active={isVm}  />
    </div>
  );
}
