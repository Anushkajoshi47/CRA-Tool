import React from 'react';
import { CLOSE_LABEL } from '../utils/flowPhases';

// Horizontal lifecycle bar at the top of the case page.
//
// This is a CONDENSED 5-phase VIEW of the real 8-stage workflow — the cases
// still move through all 8 backend stages (receipt, validation, verification,
// remediation, advisory, disclosure, reporting, closed); the 5 boxes below
// simply group them so the case reads at a glance. Each display phase maps to
// one or more real stages; the phase containing the current stage is
// highlighted. Nothing here changes how the workflow actually runs.

// key `back` = the real stage a click sends the case back to (revise).
const DISPLAY_PHASES = [
  { label: 'Receipt',      stages: ['receipt'],                  back: 'receipt' },
  { label: 'Verification', stages: ['validation', 'verification'], back: 'verification' },
  { label: 'Remediation',  stages: ['remediation'],              back: 'remediation' },
  { label: 'Disclosure',   stages: ['advisory', 'disclosure'],   back: 'disclosure' },
  { label: 'Distribution of Security Updates', stages: ['reporting'], back: 'reporting' },
];

const CLOSE_EXIT_STAGE: Record<string, string> = { invalid: 'validation', not_exploitable: 'verification' };

function phaseOfStage(stage: string) {
  const idx = DISPLAY_PHASES.findIndex(p => p.stages.includes(stage));
  return idx === -1 ? 0 : idx;
}

export default function FlowStepper({ status, closedReason, classification, onStageClick }: {
  status: string;
  closedReason?: string | null;
  classification?: string | null;
  onStageClick?: (stageKey: string) => void;
}) {
  const isClosed  = status === 'closed';
  const earlyExit = isClosed && closedReason && closedReason !== 'completed';
  const finished  = isClosed && !earlyExit;                       // ran the full journey

  // Which display phase is "current" (active / exit point)
  const currentIdx = earlyExit
    ? phaseOfStage(CLOSE_EXIT_STAGE[closedReason!] || 'validation')
    : phaseOfStage(status);

  // The Distribution phase (reporting) is skipped for exploitable cases
  const distributionSkipped = classification === 'exploitable';

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', paddingBottom: 2 }}>
        {DISPLAY_PHASES.map((p, i) => {
          const skipped = i === 4 && distributionSkipped;
          const done    = !skipped && (finished ? true : i < currentIdx);
          const active  = !finished && !skipped && i === currentIdx;
          const exited  = active && !!earlyExit;
          const color   = exited ? '#f87171'
            : done ? '#00e676'
            : active ? 'var(--accent)'
            : 'var(--text-3)';
          const clickable = !!onStageClick && !skipped && (i < currentIdx || (isClosed && !earlyExit && i < 4));
          return (
            <React.Fragment key={p.label}>
              {i > 0 && (
                <div style={{
                  flex: '0 1 24px', height: 2, marginTop: 11, minWidth: 4,
                  background: done || active ? 'rgba(0,230,118,0.4)' : 'var(--border)',
                }} />
              )}
              <div
                onClick={clickable ? () => onStageClick!(p.back) : undefined}
                title={clickable ? `Move the case back to ${p.label}` : undefined}
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
                  {p.label}
                </div>
                {exited && (
                  <div style={{ fontSize: 9, color, marginTop: 2, textAlign: 'center', fontFamily: 'var(--mono)' }}>
                    {CLOSE_LABEL[closedReason!] || closedReason}
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
