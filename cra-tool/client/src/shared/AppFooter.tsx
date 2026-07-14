import React from 'react';

export const APP_VERSION = '1.0.0';

// Slim corporate footer rendered inside both app shells.
export default function AppFooter() {
  return (
    <footer style={{
      padding: '14px 40px',
      borderTop: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      marginTop: 40,
    }}>
      <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
        CRA Comply v{APP_VERSION}
      </span>
      <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
        Internal compliance tool · For awareness only — not legal advice
      </span>
      <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
        EU 2024/2847
      </span>
    </footer>
  );
}
