import React from 'react';

export default function Header({ title, subtitle, actions }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 40px 0',
    }}>
      <div>
        {subtitle && (
          <div className="section-label" style={{ marginBottom: 4 }}>{subtitle}</div>
        )}
        {title && (
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h1>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 10 }}>{actions}</div>
      )}
    </div>
  );
}
