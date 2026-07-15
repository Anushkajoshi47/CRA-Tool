import { stageLabel } from '../utils/lifecycleConfig';

const STATUS_COLOR: Record<string, string> = {
  receipt:      '#a8a8c8',
  validation:   '#60a5fa',
  verification: '#a78bfa',
  remediation:  '#f97316',
  advisory:     '#f59e0b',
  disclosure:   '#00c8c8',
  reporting:    '#00e676',
  closed:       '#646480',
};

export default function StatusBadge({ status, pulse }: { status: string; pulse?: boolean }) {
  const color = STATUS_COLOR[status] || '#a8a8c8';
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
        background: `${color}18`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {stageLabel(status)}
    </span>
  );
}

// Classification is independent of workflow status — a separate priority
// marker set during risk assessment.
export const CLASS_META: Record<string, { label: string; color: string }> = {
  actively_exploitable: { label: 'Actively Exploitable', color: '#f87171' },
  exploitable:          { label: 'Exploitable',          color: '#f59e0b' },
};

// Solid colored dot used wherever a classification is referenced.
export function ClassDot({ classification, size = 8 }: { classification: string; size?: number }) {
  const meta = CLASS_META[classification];
  if (!meta) return null;
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: meta.color,
      boxShadow: `0 0 6px ${meta.color}66`, flexShrink: 0, display: 'inline-block',
    }} />
  );
}

export function ClassificationBadge({ classification, pulse }: { classification?: string | null; pulse?: boolean }) {
  const meta = CLASS_META[classification || ''];
  if (!meta) return null;
  return (
    <span
      className={pulse ? 'urgent-pulse' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 20,
        fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em',
        textTransform: 'uppercase', whiteSpace: 'nowrap',
        background: `${meta.color}16`, color: meta.color,
        border: `1.5px solid ${meta.color}66`,
      }}
    >
      <ClassDot classification={classification!} size={7} />
      {meta.label}
    </span>
  );
}
