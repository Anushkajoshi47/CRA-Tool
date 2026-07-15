// Decision-driven vulnerability lifecycle — 8 stages, one primary decision each.
//
//   receipt ──► validation ──► verification ──► remediation ──► advisory ──► disclosure ──► reporting ──► closed
//                    │               │                                            │  (🔴 only)      (completed)
//                    ▼               ▼                                            ▼
//                 closed          closed                                       closed
//               (invalid)    (not_exploitable)                          (🟠 completed — reporting skipped)
//
// Classification (actively_exploitable | exploitable) is decided during
// VERIFICATION (after CVSS + the exploitability decision) and is independent
// of stage. It determines priority and whether Reporting exists at all.
//
// Every transition is guarded: a stage cannot be left until its required
// data is complete. Guards are pure functions of the ticket document so
// they can be unit-tested and reused (e.g. by a future AI-suggestion layer).

const VALID_TRANSITIONS = {
  receipt:      ['validation'],
  validation:   ['verification', 'closed'],
  verification: ['remediation', 'closed'],
  remediation:  ['advisory'],
  advisory:     ['disclosure'],
  disclosure:   ['reporting', 'closed'],
  reporting:    ['closed'],
  closed:       [],
};

// Canonical stage order. The workflow is fully revisable: a case may move
// BACK to any earlier stage (including reopening a closed case) — every
// such move is audit-logged like any other transition. Guards only apply
// to forward moves; documented data is preserved when going back.
const STAGE_ORDER = ['receipt', 'validation', 'verification', 'remediation', 'advisory', 'disclosure', 'reporting', 'closed'];

function isBackward(from, to) {
  const fi = STAGE_ORDER.indexOf(from);
  const ti = STAGE_ORDER.indexOf(to);
  return fi >= 0 && ti >= 0 && ti < fi;
}

// closedReason implied when a stage exits to `closed`
const CLOSE_REASON_BY_STAGE = {
  validation:   'invalid',
  verification: 'not_exploitable',
  disclosure:   'completed',
  reporting:    'completed',
};

function canTransition(from, to) {
  return (VALID_TRANSITIONS[from] || []).includes(to) || isBackward(from, to);
}

function getNextStates(status) {
  return VALID_TRANSITIONS[status] || [];
}

function isTerminal(status) {
  return status === 'closed';
}

// ── Stage-completeness guards ─────────────────────────────────
// Return an error message when the transition is not allowed yet, else null.

function guardRemediationComplete(ticket) {
  const r = ticket.remediation || {};
  const missing = [];
  if (!r.rootCause?.trim())      missing.push('root cause');
  if (!r.method?.trim())         missing.push('remediation method');
  if (!r.fixDescription?.trim()) missing.push('fix description');
  return missing.length
    ? `Remediation documentation incomplete — missing: ${missing.join(', ')}`
    : null;
}

function guardAdvisoryReady(ticket) {
  const c = ticket.advisoryChecks || {};
  const missing = [];
  if (!c.workMethodDefined)    missing.push('work method defined');
  if (!c.patchAvailable)       missing.push('patch available');
  if (!c.productListAvailable) missing.push('product list available');
  if (missing.length) return `Advisory readiness checks incomplete: ${missing.join(', ')}`;
  if (!ticket.certNotifiedAt)  return 'CERT must be notified before disclosure can begin';
  return null;
}

function guardDisclosureComplete(ticket) {
  const d = ticket.disclosure || {};
  const missing = [];
  if (!d.updateAvailable)             missing.push('update available');
  if (!d.updateInstructionsAvailable) missing.push('update instructions');
  if (!d.updateUrl?.trim())           missing.push('update URL');
  if (!d.advisoryCompleted)           missing.push('advisory completed');
  return missing.length
    ? `Disclosure incomplete — missing: ${missing.join(', ')}`
    : null;
}

// Guard for a specific transition. Reporting-completeness (needs the Report
// collection) is enforced in the controller on reporting → closed.
function guardTransition(ticket, toStatus) {
  const from = ticket.status;
  if (isBackward(from, toStatus)) return null;   // going back is always allowed

  if (from === 'remediation' && toStatus === 'advisory') {
    return guardRemediationComplete(ticket);
  }
  if (from === 'advisory' && toStatus === 'disclosure') {
    return guardAdvisoryReady(ticket);
  }
  if (from === 'disclosure') {
    const err = guardDisclosureComplete(ticket);
    if (err) return err;
    if (toStatus === 'reporting' && ticket.classification !== 'actively_exploitable') {
      return 'Reporting only exists for actively exploitable cases — close the case instead';
    }
    if (toStatus === 'closed' && ticket.classification === 'actively_exploitable') {
      return 'Actively exploitable cases must complete Reporting before closure';
    }
  }
  return null;
}

export {
  VALID_TRANSITIONS,
  CLOSE_REASON_BY_STAGE,
  STAGE_ORDER,
  isBackward,
  canTransition,
  getNextStates,
  isTerminal,
  guardTransition,
  guardRemediationComplete,
  guardAdvisoryReady,
  guardDisclosureComplete,
};
