import React from 'react';
import StatusBadge from './StatusBadge';

export default function StatusHistoryLog({ history }: any) {
  if (!history || history.length === 0) {
    return <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No history yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {history.map((entry, i) => (
        <div key={entry._id || i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {/* Timeline spine */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
              background: entry.fromStatus ? 'var(--accent)' : 'var(--border-hi)',
              border: '1px solid var(--border-hi)',
            }} />
            {i < history.length - 1 && (
              <div style={{ width: 1, flex: 1, minHeight: 28, background: 'var(--border)', marginTop: 2 }} />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, paddingBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {entry.fromStatus && (
                <>
                  <StatusBadge status={entry.fromStatus} />
                  <span style={{ color: 'var(--text-3)', fontSize: 12 }}>→</span>
                </>
              )}
              <StatusBadge status={entry.toStatus} />
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
            {entry.note && (
              <div style={{
                fontSize: 12, color: 'var(--text-2)', marginTop: 4,
                paddingLeft: 10, borderLeft: '2px solid var(--border)',
                lineHeight: 1.5,
              }}>
                {entry.note}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
