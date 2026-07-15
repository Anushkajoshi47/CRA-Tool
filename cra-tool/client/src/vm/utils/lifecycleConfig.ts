// Editable lifecycle stage names & descriptions. Stage KEYS are fixed —
// they are the server's state-machine states — but how each stage is
// titled and described in the UI is configurable in VM Settings.
// Overrides persist in localStorage on this browser.

export interface StageConfig {
  key: string;
  label: string;
  desc: string;
}

export const DEFAULT_STAGES: StageConfig[] = [
  { key: 'receipt',      label: 'Receipt',      desc: 'Report arrives — case created, researcher acknowledged' },
  { key: 'validation',   label: 'Validation',   desc: 'Decision: valid per the CVD policy?' },
  { key: 'verification', label: 'Verification', desc: 'CVSS assessment, exploitability decision, classification' },
  { key: 'remediation',  label: 'Remediation',  desc: 'Document root cause, method, fix, and workaround' },
  { key: 'advisory',     label: 'Advisory',     desc: 'Readiness checks, then notify CERT' },
  { key: 'disclosure',   label: 'Disclosure',   desc: 'Update, instructions, URL, and advisory published' },
  { key: 'reporting',    label: 'Reporting',    desc: 'Early warning, detailed notification, final report (actively exploitable only)' },
  { key: 'closed',       label: 'Closed',       desc: 'Case archived with full audit trail' },
];

const LS_KEY = 'vm_lifecycle_stages';

type Overrides = Record<string, Partial<Pick<StageConfig, 'label' | 'desc'>>>;

function readOverrides(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getStages(): StageConfig[] {
  const ov = readOverrides();
  return DEFAULT_STAGES.map(s => ({
    ...s,
    label: ov[s.key]?.label?.trim() || s.label,
    desc:  ov[s.key]?.desc?.trim()  || s.desc,
  }));
}

export function stageLabel(key: string): string {
  const s = getStages().find(x => x.key === key);
  return s ? s.label : key.replace(/_/g, ' ');
}

export function stageDesc(key: string): string {
  return getStages().find(x => x.key === key)?.desc || '';
}

export function saveStages(stages: StageConfig[]) {
  const ov: Overrides = {};
  stages.forEach(s => {
    const def = DEFAULT_STAGES.find(d => d.key === s.key);
    if (!def) return;
    const entry: Overrides[string] = {};
    if (s.label.trim() && s.label.trim() !== def.label) entry.label = s.label.trim();
    if (s.desc.trim()  && s.desc.trim()  !== def.desc)  entry.desc  = s.desc.trim();
    if (Object.keys(entry).length) ov[s.key] = entry;
  });
  localStorage.setItem(LS_KEY, JSON.stringify(ov));
}

export function resetStages() {
  localStorage.removeItem(LS_KEY);
}
