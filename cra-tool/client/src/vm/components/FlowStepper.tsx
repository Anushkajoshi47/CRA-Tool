import React from 'react';
import { PHASES, TERMINAL_EXITS, phaseIndex } from '../utils/flowPhases';

// Compact horizontal rendering of the VDMA Figure 7 process — shows which
// phase the ticket is in, or where it exited the flow early.
export default function FlowStepper({ status }: { status: string }) {
  const currentIdx = phaseIndex(status);
  const exit       = TERMINAL_EXITS[status];
  const isClosed   = status === 'closed';

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {PHASES.map((p, i) => {
          const done    = i < currentIdx || isClosed;
          const active  = i === currentIdx && !isClosed;
          const exited  = active && !!exit;
          const color   = exited ? '#f87171' : done ? '#00e676' : active ? 'var(--accent)' : 'var(--text-3)';
          return (
            <React.Fragment key={p.key}>
              {i > 0 && (
                <div style={{
                  flex: 1, height: 2, marginTop: 11,
                  background: i <= currentIdx || isClosed ? 'rgba(0,230,118,0.4)' : 'var(--border)',
                }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 86, flexShrink: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: done ? 'rgba(0,230,118,0.12)' : active ? (exited ? 'rgba(248,113,113,0.12)' : 'rgba(230,255,0,0.1)') : 'transparent',
                  border: `2px solid ${color}`,
                  color,
                }}>
                  {done ? '✓' : exited ? '✕' : i + 1}
                </div>
                <div style={{
                  fontSize: 9.5, fontWeight: active ? 700 : 500, color: active ? color : 'var(--text-2)',
                  textAlign: 'center', marginTop: 6, lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {p.label}
                </div>
                {active && (
                  <div style={{ fontSize: 9, color, marginTop: 2, textAlign: 'center', fontFamily: 'var(--mono)' }}>
                    {exit ? exit.label : status.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
