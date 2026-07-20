import { describe, it, expect } from 'vitest';
import {
  canTransition,
  isBackward,
  isTerminal,
  getNextStates,
  guardTransition,
  guardRemediationComplete,
  guardAdvisoryReady,
  guardDisclosureComplete,
  CLOSE_REASON_BY_STAGE,
} from './stateMachine';

// Complete, documented remediation/advisory/disclosure blobs for building
// tickets in whatever state a test needs.
const fullRemediation = { rootCause: 'unsigned firmware', method: 'signed updates', fixDescription: 'verify signature' };
const fullAdvisory    = { workMethodDefined: true, patchAvailable: true, productListAvailable: true };
const fullDisclosure  = { updateAvailable: true, updateInstructionsAvailable: true, updateUrl: 'https://x/y', advisoryCompleted: true };

describe('canTransition — forward moves', () => {
  it('allows each legal forward step', () => {
    expect(canTransition('receipt', 'validation')).toBe(true);
    expect(canTransition('validation', 'verification')).toBe(true);
    expect(canTransition('verification', 'remediation')).toBe(true);
    expect(canTransition('remediation', 'advisory')).toBe(true);
    expect(canTransition('advisory', 'disclosure')).toBe(true);
    expect(canTransition('disclosure', 'reporting')).toBe(true);
    expect(canTransition('reporting', 'closed')).toBe(true);
  });

  it('allows early-close branches', () => {
    expect(canTransition('validation', 'closed')).toBe(true);
    expect(canTransition('verification', 'closed')).toBe(true);
    expect(canTransition('disclosure', 'closed')).toBe(true);
  });

  it('rejects illegal forward jumps', () => {
    expect(canTransition('receipt', 'remediation')).toBe(false);
    expect(canTransition('validation', 'advisory')).toBe(false);
    expect(canTransition('verification', 'disclosure')).toBe(false);
    expect(canTransition('remediation', 'reporting')).toBe(false);
    expect(canTransition('receipt', 'closed')).toBe(false);
  });

  it('has no transitions out of closed except backward (reopen)', () => {
    expect(canTransition('closed', 'reporting')).toBe(true);   // backward reopen
    expect(getNextStates('closed')).toEqual([]);               // no forward
  });
});

describe('isBackward / reopen', () => {
  it('detects backward moves along the canonical order', () => {
    expect(isBackward('remediation', 'verification')).toBe(true);
    expect(isBackward('disclosure', 'remediation')).toBe(true);
    expect(isBackward('closed', 'validation')).toBe(true);
  });

  it('does not treat forward or same-stage moves as backward', () => {
    expect(isBackward('validation', 'verification')).toBe(false);
    expect(isBackward('remediation', 'remediation')).toBe(false);
  });

  it('canTransition permits any backward move (revision / reopen)', () => {
    expect(canTransition('closed', 'receipt')).toBe(true);
    expect(canTransition('reporting', 'remediation')).toBe(true);
  });
});

describe('isTerminal', () => {
  it('only closed is terminal', () => {
    expect(isTerminal('closed')).toBe(true);
    expect(isTerminal('reporting')).toBe(false);
    expect(isTerminal('receipt')).toBe(false);
  });
});

describe('CLOSE_REASON_BY_STAGE', () => {
  it('maps each closing stage to the right reason', () => {
    expect(CLOSE_REASON_BY_STAGE.validation).toBe('invalid');
    expect(CLOSE_REASON_BY_STAGE.verification).toBe('not_exploitable');
    expect(CLOSE_REASON_BY_STAGE.disclosure).toBe('completed');
    expect(CLOSE_REASON_BY_STAGE.reporting).toBe('completed');
  });
});

describe('guardRemediationComplete', () => {
  it('passes when root cause, method, and fix are present', () => {
    expect(guardRemediationComplete({ remediation: fullRemediation })).toBeNull();
  });
  it('lists every missing required field', () => {
    const err = guardRemediationComplete({ remediation: {} });
    expect(err).toContain('root cause');
    expect(err).toContain('remediation method');
    expect(err).toContain('fix description');
  });
  it('treats whitespace-only values as missing', () => {
    expect(guardRemediationComplete({ remediation: { rootCause: '  ', method: 'm', fixDescription: 'f' } }))
      .toContain('root cause');
  });
  it('does not require a workaround', () => {
    expect(guardRemediationComplete({ remediation: fullRemediation })).toBeNull();
  });
});

describe('guardAdvisoryReady', () => {
  it('blocks until all three readiness checks are Yes', () => {
    expect(guardAdvisoryReady({ advisoryChecks: { workMethodDefined: true, patchAvailable: true, productListAvailable: false } }))
      .toContain('product list available');
  });
  it('requires CERT notification even when checks pass', () => {
    expect(guardAdvisoryReady({ advisoryChecks: fullAdvisory, certNotifiedAt: null }))
      .toMatch(/CERT/);
  });
  it('passes when checks are complete and CERT is notified', () => {
    expect(guardAdvisoryReady({ advisoryChecks: fullAdvisory, certNotifiedAt: new Date() })).toBeNull();
  });
});

describe('guardDisclosureComplete', () => {
  it('requires update, instructions, URL, and advisory', () => {
    const err = guardDisclosureComplete({ disclosure: { updateAvailable: true } });
    expect(err).toContain('update instructions');
    expect(err).toContain('update URL');
    expect(err).toContain('advisory completed');
  });
  it('passes when all disclosure fields are set', () => {
    expect(guardDisclosureComplete({ disclosure: fullDisclosure })).toBeNull();
  });
});

describe('guardTransition — classification-driven reporting rules', () => {
  it('backward moves bypass all guards', () => {
    expect(guardTransition({ status: 'advisory', remediation: {} }, 'remediation')).toBeNull();
  });

  it('forces actively-exploitable cases through Reporting before closure', () => {
    const t = { status: 'disclosure', classification: 'actively_exploitable', disclosure: fullDisclosure };
    expect(guardTransition(t, 'closed')).toMatch(/Reporting/);
    expect(guardTransition(t, 'reporting')).toBeNull();
  });

  it('sends exploitable cases straight to closure and blocks Reporting', () => {
    const t = { status: 'disclosure', classification: 'exploitable', disclosure: fullDisclosure };
    expect(guardTransition(t, 'reporting')).toMatch(/only exists for actively exploitable/);
    expect(guardTransition(t, 'closed')).toBeNull();
  });

  it('still enforces disclosure completeness before either branch', () => {
    const t = { status: 'disclosure', classification: 'exploitable', disclosure: { updateAvailable: true } };
    expect(guardTransition(t, 'closed')).toContain('Disclosure incomplete');
  });
});
