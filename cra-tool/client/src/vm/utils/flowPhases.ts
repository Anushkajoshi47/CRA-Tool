// The 8 lifecycle stages of the decision-driven workflow. Shared by the
// dashboard pipeline and the per-case progress bar. Labels/descriptions
// come from lifecycleConfig (editable in VM Settings); this file owns
// ordering and close-reason mapping only.
export const PHASES = [
  { key: 'receipt',      states: ['receipt'] },
  { key: 'validation',   states: ['validation'] },
  { key: 'verification', states: ['verification'] },
  { key: 'remediation',  states: ['remediation'] },
  { key: 'advisory',     states: ['advisory'] },
  { key: 'disclosure',   states: ['disclosure'] },
  { key: 'reporting',    states: ['reporting'] },
  { key: 'closed',       states: ['closed'] },
];

// Where an early closure happened, by closedReason
export const CLOSE_PHASE = {
  invalid:         'validation',
  not_exploitable: 'verification',
  completed:       'closed',
};

export const CLOSE_LABEL = {
  invalid:         'Invalid',
  not_exploitable: 'Not Exploitable (VEX)',
  completed:       'Completed',
};

export function phaseOf(status) {
  const phase = PHASES.find(p => p.states.includes(status));
  return phase ? phase.key : 'receipt';
}

export function phaseIndex(status) {
  return PHASES.findIndex(p => p.key === phaseOf(status));
}
