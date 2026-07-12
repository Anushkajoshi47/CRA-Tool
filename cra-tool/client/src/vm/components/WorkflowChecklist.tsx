import React, { useState } from 'react';
import { transitionTicket } from '../api/vmApi';
import { timeRemaining, computeDeadlines } from '../utils/clockCalculations';
import AdvisoryForm from './AdvisoryForm';
import ConfirmDialog from '../../shared/ConfirmDialog';

// Guided case tracker rendered like a classic VM process diagram:
// numbered color-coded steps, labelled YES/NO branches, and red
// reject/close outcome boxes beside each decision.

const CATS = {
  intake:        { label: 'Intake & Validation', color: '#60a5fa' },
  assessment:    { label: 'Assessment',          color: '#00e676' },
  decision:      { label: 'Decision',            color: '#f59e0b' },
  remediation:   { label: 'Remediation',         color: '#a78bfa' },
  communication: { label: 'Communication',       color: '#00c8c8' },
  closure:       { label: 'Reporting & Closure', color: '#c4f914' },
};

const STEP_META = {
  received: {
    cat: 'intake',
    title: 'Vulnerability Reported',
    guide: 'Report received and ticket number assigned; acknowledgement logged for the researcher. Assign a case manager (PSSO of the affected product).',
    question: 'Ready to start validation?',
    actions: [{ to: 'validating', label: 'Start Validation', branch: 'yes' }],
  },
  validating: {
    cat: 'intake',
    title: 'Validation (PSSE)',
    guide: 'Verify and confirm the report against the CVD policy: in scope, plausible, complete? The note is sent to the researcher as the reason.',
    question: 'Is the report a valid vulnerability?',
    actions: [
      { to: 'determining_type', label: 'YES — Valid', branch: 'yes' },
      { to: 'invalid', label: 'NO — Reject / Close', branch: 'no',
        exit: { title: 'REJECT / CLOSE', desc: 'The report is not a valid vulnerability or falls outside the scope. Researcher informed.', tone: 'red' } },
    ],
  },
  determining_type: {
    cat: 'decision',
    title: 'Determine Report Type',
    guide: 'Does the report claim the vulnerability is being actively exploited in the wild? Urgent tickets go straight to immediate verification.',
    question: 'Claims active exploitation?',
    actions: [
      { to: 'verifying', label: 'NO — Standard Ticket', branch: 'yes' },
      { to: 'urgent_verifying', label: 'YES — Urgent Ticket', branch: 'urgent' },
    ],
  },
  verifying: {
    cat: 'assessment',
    title: 'Verification (Development + PSSE)',
    guide: 'Development attempts to reproduce the vulnerability in our product (reproducibility, affected products/services).',
    question: 'Reproducible in our product?',
    actions: [
      { to: 'assessing_risk', label: 'YES — Reproducible', branch: 'yes' },
      { to: 'not_reproducible', label: 'NO — Reject / Close', branch: 'no',
        exit: { title: 'REJECT / CLOSE', desc: 'The vulnerability is not reproducible or the product is not affected. Researcher informed.', tone: 'red' } },
    ],
  },
  assessing_risk: {
    cat: 'decision',
    title: 'Evaluation & Prioritization',
    guide: 'Evaluate the vulnerability (CVSS score, exploitability under practical operating conditions, impact) and prioritize for handling.',
    question: 'Exploitable under practical conditions?',
    actions: [
      { to: 'determining_urgency', label: 'YES — Action Required', branch: 'yes' },
      { to: 'not_exploitable', label: 'NO — No Action Necessary', branch: 'no',
        exit: { title: 'NO ACTION NECESSARY', desc: 'Not exploitable under practical conditions — documented as VEX. Researcher informed.', tone: 'amber' } },
    ],
  },
  determining_urgency: {
    cat: 'decision',
    title: 'Determine & Document Urgency',
    guide: 'Known exploitable vulnerability. Document criticality (CVSS, safety impact, damage potential) and choose the deployment priority.',
    question: 'Urgency documented?',
    actions: [{ to: 'root_cause_analysis', label: 'Start Remediation', branch: 'yes' }],
  },
  urgent_verifying: {
    cat: 'assessment',
    title: 'URGENT — Verify Exploitation',
    guide: 'Immediate action: verify whether there is reliable evidence the vulnerability is exploited in our product. Confirming starts the CRA Art. 14 clock.',
    question: 'Reliable evidence of active exploitation?',
    actions: [
      { to: 'actively_exploited', label: 'YES — Confirm (starts CRA clock)', branch: 'urgent' },
      { to: 'not_verified', label: 'NO — Reject / Close', branch: 'no',
        exit: { title: 'REJECT / CLOSE', desc: 'Not verifiable or not caused by a vulnerability in our product. Researcher informed.', tone: 'red' } },
    ],
  },
  actively_exploited: {
    cat: 'decision',
    title: 'CRA Reporting Obligations Started',
    guide: 'The clock is running: 24h early warning and 72h notification to ENISA (report tasks below). Proceed to remediation in parallel.',
    question: 'Early warning underway?',
    actions: [{ to: 'root_cause_analysis', label: 'Start Remediation', branch: 'yes' }],
  },
  root_cause_analysis: {
    cat: 'remediation',
    title: 'Remediation Planning — Root Cause',
    guide: 'Reproduce and identify the technical cause; define appropriate remedial measures (fix, mitigation, or workaround).',
    question: 'Root cause identified?',
    actions: [{ to: 'developing_mitigation', label: 'Root Cause Found', branch: 'yes' }],
  },
  developing_mitigation: {
    cat: 'remediation',
    title: 'Remediation Implementation — Develop',
    guide: 'Develop and test the fix, mitigation, or workaround; document its effectiveness.',
    question: 'Fix / workaround available?',
    actions: [{ to: 'deploying_mitigation', label: 'Ready to Deploy', branch: 'yes' }],
  },
  deploying_mitigation: {
    cat: 'remediation',
    title: 'Remediation Implementation — Deploy',
    guide: 'Release and roll out per the chosen deployment type (standard cycle / prioritized / immediate). Deployment stamps the mitigation date (drives the 14-day final report).',
    question: 'Mitigation deployed?',
    actions: [{ to: 'assessing_residual_risk', label: 'Deployed', branch: 'yes' }],
  },
  assessing_residual_risk: {
    cat: 'decision',
    title: 'Assess Residual Risk',
    guide: 'With the mitigation in the field, is the remaining risk acceptable?',
    question: 'Residual risk acceptable?',
    actions: [
      { to: 'documenting_advisory', label: 'YES — Successful', branch: 'yes' },
      { to: 'root_cause_analysis', label: 'NO — Rework Mitigation', branch: 'loop',
        exit: { title: 'REMEDIATION INSUFFICIENT', desc: 'Loops back to remediation planning until the residual risk is acceptable.', tone: 'amber' } },
    ],
  },
  documenting_advisory: {
    cat: 'communication',
    title: 'Information & Disclosure',
    guide: 'Draft the security advisory below (affected products, severity, remedies, references). Publishing informs customers and acknowledges the researcher.',
    question: 'Advisory drafted?',
    actions: [{ to: 'advisory_published', label: 'Publish Advisory', branch: 'yes' }],
    embed: 'advisory',
  },
  advisory_published: {
    cat: 'closure',
    title: 'Reporting (as required)',
    guide: 'Advisory is live — customers and researcher informed. Complete outstanding ENISA reports (final report due 14 days after mitigation / 1 month for incidents).',
    question: 'All reports submitted?',
    actions: [{ to: 'closed', label: 'Close Ticket', branch: 'yes' }],
  },
  // Terminal outcomes
  invalid:          { terminal: true, tone: 'red',   title: 'REJECTED / CLOSED', desc: 'The report is not a valid vulnerability or falls outside the scope.' },
  not_reproducible: { terminal: true, tone: 'red',   title: 'REJECTED / CLOSED', desc: 'The vulnerability is not reproducible or the product is not affected.' },
  not_verified:     { terminal: true, tone: 'red',   title: 'REJECTED / CLOSED', desc: 'Not verifiable or not caused by a vulnerability in our product.' },
  not_exploitable:  { terminal: true, tone: 'amber', title: 'NO ACTION NECESSARY', desc: 'Not exploitable under practical conditions — documented as VEX.' },
  closed:           { terminal: true, tone: 'green', title: 'CLOSED', desc: 'Case tracked to closure; all related information archived.' },
};

