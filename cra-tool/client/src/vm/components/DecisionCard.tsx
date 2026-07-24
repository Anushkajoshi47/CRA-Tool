import React, { useState } from 'react';
import { transitionTicket, updateStageData, notifyCert, resetCertNotification, uploadAttachments } from '../api/vmApi';
import { timeRemaining, computeDeadlines } from '../utils/clockCalculations';
import AdvisoryForm from './AdvisoryForm';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { ClassificationBadge, ClassDot } from './StatusBadge';
import { stageLabel } from '../utils/lifecycleConfig';
import { TIMEZONES, getTimezone, toZonedInput, zonedInputToISO, fmtDateTime, useTimeFmt } from '../../shared/timezone';
import type { Cvss } from '../../types';

// The workflow-engine surface: one card, one decision per stage. Always
// answers: what stage, what decision is required, who owns the case, and
// what happens next — so any engineer can pick the case up immediately.

const STAGE_META: Record<string, { requires: string; next: string }> = {
  receipt: {
    requires: 'A new report has been registered and the researcher acknowledged. Review the intake details, assign a duty manager, then start validation.',
    next: 'Validation — is this a valid report per the CVD policy?',
  },
  validation: {
    requires: 'Check the report against the Coordinated Vulnerability Disclosure (CVD) policy: in scope for our products, plausible, complete?',
    next: 'Verification — CVSS assessment and exploitability decision.',
  },
  verification: {
    requires: 'Decide whether the vulnerability is exploitable or actively exploitable in the product\'s intended use, record your observations and a CVSS base score (per FIRST.org), then assess the risk. The verdict sets priority and reporting obligations for the rest of the lifecycle.',
    next: 'Remediation — document root cause, method, and fix.',
  },
  remediation: {
    requires: 'Document how the vulnerability is being fixed. Root cause, remediation method, and fix description are required; a workaround is optional.',
    next: 'Advisory — readiness checks and CERT notification.',
  },
  advisory: {
    requires: 'Confirm disclosure readiness: work method defined, patch available, product list available. When all three are Yes, notify CERT — disclosure cannot begin before that.',
    next: 'Disclosure — publish the update and advisory.',
  },
  disclosure: {
    requires: 'Provide the update, its instructions and URL, and complete the advisory. Leaving this stage publishes the advisory and informs users and the researcher.',
    next: 'Reporting for actively exploitable cases; otherwise the case closes.',
  },
  reporting: {
    requires: 'Actively exploitable cases must file all three reports: Early Warning, Detailed Notification, and Final Report. The case can only close once every report is submitted.',
    next: 'Closed — case archived with full audit trail.',
  },
};

const CLOSE_OUTCOME: Record<string, { title: string; desc: string; color: string }> = {
  invalid:         { title: 'Closed — Invalid',               desc: 'The report did not pass validation against the CVD policy. Researcher informed.',   color: '#f87171' },
  not_exploitable: { title: 'Closed — Not Exploitable (VEX)', desc: 'Assessed as not exploitable under practical conditions. Documented as VEX.',        color: '#f59e0b' },
  completed:       { title: 'Closed — Completed',             desc: 'Remediated, disclosed, and reported where required. Case archived with full audit trail.', color: '#00e676' },
};

