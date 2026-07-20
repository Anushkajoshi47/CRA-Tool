import { computeCvss, parseVector } from './CvssCalculator';

// Reference base scores from the FIRST CVSS 3.1 specification. If the
// calculator drifts from the standard, these break.

function score(vector: string) {
  const sel: Record<string, string> = {};
  vector.replace('CVSS:3.1/', '').split('/').forEach(p => {
    const [k, v] = p.split(':');
    sel[k] = v;
  });
  return computeCvss(sel);
}

describe('computeCvss — reference vectors', () => {
  it('scores a network RCE at 9.8 Critical', () => {
    const r = score('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H');
    expect(r?.score).toBe(9.8);
    expect(r?.severity).toBe('Critical');
  });

  it('scores a scope-changed full-impact vuln at 10.0', () => {
    const r = score('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H');
    expect(r?.score).toBe(10.0);
    expect(r?.severity).toBe('Critical');
  });

  it('scores a classic stored XSS at 6.1 Medium', () => {
    const r = score('CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N');
    expect(r?.score).toBe(6.1);
    expect(r?.severity).toBe('Medium');
  });

  it('scores a local availability-only issue at 6.2 Medium', () => {
    const r = score('CVSS:3.1/AV:L/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H');
    expect(r?.score).toBe(6.2);
  });

  it('scores an all-None vector at 0.0 None', () => {
    const r = score('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N');
    expect(r?.score).toBe(0);
    expect(r?.severity).toBe('None');
  });
});

describe('computeCvss — severity bands', () => {
  it('classifies each band correctly', () => {
    // Low (0.1–3.9)
    expect(score('CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N')?.severity).toBe('Low');
    // High (7.0–8.9)
    expect(score('CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N')?.severity).toBe('High');
  });
});

describe('computeCvss — incomplete input', () => {
  it('returns null until every base metric is chosen', () => {
    expect(computeCvss({ AV: 'N', AC: 'L' })).toBeNull();
  });
});

describe('parseVector', () => {
  it('round-trips a full vector back into the same score', () => {
    const vector = 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H';
    const sel = parseVector(vector);
    expect(computeCvss(sel)?.vector).toBe(vector);
  });

  it('ignores unknown metrics and empty input', () => {
    expect(parseVector('')).toEqual({});
    expect(parseVector('CVSS:3.1/ZZ:9/AV:N')).toEqual({ AV: 'N' });
  });
});