// Label shown on the connector arrow for how a state was entered
function entryLabel(h) {
  if (h.fromStatus === 'assessing_residual_risk' && h.toStatus === 'root_cause_analysis') {
    return { text: 'NOT SUCCESSFUL — REWORK', color: '#f59e0b' };
  }
  const map = {
    validating:              { text: 'START',                       color: '#00e676' },
    invalid:                 { text: 'NO',                          color: '#f87171' },
    determining_type:        { text: 'YES — VALID',                 color: '#00e676' },
    verifying:               { text: 'NO CLAIM — STANDARD',         color: '#00e676' },
    urgent_verifying:        { text: 'CLAIMS ACTIVE EXPLOITATION',  color: '#f87171' },
    not_reproducible:        { text: 'NO',                          color: '#f87171' },
    assessing_risk:          { text: 'YES — REPRODUCIBLE',          color: '#00e676' },
    not_exploitable:         { text: 'NO ACTION',                   color: '#f59e0b' },
    determining_urgency:     { text: 'ACTION REQUIRED',             color: '#00e676' },
    not_verified:            { text: 'NO',                          color: '#f87171' },
    actively_exploited:      { text: 'YES — CONFIRMED',             color: '#f87171' },
    root_cause_analysis:     { text: 'ACTION REQUIRED',             color: '#00e676' },
    developing_mitigation:   { text: 'ROOT CAUSE FOUND',            color: '#00e676' },
    deploying_mitigation:    { text: 'FIX / WORKAROUND AVAILABLE',  color: '#00e676' },
    assessing_residual_risk: { text: 'DEPLOYED',                    color: '#00e676' },
    documenting_advisory:    { text: 'SUCCESSFUL',                  color: '#00e676' },
    advisory_published:      { text: 'PUBLISHED',                   color: '#00e676' },
    closed:                  { text: 'DONE',                        color: '#00e676' },
  };
  return map[h.toStatus] || null;
}

