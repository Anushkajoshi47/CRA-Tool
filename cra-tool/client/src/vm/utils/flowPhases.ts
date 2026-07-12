// Groups the VDMA Figure 7 states into the guideline's high-level phases
// (Receipt → Verification → ... → Post-release). Shared by the dashboard
// pipeline and the per-ticket flow stepper.
export const PHASES = [
  { key: 'receipt',      label: 'Receipt',        states: ['received'] },
  { key: 'validation',   label: 'Validation',     states: ['validating', 'determining_type'] },
  { key: 'verification', label: 'Verification',   states: ['verifying', 'urgent_verifying'] },
  { key: 'risk',         label: 'Risk Assessment', states: ['assessing_risk', 'determining_urgency', 'actively_exploited'] },
  { key: 'remediation',  label: 'Remediation',    states: ['root_cause_analysis', 'developing_mitigation', 'deploying_mitigation', 'assessing_residual_risk'] },
  { key: 'publication',  label: 'Publication',    states: ['documenting_advisory', 'advisory_published'] },
  { key: 'closed',       label: 'Closed',         states: ['closed'] },
];

// Terminal early exits, mapped to the phase where they occur
export const TERMINAL_EXITS = {
  invalid:          { phase: 'validation',   label: 'Invalid' },
  not_reproducible: { phase: 'verification', label: 'Not Reproducible' },
  not_verified:     { phase: 'verification', label: 'Not Verified' },
  not_exploitable:  { phase: 'risk',         label: 'Not Exploitable (VEX)' },
};

export function phaseOf(status) {
  const exit = TERMINAL_EXITS[status];
  if (exit) return exit.phase;
  const phase = PHASES.find(p => p.states.includes(status));
  return phase ? phase.key : 'receipt';
}

export function phaseIndex(status) {
  return PHASES.findIndex(p => p.key === phaseOf(status));
}
