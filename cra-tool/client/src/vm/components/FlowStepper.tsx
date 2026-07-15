import React from 'react';
import { PHASES, CLOSE_PHASE, CLOSE_LABEL, phaseIndex } from '../utils/flowPhases';
import { stageLabel } from '../utils/lifecycleConfig';

// Horizontal lifecycle bar at the top of the case page. Early closures show
// a ✕ at the stage where the case exited; Reporting renders as "skipped"
// for Exploitable (🟠) cases. When `onStageClick` is provided, earlier
// stages are clickable — the case can be moved back to revise a decision
// (every move is recorded in the audit trail).
export default function FlowStepper({ status, closedReason, classification, onStageClick }: {
  status: string;
  closedReason?: string | null;
  classification?: string | null;
  onStageClick?: (stageKey: string) => void;
}) {
  const isClosed   = status === 'closed';
  const earlyExit  = isClosed && closedReason && closedReason !== 'completed';
  const exitPhase  = earlyExit ? CLOSE_PHASE[closedReason] : null;
  const currentIdx = earlyExit
    ? PHASES.findIndex(p => p.key === exitPhase)
    : phaseIndex(status);

  // Reporting is skipped entirely for exploitable cases
  const reportingSkipped = classification === 'exploitable';

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', paddingBottom: 2 }}>
        {PHASES.map((p, i) => {
          const finished = isClosed && !earlyExit;                    // full journey completed
          const skipped  = p.key === 'reporting' && reportingSkipped;
          const done     = !skipped && (finished ? true : i < currentIdx);
          const active   = !finished && !skipped && i === currentIdx;
          const exited   = active && !!earlyExit;
          const color    = exited ? '#f87171'
            : done ? '#00e676'
            : active ? 'var(--accent)'
            : 'var(--text-3)';
          const clickable = !!onStageClick && !skipped && p.key !== 'closed' && (i < currentIdx || isClosed);
          return (
            <React.Fragment key={p.key}>
              {i > 0 && (
                <div style={{
                  flex: '0 1 24px', height: 2, marginTop: 11, minWidth: 4,
                  background: done || active ? 'rgba(0,230,118,0.4)' : 'var(--border)',
                }} />
              )}
              <div
                onClick={clickable ? () => onStageClick!(p.key) : undefined}
                title={clickable ? `Move the case back to ${stageLabel(p.key)}` : undefined}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0', minWidth: 0,
                  opacity: skipped ? 0.45 : 1,
                  cursor: clickable ? 'pointer' : 'default',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: done ? 'rgba(0,230,118,0.12)' : active ? (exited ? 'rgba(248,113,113,0.12)' : 'var(--accent-dim)') : 'transparent',
                  border: `2px ${skipped ? 'dashed' : 'solid'} ${color}`,
                  color,
                }}>
                  {done ? '✓' : exited ? '✕' : skipped ? '–' : i + 1}
                </div>
                <div style={{
                  fontSize: 9.5, fontWeight: active ? 700 : 500, color: active ? color : 'var(--text-2)',
                  textAlign: 'center', marginTop: 6, lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {stageLabel(p.key)}
                </div>
                {exited && (
                  <div style={{ fontSize: 9, color, marginTop: 2, textAlign: 'center', fontFamily: 'var(--mono)' }}>
                    {CLOSE_LABEL[closedReason] || closedReason}
                  </div>
                )}
                {skipped && (
                  <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2, textAlign: 'center', fontFamily: 'var(--mono)' }}>
                    skipped
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