const MAIN_LINE = [
  'received', 'validating', 'determining_type', 'verifying', 'assessing_risk',
  'determining_urgency', 'root_cause_analysis', 'developing_mitigation',
  'deploying_mitigation', 'assessing_residual_risk', 'documenting_advisory',
  'advisory_published', 'closed',
];
const URGENT_TAIL = [
  'urgent_verifying', 'actively_exploited', 'root_cause_analysis', 'developing_mitigation',
  'deploying_mitigation', 'assessing_residual_risk', 'documenting_advisory',
  'advisory_published', 'closed',
];

function upcomingAfter(status) {
  if (status === 'urgent_verifying' || status === 'actively_exploited') {
    return URGENT_TAIL.slice(URGENT_TAIL.indexOf(status) + 1);
  }
  const i = MAIN_LINE.indexOf(status);
  return i >= 0 ? MAIN_LINE.slice(i + 1) : [];
}

const TONE = {
  red:   { color: '#f87171', bg: 'rgba(248,113,113,0.07)',  border: 'rgba(248,113,113,0.35)', icon: '✕' },
  amber: { color: '#f59e0b', bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.35)',  icon: '—' },
  green: { color: '#00e676', bg: 'rgba(0,230,118,0.07)',    border: 'rgba(0,230,118,0.35)',   icon: '✓' },
};

