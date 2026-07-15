import React, { useMemo, useState } from 'react';
import type { Cvss } from '../../types';

// CVSS 3.1 base-score calculator (FIRST specification, base metrics only).
// The computed score drives severity and priority in Risk Assessment.

const METRICS: {
  key: string; label: string; options: { v: string; label: string }[];
}[] = [
  { key: 'AV', label: 'Attack Vector',       options: [{ v: 'N', label: 'Network' }, { v: 'A', label: 'Adjacent' }, { v: 'L', label: 'Local' }, { v: 'P', label: 'Physical' }] },
  { key: 'AC', label: 'Attack Complexity',   options: [{ v: 'L', label: 'Low' }, { v: 'H', label: 'High' }] },
  { key: 'PR', label: 'Privileges Required', options: [{ v: 'N', label: 'None' }, { v: 'L', label: 'Low' }, { v: 'H', label: 'High' }] },
  { key: 'UI', label: 'User Interaction',    options: [{ v: 'N', label: 'None' }, { v: 'R', label: 'Required' }] },
  { key: 'S',  label: 'Scope',               options: [{ v: 'U', label: 'Unchanged' }, { v: 'C', label: 'Changed' }] },
  { key: 'C',  label: 'Confidentiality',     options: [{ v: 'H', label: 'High' }, { v: 'L', label: 'Low' }, { v: 'N', label: 'None' }] },
  { key: 'I',  label: 'Integrity',           options: [{ v: 'H', label: 'High' }, { v: 'L', label: 'Low' }, { v: 'N', label: 'None' }] },
  { key: 'A',  label: 'Availability',        options: [{ v: 'H', label: 'High' }, { v: 'L', label: 'Low' }, { v: 'N', label: 'None' }] },
];

const W: Record<string, Record<string, number>> = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  UI: { N: 0.85, R: 0.62 },
  CIA: { H: 0.56, L: 0.22, N: 0 },
};
const PR_W = {
  U: { N: 0.85, L: 0.62, H: 0.27 },   // scope unchanged
  C: { N: 0.85, L: 0.68, H: 0.5 },    // scope changed
};

function roundUp1(n: number) {
  const i = Math.round(n * 100000);
  return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10;
}

export function computeCvss(sel: Record<string, string>): Cvss | null {
  if (METRICS.some(m => !sel[m.key])) return null;

  const iss = 1 - (1 - W.CIA[sel.C]) * (1 - W.CIA[sel.I]) * (1 - W.CIA[sel.A]);
  const impact = sel.S === 'U'
    ? 6.42 * iss
    : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  const exploitability = 8.22 * W.AV[sel.AV] * W.AC[sel.AC] * PR_W[sel.S][sel.PR] * W.UI[sel.UI];

  const score = impact <= 0 ? 0 : roundUp1(
    sel.S === 'U'
      ? Math.min(impact + exploitability, 10)
      : Math.min(1.08 * (impact + exploitability), 10)
  );

  const severity =
    score === 0   ? 'None'
    : score < 4   ? 'Low'
    : score < 7   ? 'Medium'
    : score < 9   ? 'High'
    :               'Critical';

  const vector = `CVSS:3.1/AV:${sel.AV}/AC:${sel.AC}/PR:${sel.PR}/UI:${sel.UI}/S:${sel.S}/C:${sel.C}/I:${sel.I}/A:${sel.A}`;
  return { score, severity, vector };
}

export function parseVector(vector?: string | null): Record<string, string> {
  const sel: Record<string, string> = {};
  if (!vector) return sel;
  vector.split('/').forEach(part => {
    const [k, v] = part.split(':');
    if (k && v && METRICS.some(m => m.key === k)) sel[k] = v;
  });
  return sel;
}

export const SEVERITY_COLOR: Record<string, string> = {
  None: '#646480', Low: '#00e676', Medium: '#f59e0b', High: '#f97316', Critical: '#f87171',
};

export default function CvssCalculator({ initialVector, onChange }: {
  initialVector?: string | null;
  onChange: (cvss: Cvss | null) => void;
}) {
  const [sel, setSel] = useState<Record<string, string>>(() => parseVector(initialVector));

  const cvss = useMemo(() => computeCvss(sel), [sel]);

  function pick(key: string, v: string) {
    const next = { ...sel, [key]: v };
    setSel(next);
    onChange(computeCvss(next));
  }

  const sevColor = cvss ? SEVERITY_COLOR[cvss.severity] : 'var(--text-3)';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 18px', marginBottom: 14 }}>
        {METRICS.map(m => (
          <div key={m.key}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
              {m.label} <span className="mono" style={{ color: 'var(--text-3)' }}>({m.key})</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {m.options.map(o => {
                const active = sel[m.key] === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => pick(m.key, o.v)}
                    className="btn btn-xs"
                    style={{
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'var(--accent-dim)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-2)',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Score panel */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        padding: '12px 16px', borderRadius: 'var(--radius-sm)',
        background: cvss ? `${sevColor}10` : 'var(--card-hi)',
        border: `1px solid ${cvss ? sevColor + '44' : 'var(--border)'}`,
      }}>
        <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: sevColor, lineHeight: 1 }}>
          {cvss ? cvss.score.toFixed(1) : '—'}
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: sevColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {cvss ? cvss.severity : 'Select all metrics'}
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, wordBreak: 'break-all' }}>
            {cvss ? cvss.vector : 'CVSS:3.1 base score'}
          </div>
        </div>
      </div>
    </div>
  );
}
