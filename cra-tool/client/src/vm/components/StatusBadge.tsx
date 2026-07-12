import React from 'react';

const STATUS_META: Record<string, { label: string; color: string }> = {
  received:                { label: 'Received',                color: '#a8a8c8' },
  validating:              { label: 'Validating',              color: '#60a5fa' },
  invalid:                 { label: 'Invalid',                 color: '#f87171' },
  determining_type:        { label: 'Determining Type',        color: '#60a5fa' },
  verifying:               { label: 'Verifying',               color: '#a78bfa' },
  not_reproducible:        { label: 'Not Reproducible',        color: '#f97316' },
  assessing_risk:          { label: 'Assessing Risk',          color: '#f59e0b' },
  not_exploitable:         { label: 'Not Exploitable (VEX)',   color: '#00e676' },
  determining_urgency:     { label: 'Determining Urgency',     color: '#f59e0b' },
  urgent_verifying:        { label: 'Urgent Verification',     color: '#ef4444' },
  not_verified:            { label: 'Not Verified',            color: '#f97316' },
  actively_exploited:      { label: 'Actively Exploited',      color: '#f87171' },
  root_cause_analysis:     { label: 'Root Cause Analysis',     color: '#a78bfa' },
  developing_mitigation:   { label: 'Developing Mitigation',   color: '#60a5fa' },
  deploying_mitigation:    { label: 'Deploying Mitigation',    color: '#60a5fa' },
  assessing_residual_risk: { label: 'Assessing Residual Risk', color: '#f59e0b' },
  documenting_advisory:    { label: 'Documenting Advisory',    color: '#00c8c8' },
  advisory_published:      { label: 'Advisory Published',      color: '#00e676' },
  closed:                  { label: 'Closed',                  color: '#646480' },
};

export default function StatusBadge({ status, pulse }: { status: string; pulse?: boolean }) {
  const meta = STATUS_META[status] || { label: status, color: '#a8a8c8' };
  return (
    <span
      className={pulse ? 'urgent-pulse' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        background: `${meta.color}18`,
        color: meta.color,
        border: `1px solid ${meta.color}44`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
      {meta.label}
    </span>
  );
}