export default function WorkflowChecklist({ ticket, history, reports, advisory, onChanged, gotoReports }: any) {
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [pending, setPending] = useState(null);

  const meta = STEP_META[ticket.status] || { title: ticket.status };

  // history = entries into states; the last entry is the CURRENT state
  const past    = history.slice(0, -1);
  const current = history[history.length - 1];

  async function decide(toStatus) {
    setPending(null);
    setLoading(true);
    setError('');
    try {
      await transitionTicket(ticket._id, { toStatus, note });
      setNote('');
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  const deadlines = ticket.clockStartedAt
    ? computeDeadlines(ticket.clockStartedAt, ticket.mitigationDeployedAt, ticket.isIncident)
    : null;
  const reportTasks = deadlines ? [
    { type: 'initial',  label: '24h Early Warning (ENISA)', due: deadlines.initial },
    { type: 'detailed', label: '72h Detailed Notification',  due: deadlines.detailed },
    { type: 'final',    label: ticket.isIncident ? 'Final Report (1 month)' : 'Final Report (14d after mitigation)', due: deadlines.final },
  ].map(t => ({ ...t, report: reports.find(r => r.type === t.type) })) : [];

  let num = 0;

  return (
    <div style={{ maxWidth: 780 }}>
      {/* ── Completed steps ── */}
      {past.map((h, i) => {
        num += 1;
        const m   = STEP_META[h.toStatus] || {};
        const cat = CATS[m.cat] || CATS.intake;
        const arrow = i > 0 ? entryLabel(h) : null;
        return (
          <React.Fragment key={h._id || i}>
            {arrow && <Connector label={arrow.text} color={arrow.color} />}
            <StepCard num={num} color={cat.color} done>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.title || h.toStatus.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{new Date(h.timestamp).toLocaleString()}</span>
              </div>
              {h.note && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>“{h.note}”</div>}
            </StepCard>
          </React.Fragment>
        );
      })}

      {/* ── Current step (or terminal outcome) ── */}
      {current && (() => {
        num += 1;
        const arrow = past.length > 0 ? entryLabel(current) : null;

        if (meta.terminal) {
          const tone = TONE[meta.tone] || TONE.red;
          return (
            <>
              {arrow && <Connector label={arrow.text} color={arrow.color} />}
              <div style={{
                display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 20px',
                background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 'var(--radius)',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: tone.color, color: '#0a0a0f', fontWeight: 800, fontSize: 14,
                }}>{tone.icon}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: tone.color, letterSpacing: '0.04em' }}>{meta.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.6 }}>{meta.desc}</div>
                  {current.note && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, fontStyle: 'italic' }}>“{current.note}”</div>}
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 6, fontFamily: 'var(--mono)' }}>{new Date(current.timestamp).toLocaleString()}</div>
                </div>
              </div>
            </>
          );
        }

        const cat   = CATS[meta.cat] || CATS.intake;
        const exits = (meta.actions || []).filter(a => a.exit);
        return (
          <>
            {arrow && <Connector label={arrow.text} color={arrow.color} />}
            <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
              {/* Main current card */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <StepCard num={num} color={cat.color} active>
                  <div style={{ fontSize: 10, fontWeight: 700, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    Current step — {cat.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{meta.title}</div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 14px' }}>{meta.guide}</p>

                  {reportTasks.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div className="section-label" style={{ marginBottom: 8 }}>CRA Report Tasks</div>
                      {reportTasks.map(t => {
                        const rem = timeRemaining(t.due);
                        const done = !!t.report?.submittedAt;
                        return (
                          <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 13 }}>{done ? '✅' : t.report ? '📝' : '⬜'}</span>
                            <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1 }}>{t.label}</span>
                            {done
                              ? <span className="pill pill-done">Submitted</span>
                              : t.report
                              ? <span className="pill pill-pending">Draft</span>
                              : t.due
                              ? <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: rem?.overdue ? '#f87171' : 'var(--text-2)' }}>{rem?.label}</span>
                              : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>pending mitigation</span>
                            }
                            {!done && (
                              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={gotoReports}>
                                {t.report ? 'Edit' : 'Draft'} →
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {meta.embed === 'advisory' && (
                    <div style={{ marginBottom: 14, padding: '14px 16px', background: 'rgba(0,200,200,0.04)', border: '1px solid rgba(0,200,200,0.15)', borderRadius: 'var(--radius-sm)' }}>
                      <div className="section-label" style={{ marginBottom: 10 }}>
                        {advisory ? `Advisory Draft — ${advisory.title}` : 'Draft Security Advisory'}
                      </div>
                      <AdvisoryForm ticket={ticket} existing={advisory} onSaved={onChanged} />
                    </div>
                  )}

                  <div style={{ marginBottom: 12 }}>
                    <label className="label">Decision Note (sent to researcher on closures)</label>
                    <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Findings, reasons, references for the audit trail..." style={{ resize: 'vertical' }} />
                  </div>

                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>{meta.question}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {(meta.actions || []).map(a => (
                      <button
                        key={a.to}
                        disabled={loading || (a.to === 'advisory_published' && !advisory)}
                        title={a.to === 'advisory_published' && !advisory ? 'Save the advisory draft first' : undefined}
                        onClick={() => setPending(a)}
                        className={`btn btn-sm ${a.branch === 'no' ? 'btn-danger' : a.branch === 'yes' ? 'btn-primary' : 'btn-ghost'}`}
                        style={a.branch === 'urgent'
                          ? { background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.5)', color: '#f87171', fontWeight: 700 }
                          : a.branch === 'loop' ? { color: '#f59e0b' } : {}}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  {error && <div style={{ color: '#f87171', fontSize: 12, marginTop: 10 }}>{error}</div>}
                </StepCard>
              </div>

              {/* Outcome boxes beside the decision, like the diagram */}
              {exits.length > 0 && (
                <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                  {exits.map(a => {
                    const tone = TONE[a.exit.tone] || TONE.red;
                    return (
                      <div key={a.to} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: tone.color, whiteSpace: 'nowrap' }}>NO →</div>
                        <div style={{ flex: 1, padding: '10px 12px', background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{
                              width: 16, height: 16, borderRadius: '50%', background: tone.color, color: '#0a0a0f',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800,
                            }}>{tone.icon}</span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: tone.color, letterSpacing: '0.05em' }}>{a.exit.title}</span>
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{a.exit.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* ── Upcoming steps ── */}
      {!meta.terminal && upcomingAfter(ticket.status).map(s => {
        num += 1;
        const m   = STEP_META[s] || {};
        const cat = CATS[m.cat] || CATS.intake;
        return (
          <React.Fragment key={s}>
            <Connector />
            <div style={{ opacity: 0.45 }}>
              <StepCard num={num} color={cat.color}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>{m.title || s.replace(/_/g, ' ')}</span>
              </StepCard>
            </div>
          </React.Fragment>
        );
      })}

      {/* ── Legend ── */}
      <div style={{
        marginTop: 24, padding: '12px 16px', border: '1px dashed var(--border-hi)', borderRadius: 'var(--radius-sm)',
        display: 'flex', flexWrap: 'wrap', gap: '8px 18px',
      }}>
        {Object.values(CATS).map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: `${c.color}33`, border: `1.5px solid ${c.color}` }} />
            <span style={{ fontSize: 10.5, color: 'var(--text-2)' }}>{c.label}</span>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!pending}
        title="Record decision"
        message={pending ? `"${pending.label}" will be recorded in the audit trail${pending.branch === 'no' || pending.branch === 'urgent' ? ' and trigger the standard notification' : ''}. Continue?` : ''}
        confirmLabel={pending?.label}
        danger={pending?.branch === 'no' || pending?.branch === 'urgent'}
        onConfirm={() => decide(pending.to)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function StepCard({ num, color, done, active, children }: {
  num: number; color: string; done?: boolean; active?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start',
      padding: active ? '18px 20px' : '12px 16px',
      background: `${color}0d`,
      border: `1px solid ${active ? color + '66' : color + '2e'}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-sm)',
      boxShadow: active ? `0 0 24px ${color}14` : 'none',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? color : 'transparent',
        border: `2px solid ${color}`,
        color: done ? '#0a0a0f' : color,
        fontSize: 12, fontWeight: 800,
      }}>
        {done ? '✓' : num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function Connector({ label, color }: { label?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0 2px 26px', height: 26 }}>
      <div style={{ width: 2, alignSelf: 'stretch', background: 'var(--border-hi)', marginLeft: -14 }} />
      <span style={{ color: 'var(--text-3)', fontSize: 11, marginLeft: 4 }}>↓</span>
      {label && (
        <span style={{ fontSize: 9.5, fontWeight: 800, color: color || 'var(--text-3)', letterSpacing: '0.06em' }}>
          {label}
        </span>
      )}
    </div>
  );
}