export default function DecisionCard({ ticket, reports, advisory, onChanged, gotoReports }: any) {
  const fmt = useTimeFmt();
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [pending, setPending] = useState<any>(null);   // decision awaiting confirmation

  // Verification-stage local state.
  //   verdict → the exploitability decision picked in Step 1
  //   cvss    → CVSS base score entered by hand (no calculator widget)
  const [cvss, setCvss] = useState<Cvss | null>(ticket.cvss?.score != null ? (ticket.cvss as Cvss) : null);
  const [verdict, setVerdict] = useState<'exploitable' | 'actively_exploitable' | 'not_exploitable' | null>(null);

  // Stage documentation local state (saved via stage-data, not transitions)
  const [rem, setRem]   = useState({ rootCause: '', method: '', fixDescription: '', workaround: '', ...ticket.remediation });
  const [checks, setChecks] = useState({ workMethodDefined: false, patchAvailable: false, productListAvailable: false, ...ticket.advisoryChecks });
  const [disc, setDisc] = useState({ updateAvailable: false, updateInstructionsAvailable: false, updateUrl: '', advisoryCompleted: false, ...ticket.disclosure });
  const [receipt, setReceipt] = useState({ researcherNotified: false, researcherNotifiedAt: '', ...ticket.receipt });
  const [valid, setValid]     = useState({ researcherNotified: false, researcherNotifiedAt: '', ...ticket.validation });
  const [verif, setVerif]     = useState({ observations: '', attachmentLink: '', riskLevel: '', ...ticket.verification });
  const [saved, setSaved] = useState('');

  const meta = STAGE_META[ticket.status];
  const isActive = ticket.classification === 'actively_exploitable';

  async function run(action: () => Promise<any>) {
    setPending(null);
    setLoading(true);
    setError('');
    try {
      await action();
      setNote('');
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed');
      // 409 = another officer changed this case first; reload to the latest
      if (err.response?.status === 409) onChanged();
    } finally {
      setLoading(false);
    }
  }

  const decide = (toStatus: string, extra: any = {}) =>
    run(() => transitionTicket(ticket._id, { toStatus, note, expectedUpdatedAt: ticket.updatedAt, ...extra }));

  async function saveStage(data: any, label: string) {
    setError('');
    setSaved('');
    try {
      await updateStageData(ticket._id, { ...data, expectedUpdatedAt: ticket.updatedAt });
      setSaved(label);
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed');
      if (err.response?.status === 409) onChanged();
    }
  }

  async function uploadStageFiles(list: FileList | null) {
    if (!list?.length) return;
    setError('');
    try { await uploadAttachments(ticket._id, Array.from(list)); setSaved('Attachment uploaded.'); onChanged(); }
    catch (err: any) { setError(err.response?.data?.message || 'Upload failed'); }
  }

  // Leave verification: persist the assessment (observations, risk, evidence
  // link), then transition. A not-exploitable verdict closes the case (VEX);
  // exploitable / actively-exploitable carry the classification into remediation.
  const proceedVerification = () => run(async () => {
    await updateStageData(ticket._id, { verification: verif, expectedUpdatedAt: ticket.updatedAt });
    if (verdict === 'not_exploitable') {
      await transitionTicket(ticket._id, { toStatus: 'closed', note, cvss });
    } else {
      await transitionTicket(ticket._id, { toStatus: 'remediation', note, classification: verdict, cvss });
    }
  });

  // Manual CVSS entry — no calculator. The base score maps to a FIRST.org
  // qualitative severity band; the vector, if provided, is kept as free text.
  const setScore = (raw: string) => {
    if (raw.trim() === '') { setCvss(cvss?.vector ? { ...cvss, score: undefined as any, severity: '' } : null); return; }
    const n = Math.max(0, Math.min(10, Number(raw)));
    if (Number.isNaN(n)) return;
    setCvss({ score: n, severity: severityForScore(n), vector: cvss?.vector || '' });
  };
  const setVector = (raw: string) =>
    setCvss(cvss ? { ...cvss, vector: raw } : { score: undefined as any, severity: '', vector: raw });

  // ── Closed: outcome card (reopenable — the workflow stays revisable) ──
  if (ticket.status === 'closed') {
    const o = CLOSE_OUTCOME[ticket.closedReason] || CLOSE_OUTCOME.completed;
    const reopenTo =
      ticket.closedReason === 'invalid' ? 'validation'
      : ticket.closedReason === 'not_exploitable' ? 'verification'
      : ticket.classification === 'actively_exploitable' ? 'reporting'
      : 'disclosure';
    return (
      <div className="card card-flat" style={{ padding: '20px 24px', borderLeft: `3px solid ${o.color}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: o.color, marginBottom: 6 }}>{o.title}</div>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{o.desc}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <ClassificationBadge classification={ticket.classification} />
          {ticket.cvss?.score != null && (
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>
              CVSS {Number(ticket.cvss.score).toFixed(1)} ({ticket.cvss.severity})
            </span>
          )}
          <button
            className="btn btn-ghost btn-xs"
            style={{ marginLeft: 'auto' }}
            disabled={loading}
            onClick={() => setPending({
              label: `Reopen — back to ${stageLabel(reopenTo)}`,
              action: () => decide(reopenTo),
            })}
          >
            Reopen Case →
          </button>
        </div>
        {error && <div style={{ color: '#f87171', fontSize: 12, marginTop: 10 }}>{error}</div>}
        <ConfirmDialog
          open={!!pending}
          title="Reopen Case"
          message={pending ? `"${pending.label}" — the closure is undone and the move is recorded in the audit trail. Continue?` : ''}
          confirmLabel={pending?.label}
          onConfirm={() => pending.action()}
          onCancel={() => setPending(null)}
        />
      </div>
    );
  }

  if (!meta) return null;

  // ── Reporting-stage data ─────────────────────────────────────
  const deadlines = ticket.clockStartedAt
    ? computeDeadlines(ticket.clockStartedAt, ticket.mitigationDeployedAt, ticket.isIncident)
    : null;
  const reportTasks = deadlines ? [
    { type: 'initial',  label: 'Early Warning',         due: deadlines.initial },
    { type: 'detailed', label: 'Detailed Notification', due: deadlines.detailed },
    { type: 'final',    label: 'Final Report',          due: deadlines.final },
  ].map(t => ({ ...t, report: reports.find((r: any) => r.type === t.type) })) : [];
  const allReportsSubmitted = reportTasks.length > 0 && reportTasks.every(t => !!t.report?.submittedAt);

  const advisoryChecksComplete = checks.workMethodDefined && checks.patchAvailable && checks.productListAvailable;
  const disclosureComplete = disc.updateAvailable && disc.updateInstructionsAvailable && !!disc.updateUrl?.trim() && disc.advisoryCompleted;
  const remediationComplete = !!(rem.rootCause?.trim() && rem.method?.trim() && rem.fixDescription?.trim());

  return (
    <div className="card" style={{ padding: '22px 26px', border: '1px solid var(--accent-mid)', borderLeft: '3px solid var(--accent)' }}>

      {/* Header: stage · owner · classification */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Current Stage
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{stageLabel(ticket.status)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Current Owner
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{ticket.caseManager || 'Unassigned'}</div>
          <div style={{ marginTop: 6 }}>
            <ClassificationBadge classification={ticket.classification} pulse={isActive} />
          </div>
        </div>
      </div>

      {/* What this stage requires */}
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.65, margin: '0 0 16px' }}>{meta.requires}</p>

      {/* ── Stage-specific surface ── */}

      {ticket.status === 'receipt' && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Receipt checklist</div>
          <NotifyBlock
            label="Acknowledgement sent to the researcher upon receipt?"
            state={receipt}
            onChange={setReceipt}
            onUpload={uploadStageFiles}
            onSave={() => saveStage({ receipt }, 'Receipt acknowledgement saved.')}
          />
        </>
      )}

      {ticket.status === 'validation' && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Validation checklist</div>
          <NotifyBlock
            label="Researcher informed the report is valid?"
            state={valid}
            onChange={setValid}
            onUpload={uploadStageFiles}
            onSave={() => saveStage({ validation: valid }, 'Validation notification saved.')}
          />
        </>
      )}

      {ticket.status === 'verification' && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ticket.affectedProducts?.length > 1 && (
            <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.55, padding: '8px 12px', background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-sm)' }}>
              Multiple products affected — assess exploitability and risk <strong>per product</strong>:{' '}
              {ticket.affectedProducts.map((p: any) => [p.name, p.version].filter(Boolean).join(' ')).join(' · ')}
            </div>
          )}

          {/* Step 1 — the exploitability verdict comes first */}
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Step 1 — Exploitability</div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 10px', lineHeight: 1.6 }}>
              Is the vulnerability exploitable, or <strong>actively</strong> exploitable, in the product's practical intended use?
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {([
                { key: 'exploitable',          label: 'Exploitable',          c: '#f59e0b' },
                { key: 'actively_exploitable', label: 'Actively exploitable',  c: '#f87171' },
                { key: 'not_exploitable',      label: 'Not exploitable',       c: '#00e676' },
              ] as const).map(o => (
                <button key={o.key} type="button" className="btn btn-sm" disabled={loading}
                  onClick={() => setVerdict(o.key)}
                  style={{
                    border: `1px solid ${verdict === o.key ? o.c : 'var(--border)'}`,
                    background: verdict === o.key ? `color-mix(in srgb, ${o.c} 14%, transparent)` : 'transparent',
                    color: verdict === o.key ? o.c : 'var(--text-2)', fontWeight: 700,
                  }}>
                  {o.key !== 'not_exploitable' && <ClassDot classification={o.key} size={8} />}
                  <span style={{ marginLeft: o.key !== 'not_exploitable' ? 6 : 0 }}>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — observations + evidence */}
          <div style={{ padding: '14px 16px', background: 'var(--card-hi)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Step 2 — Observations &amp; evidence</div>
            <label className="label">Observations</label>
            <textarea className="input" rows={3} value={verif.observations || ''} onChange={e => setVerif({ ...verif, observations: e.target.value })}
              placeholder="Affected components, attack scenario, exploitability reasoning per product…" style={{ resize: 'vertical', marginBottom: 12 }} />
            <label className="label">Attachment link (evidence)</label>
            <input className="input" value={verif.attachmentLink || ''} onChange={e => setVerif({ ...verif, attachmentLink: e.target.value })}
              placeholder="https://… (advisory, PoC, TRA)" />
            <div style={{ marginTop: 12 }}>
              <label className="label" style={{ marginBottom: 6 }}>Or upload a file (PDF / screenshot)</label>
              {ticket.attachments?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                  {ticket.attachments.map((a: any) => (
                    <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--text-3)' }}>{a.mimeType === 'application/pdf' ? 'PDF' : 'IMG'}</span>
                      <span style={{ color: 'var(--text)' }}>{a.originalName}</span>
                    </div>
                  ))}
                </div>
              )}
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                + Upload PDF / screenshot
                <input type="file" multiple accept=".pdf,image/png,image/jpeg,image/gif,image/webp" style={{ display: 'none' }}
                  onChange={e => { uploadStageFiles(e.target.files); e.target.value = ''; }} />
              </label>
            </div>
          </div>

          {/* Step 3 — CVSS base score, entered by hand */}
          <div style={{ padding: '14px 16px', background: 'var(--card-hi)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Step 3 — CVSS base score</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ width: 120 }}>
                <label className="label">Base score (0–10)</label>
                <input className="input" type="number" min={0} max={10} step={0.1}
                  value={cvss?.score ?? ''} onChange={e => setScore(e.target.value)} placeholder="e.g. 8.8" />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label className="label">Vector (optional)</label>
                <input className="input mono" style={{ fontSize: 11 }} value={cvss?.vector || ''} onChange={e => setVector(e.target.value)}
                  placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" />
              </div>
              {cvss?.score != null && cvss.score !== ('' as any) && (
                <span className="mono" style={{ fontSize: 11, fontWeight: 800, color: severityColor(cvss.severity), whiteSpace: 'nowrap', paddingBottom: 8 }}>
                  {cvss.severity}
                </span>
              )}
            </div>
            <a href="https://www.first.org/cvss/calculator/3.1" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: 8, fontSize: 11.5, color: 'var(--accent)' }}>
              Open the FIRST.org CVSS 3.1 calculator ↗
            </a>
          </div>

          {/* Step 4 — risk assessment from the CVSS severity band */}
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Step 4 — Risk assessment</div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 8px', lineHeight: 1.6 }}>
              Assess the risk using the CVSS qualitative severity scale
              {cvss?.severity ? <> — the entered score maps to <strong style={{ color: severityColor(cvss.severity) }}>{cvss.severity}</strong></> : null}.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <label className="label" style={{ margin: 0 }}>Risk level</label>
              <select className="input" style={{ width: 200 }} value={verif.riskLevel || ''} onChange={e => setVerif({ ...verif, riskLevel: e.target.value })}>
                <option value="">— select —</option>
                {['Low', 'Medium', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {cvss?.severity && ['Low', 'Medium', 'High', 'Critical'].includes(cvss.severity) && verif.riskLevel !== cvss.severity && (
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setVerif({ ...verif, riskLevel: cvss.severity })}>
                  Use CVSS severity ({cvss.severity})
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => saveStage({ verification: verif, cvss }, 'Verification assessment saved.')}>Save Assessment</button>
          </div>
        </div>
      )}

      {ticket.status === 'remediation' && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 11.5, lineHeight: 1.5,
            background: isActive ? 'var(--red-dim)' : 'var(--amber-dim)',
            border: `1px solid ${isActive ? 'rgba(248,113,113,0.25)' : 'rgba(245,158,11,0.25)'}`,
            color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ClassDot classification={ticket.classification} size={7} />
            {isActive
              ? <span><strong style={{ color: 'var(--red)' }}>Reporting will be required.</strong> Actively exploitable — immediate remediation, CRA timers running.</span>
              : <span><strong style={{ color: 'var(--amber)' }}>No reporting required.</strong> Exploitable — standard remediation; the case skips the Reporting stage.</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <label className="label">Root Cause *</label>
              <textarea className="input" rows={3} value={rem.rootCause || ''} onChange={e => setRem({ ...rem, rootCause: e.target.value })}
                placeholder="Why the vulnerability exists…" style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="label">Remediation Method *</label>
              <textarea className="input" rows={3} value={rem.method || ''} onChange={e => setRem({ ...rem, method: e.target.value })}
                placeholder="Patch, configuration change, redesign…" style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="label">Fix Description *</label>
              <textarea className="input" rows={3} value={rem.fixDescription || ''} onChange={e => setRem({ ...rem, fixDescription: e.target.value })}
                placeholder="What the fix changes and its effect…" style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="label">Workaround (optional)</label>
              <textarea className="input" rows={3} value={rem.workaround || ''} onChange={e => setRem({ ...rem, workaround: e.target.value })}
                placeholder="Interim mitigation for users who cannot update yet…" style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => saveStage({ remediation: rem }, 'Remediation documentation saved.')}>
              Save Documentation
            </button>
          </div>
        </div>
      )}

      {ticket.status === 'advisory' && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'workMethodDefined',    label: 'Work method defined?' },
            { key: 'patchAvailable',       label: 'Patch available?' },
            { key: 'productListAvailable', label: 'Product list available?' },
          ].map(c => (
            <YesNo
              key={c.key}
              label={c.label}
              value={!!checks[c.key]}
              disabled={!!ticket.certNotifiedAt}
              onChange={v => {
                const next = { ...checks, [c.key]: v };
                setChecks(next);
                saveStage({ advisoryChecks: next }, 'Readiness checks saved.');
              }}
            />
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {ticket.certNotifiedAt ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>
                  ✓ CERT notified — {fmt.dateTime(ticket.certNotifiedAt)}
                </span>
                <button
                  className="btn btn-ghost btn-xs"
                  disabled={loading}
                  title="Undo the CERT notification so the checks can be revised"
                  onClick={() => setPending({
                    label: 'Reset CERT notification',
                    action: () => run(() => resetCertNotification(ticket._id)),
                  })}
                >
                  Reset
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                disabled={loading || !advisoryChecksComplete}
                title={!advisoryChecksComplete ? 'All three checks must be Yes first' : undefined}
                onClick={() => run(() => notifyCert(ticket._id, { note }))}
              >
                Notify CERT
              </button>
            )}
          </div>
        </div>
      )}

      {ticket.status === 'disclosure' && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <YesNo label="Update available?" value={!!disc.updateAvailable}
              onChange={v => { const n = { ...disc, updateAvailable: v }; setDisc(n); saveStage({ disclosure: n }, 'Disclosure data saved.'); }} />
            <YesNo label="Update instructions available?" value={!!disc.updateInstructionsAvailable}
              onChange={v => { const n = { ...disc, updateInstructionsAvailable: v }; setDisc(n); saveStage({ disclosure: n }, 'Disclosure data saved.'); }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <label className="label" style={{ margin: 0, minWidth: 160 }}>Update URL</label>
              <input className="input" style={{ flex: 1, minWidth: 200 }} value={disc.updateUrl || ''}
                placeholder="https://…"
                onChange={e => setDisc({ ...disc, updateUrl: e.target.value })}
                onBlur={() => saveStage({ disclosure: disc }, 'Disclosure data saved.')} />
            </div>
            <YesNo label="Advisory completed?" value={!!disc.advisoryCompleted}
              onChange={v => { const n = { ...disc, advisoryCompleted: v }; setDisc(n); saveStage({ disclosure: n }, 'Disclosure data saved.'); }} />
          </div>
          <div style={{ padding: '14px 16px', background: 'rgba(0,200,200,0.04)', border: '1px solid rgba(0,200,200,0.15)', borderRadius: 'var(--radius-sm)' }}>
            <div className="section-label" style={{ marginBottom: 10 }}>
              {advisory ? `Advisory Draft — ${advisory.title}` : 'Draft Security Advisory'}
            </div>
            <AdvisoryForm ticket={ticket} existing={advisory} onSaved={onChanged} />
          </div>
        </div>
      )}

      {ticket.status === 'reporting' && (
        <div style={{ marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Required Reports</div>
          {reportTasks.map(t => {
            const rem2 = timeRemaining(t.due);
            const done = !!t.report?.submittedAt;
            return (
              <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <TaskIcon state={done ? 'done' : t.report ? 'draft' : 'todo'} />
                <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1 }}>{t.label}</span>
                {done
                  ? <span className="pill pill-done">Submitted</span>
                  : t.report
                  ? <span className="pill pill-pending">Draft</span>
                  : t.due
                  ? <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: rem2?.overdue ? '#f87171' : 'var(--text-2)' }}>{rem2?.label}</span>
                  : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>pending</span>
                }
                {!done && (
                  <button className="btn btn-ghost btn-xs" onClick={gotoReports}>{t.report ? 'Edit' : 'Draft'} →</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Comment (optional) */}
      <div style={{ marginBottom: 14 }}>
        <label className="label">Comment (optional — recorded in the audit trail)</label>
        <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)}
          placeholder="Reasoning, references, context…" style={{ resize: 'vertical' }} />
      </div>

      {/* ── The decision ── */}
      <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
        {({
          receipt:      'Ready to start validation?',
          validation:   'Is this a valid vulnerability report per the CVD policy?',
          verification: 'Confirm the verification verdict.',
          remediation:  'Remediation documented — continue to Advisory?',
          advisory:     'CERT notified — continue to Disclosure?',
          disclosure:   isActive ? 'Disclosure complete — continue to Reporting?' : 'Disclosure complete — close the case?',
          reporting:    'All reports submitted?',
        } as any)[ticket.status]}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {ticket.status === 'receipt' && (
          <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => decide('validation')}>
            Start Validation →
          </button>
        )}

        {ticket.status === 'validation' && (
          <>
            <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => decide('verification')}>
              Valid →
            </button>
            <button className="btn btn-danger btn-sm" disabled={loading}
              onClick={() => setPending({ label: 'Invalid — Close Case', action: () => decide('closed') })}>
              Invalid — Close
            </button>
          </>
        )}

        {ticket.status === 'verification' && (
          verdict == null ? (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Pick the exploitability verdict in Step 1 above to continue.
            </span>
          ) : verdict === 'not_exploitable' ? (
            <button className="btn btn-danger btn-sm" disabled={loading}
              onClick={() => setPending({ label: 'Not Exploitable — Close Case (VEX)', action: proceedVerification })}>
              Close Case (VEX) →
            </button>
          ) : verdict === 'actively_exploitable' ? (
            <button className="btn btn-sm" disabled={loading}
              style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.5)', color: '#f87171', fontWeight: 700 }}
              onClick={() => setPending({ label: 'Actively Exploitable (starts CRA timers)', danger: true, action: proceedVerification })}>
              <ClassDot classification="actively_exploitable" size={8} />
              <span style={{ marginLeft: 6 }}>Confirm Actively Exploitable → Remediation</span>
            </button>
          ) : (
            <button className="btn btn-sm" disabled={loading}
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.45)', color: '#f59e0b', fontWeight: 700 }}
              onClick={proceedVerification}>
              <ClassDot classification="exploitable" size={8} />
              <span style={{ marginLeft: 6 }}>Confirm Exploitable → Remediation</span>
            </button>
          )
        )}

        {ticket.status === 'remediation' && (
          <button
            className="btn btn-primary btn-sm"
            disabled={loading || !remediationComplete}
            title={!remediationComplete ? 'Root cause, method, and fix description are required' : undefined}
            onClick={() => run(async () => {
              await updateStageData(ticket._id, { remediation: rem, expectedUpdatedAt: ticket.updatedAt });
              await transitionTicket(ticket._id, { toStatus: 'advisory', note });
            })}
          >
            Complete Remediation → Advisory
          </button>
        )}

        {ticket.status === 'advisory' && (
          <button
            className="btn btn-primary btn-sm"
            disabled={loading || !ticket.certNotifiedAt}
            title={!ticket.certNotifiedAt ? 'Notify CERT first' : undefined}
            onClick={() => decide('disclosure')}
          >
            Continue to Disclosure →
          </button>
        )}

        {ticket.status === 'disclosure' && (
          <button
            className="btn btn-primary btn-sm"
            disabled={loading || !disclosureComplete}
            title={!disclosureComplete ? 'Update, instructions, URL, and advisory must all be complete' : undefined}
            onClick={() => run(async () => {
              await updateStageData(ticket._id, { disclosure: disc, expectedUpdatedAt: ticket.updatedAt });
              await transitionTicket(ticket._id, { toStatus: isActive ? 'reporting' : 'closed', note });
            })}
          >
            {isActive ? 'Publish & Continue to Reporting →' : 'Publish & Close Case ✓'}
          </button>
        )}

        {ticket.status === 'reporting' && (
          <button
            className="btn btn-primary btn-sm"
            disabled={loading || !allReportsSubmitted}
            title={!allReportsSubmitted ? 'Submit all three reports first' : undefined}
            onClick={() => setPending({ label: 'Close Case', action: () => decide('closed') })}
          >
            Close Case ✓
          </button>
        )}
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 12, marginTop: 10 }}>{error}</div>}
      {saved && !error && <div style={{ color: 'var(--success)', fontSize: 12, marginTop: 10 }}>{saved}</div>}

      {/* Upcoming step */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11.5, color: 'var(--text-3)' }}>
        <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: 9.5 }}>Next:</span>{' '}
        {meta.next}
      </div>

      <ConfirmDialog
        open={!!pending}
        title="Record Decision"
        message={pending ? `"${pending.label}" will be recorded in the audit trail and trigger the standard notifications. Continue?` : ''}
        confirmLabel={pending?.label}
        danger={pending?.danger || pending?.label?.includes('Close')}
        onConfirm={() => pending.action()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

/* ── CVSS helpers (FIRST.org 3.1 qualitative severity rating scale) ── */
// https://www.first.org/cvss/specification-document#Qualitative-Severity-Rating-Scale
function severityForScore(score: number): string {
  if (Number.isNaN(score)) return '';
  if (score === 0)  return 'None';
  if (score < 4)    return 'Low';
  if (score < 7)    return 'Medium';
  if (score < 9)    return 'High';
  return 'Critical';
}
function severityColor(severity?: string): string {
  switch (severity) {
    case 'Critical': return '#f87171';
    case 'High':     return '#f59e0b';
    case 'Medium':   return '#fbbf24';
    case 'Low':      return '#00e676';
    default:         return 'var(--text-2)';
  }
}


/* ── Researcher-notification block (Receipt & Validation) ─────── */
function NotifyBlock({ label, state, onChange, onUpload, onSave }: {
  label: string; state: any; onChange: (s: any) => void;
  onUpload: (l: FileList | null) => void; onSave: () => void;
}) {
  // Which zone the officer enters the time in (defaults to German time).
  const [tz, setTz] = useState(getTimezone());
  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', background: 'var(--card-hi)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
      <YesNo
        label={label}
        value={!!state.researcherNotified}
        onChange={v => onChange({ ...state, researcherNotified: v, researcherNotifiedAt: v && !state.researcherNotifiedAt ? new Date().toISOString() : state.researcherNotifiedAt })}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <label className="label" style={{ margin: 0, minWidth: 120 }}>Notification date &amp; time</label>
        <input className="input" type="datetime-local" style={{ width: 210 }}
          value={toZonedInput(state.researcherNotifiedAt, tz)}
          onChange={e => onChange({ ...state, researcherNotifiedAt: zonedInputToISO(e.target.value, tz) })} />
        <select className="input" style={{ width: 130 }} value={tz} onChange={e => setTz(e.target.value)} title="Enter the time in this zone">
          {TIMEZONES.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
        </select>
        <button type="button" className="btn btn-ghost btn-xs"
          onClick={() => onChange({ ...state, researcherNotifiedAt: new Date().toISOString() })}>
          Now
        </button>
      </div>
      {state.researcherNotifiedAt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TIMEZONES.map(z => (
            <div key={z.id} className="mono" style={{ fontSize: 10.5, color: z.id === tz ? 'var(--text-2)' : 'var(--text-3)' }}>
              <span style={{ display: 'inline-block', minWidth: 84, color: 'var(--text-3)' }}>{z.label}</span>
              {fmtDateTime(state.researcherNotifiedAt, z.id)}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="btn btn-ghost btn-xs" style={{ cursor: 'pointer' }}>
          + Attach screenshot
          <input type="file" multiple accept=".pdf,image/png,image/jpeg,image/gif,image/webp" style={{ display: 'none' }}
            onChange={e => { onUpload(e.target.files); e.target.value = ''; }} />
        </label>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onSave}>Save</button>
      </div>
    </div>
  );
}

/* ── Yes/No toggle row ───────────────────────────────────────── */
function YesNo({ label, value, onChange, disabled }: {
  label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span className="label" style={{ margin: 0, minWidth: 160 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(o => {
          const active = value === o.v;
          const color = o.v ? 'var(--success)' : 'var(--text-3)';
          return (
            <button
              key={o.l}
              type="button"
              className="btn btn-xs"
              disabled={disabled}
              style={{
                border: `1px solid ${active ? color : 'var(--border)'}`,
                background: active ? (o.v ? 'var(--success-dim)' : 'var(--hover-bg)') : 'transparent',
                color: active ? color : 'var(--text-2)',
                fontWeight: active ? 700 : 500,
                opacity: disabled ? 0.6 : 1,
              }}
              onClick={() => onChange(o.v)}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Report task state icon ──────────────────────────────────── */
function TaskIcon({ state }: { state: 'done' | 'draft' | 'todo' }) {
  const color = state === 'done' ? '#00e676' : state === 'draft' ? '#f59e0b' : 'var(--text-3)';
  return (
    <span style={{ color, display: 'flex', flexShrink: 0 }}>
      {state === 'done' ? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.2" /><path d="m5.4 8.2 1.8 1.8 3.4-3.8" />
        </svg>
      ) : state === 'draft' ? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.2" /><path d="M8 5v3.2l2.2 1.4" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6.2" strokeDasharray="2.4 2.4" />
        </svg>
      )}
    </span>
  );
}
