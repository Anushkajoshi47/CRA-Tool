// State machine mirroring the VDMA CRA Vulnerability Handling Guideline,
// Figure 7 "Vulnerability Management Process Graph".
//
// After validation, the First Responder determines the report type:
//   - not actively exploited  -> standard ticket   (verifying)
//   - claims active exploit   -> urgent ticket     (urgent_verifying)
// Both branches converge on the remediation loop (defect management):
//   root cause -> develop -> deploy -> assess residual risk
//   risk not acceptable loops back; risk acceptable -> advisory -> close.
const VALID_TRANSITIONS = {
  received:                ['validating'],
  validating:              ['determining_type', 'invalid'],
  invalid:                 [],

  determining_type:        ['verifying', 'urgent_verifying'],

  // Standard branch — no claim of active exploitation
  verifying:               ['assessing_risk', 'not_reproducible'],
  not_reproducible:        [],
  assessing_risk:          ['determining_urgency', 'not_exploitable'],
  not_exploitable:         [],
  determining_urgency:     ['root_cause_analysis'],

  // Urgent branch — report claims active exploitation by threat actors
  urgent_verifying:        ['actively_exploited', 'not_verified'],
  not_verified:            [],
  actively_exploited:      ['root_cause_analysis'],   // CRA reporting obligations start here

  // Remediation loop (defect management per ISO 9001)
  root_cause_analysis:     ['developing_mitigation'],
  developing_mitigation:   ['deploying_mitigation'],
  deploying_mitigation:    ['assessing_residual_risk'],
  assessing_residual_risk: ['root_cause_analysis', 'documenting_advisory'],

  documenting_advisory:    ['advisory_published'],
  advisory_published:      ['closed'],
  closed:                  [],
};

const TERMINAL_STATES = new Set([
  'invalid',
  'not_reproducible',
  'not_exploitable',
  'not_verified',
  'closed',
]);

function canTransition(from, to) {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

function getNextStates(status) {
  return VALID_TRANSITIONS[status] || [];
}

function isTerminal(status) {
  return TERMINAL_STATES.has(status);
}

export { VALID_TRANSITIONS, TERMINAL_STATES, canTransition, getNextStates, isTerminal };
