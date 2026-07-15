import React, { useState, useEffect } from 'react';
import { computeDeadlines, timeRemaining } from '../utils/clockCalculations';

export default function ClockWidget({ clockStartedAt, mitigationDeployedAt, isIncident }: any) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!clockStartedAt) return null;

  const { initial, detailed, final } = computeDeadlines(clockStartedAt, mitigationDeployedAt, isIncident);

  const rows = [
    { label: '24h — Early Warning (ENISA)',   due: initial  },
    { label: '72h — Detailed Notification',   due: detailed },
    { label: isIncident ? '1mo — Final Report (incident)' : '14d — Final Report (after mitigation)', due: final },
  ];

  return (
    <div style={{
      background: 'rgba(248,113,113,0.06)',
      border: '1px solid rgba(248,113,113,0.25)',
      borderRadius: 'var(--radius)',
      padding: '16px 20px',
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8.5" r="5.5" /><path d="M8 5.5v3l2 1.2M6.5 1.5h3" />
        </svg>
        CRA Art. 14 Clock Running — started {new Date(clockStartedAt).toLocaleString()}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        {rows.map(({ label, due }) => {
          const rem = timeRemaining(due);
          const color = !due
            ? 'var(--text-3)'
            : rem?.overdue
            ? '#f87171'
            : rem?.hours < 4
            ? '#f97316'
            : 'var(--text)';
          return (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>
              {due ? (
                <>
                  <div style={{ fontSize: 15, fontFamily: 'var(--mono)', fontWeight: 700, color }}>
                    {rem?.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {new Date(due).toLocaleString()}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {isIncident ? '—' : 'Pending mitigation'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
