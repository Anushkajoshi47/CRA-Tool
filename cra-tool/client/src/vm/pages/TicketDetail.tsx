import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTicket, getTicketActivity, getTicketNotifications, getReports, getAdvisories, updateReport, deleteReport, transitionTicket, deleteTicket } from '../api/vmApi';
import { stageLabel } from '../utils/lifecycleConfig';
import ConfirmDialog from '../../shared/ConfirmDialog';
import StatusBadge, { ClassificationBadge } from '../components/StatusBadge';
import ClockWidget from '../components/ClockWidget';
import DecisionCard from '../components/DecisionCard';
import Timeline from '../components/Timeline';
import ReportForm from '../components/ReportForm';
import FlowStepper from '../components/FlowStepper';
import { SEVERITY_COLOR } from '../components/CvssCalculator';

const TABS = ['workflow', 'overview', 'timeline', 'communications', 'reports'];

const AUDIENCE_META = {
  finder:    { label: 'Finder',        color: '#60a5fa' },
  users:     { label: 'Product Users', color: '#00e676' },
  authority: { label: 'ENISA / CSIRT', color: '#f87171' },
};

export default function TicketDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [ticket,  setTicket]        = useState(null);
  const [activity, setActivity]     = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports]       = useState([]);
  const [advisory, setAdvisory]     = useState(null);
  const [tab,     setTab]           = useState('workflow');
  const [loading, setLoading]       = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReport, setEditingReport]   = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const [moveBackTo, setMoveBackTo]         = useState<string | null>(null);
  const [confirmDeleteCase, setConfirmDeleteCase] = useState(false);
  const [actionError, setActionError]       = useState('');

  async function moveBack() {
    if (!moveBackTo) return;
    setActionError('');
    try {
      await transitionTicket(id!, { toStatus: moveBackTo, note: 'Revising an earlier decision' });
      setMoveBackTo(null);
      load();
    } catch (err: any) {
      setMoveBackTo(null);
      setActionError(err.response?.data?.message || 'Could not move the case back');
    }
  }

  async function removeCase() {
    setActionError('');
    try {
      await deleteTicket(id!);
      navigate('/vm/tickets');
    } catch (err: any) {
      setConfirmDeleteCase(false);
      setActionError(err.response?.data?.message || 'Could not delete the case');
    }
  }

  async function markSubmitted(report) {
    await updateReport(report._id, { submittedAt: new Date().toISOString() });
    load();
  }

  async function removeReport() {
    if (!deletingReport) return;
    await deleteReport(deletingReport._id);
    setDeletingReport(null);
    load();
  }

  const load = useCallback(async () => {
    try {
      const [t, h, n, r, a] = await Promise.all([
        getTicket(id),
        getTicketActivity(id),
        getTicketNotifications(id),
        getReports(id),
        getAdvisories(id),
      ]);
      setTicket(t.data);
      setActivity(h.data);
      setNotifications(n.data);
      setReports(r.data);
      setAdvisory(a.data[0] || null);
    } catch {
      navigate('/vm/tickets');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 40, color: 'var(--text-2)' }}>Loading…</div>;
  if (!ticket)  return null;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 860 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
        <Link to="/vm/tickets" style={{ color: 'var(--text-3)' }}>Ticket Queue</Link>
        {' / '}
        <span style={{ fontFamily: 'var(--mono)' }}>{ticket.ticketNumber}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>
            {ticket.ticketNumber}
          </span>
          <StatusBadge status={ticket.status} />
          <ClassificationBadge
            classification={ticket.classification}
            pulse={ticket.classification === 'actively_exploitable' && ticket.status !== 'closed'}
          />
          {ticket.cvss?.score != null && (
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: SEVERITY_COLOR[ticket.cvss.severity] || 'var(--text-2)' }}>
              CVSS {Number(ticket.cvss.score).toFixed(1)}
            </span>
          )}
          {ticket.isIncident && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Security Incident
            </span>
          )}
          <button
            className="btn btn-danger btn-xs"
            style={{ marginLeft: 'auto' }}
            onClick={() => setConfirmDeleteCase(true)}
          >
            Delete Case
          </button>
        </div>
        {ticket.title && (
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.35 }}>
            {ticket.title}
          </div>
        )}
        {ticket.affectedProducts?.length > 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {ticket.affectedProducts.map((p, i) => (
              <span key={i} style={{ marginRight: 14 }}>
                <span style={{ color: 'var(--text)' }}>{p.name}</span>
                {p.version && <span style={{ color: 'var(--text-3)', marginLeft: 5 }}>{p.version}</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lifecycle position — click an earlier stage to move the case back */}
      <FlowStepper
        status={ticket.status}
        closedReason={ticket.closedReason}
        classification={ticket.classification}
        onStageClick={key => setMoveBackTo(key)}
      />
      {actionError && (
        <div style={{ color: '#f87171', fontSize: 12, margin: '-12px 0 16px' }}>{actionError}</div>
      )}

      {/* CRA Clock */}
      <ClockWidget
        clockStartedAt={ticket.clockStartedAt}
        mitigationDeployedAt={ticket.mitigationDeployedAt}
        isIncident={ticket.isIncident}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '9px 18px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--accent)' : 'var(--text-2)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              textTransform: 'capitalize',
            }}
          >
            {t}
            {t === 'reports' && reports.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--border)', borderRadius: 10, padding: '1px 6px', color: 'var(--text-2)' }}>
                {reports.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Title" value={ticket.title || '—'} />
          <Field label="Description" value={ticket.description} pre />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Field label="Reporter"          value={ticket.reporterName || '—'} />
            <Field label="Reporter Contact"  value={ticket.reporterContact || '—'} />
            <Field label="Source Channel"    value={ticket.sourceChannel?.replace(/_/g, ' ')} />
            <Field label="Date Reported"     value={new Date(ticket.createdAt).toLocaleDateString()} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
            <Field label="Deployment Environment" value={ticket.environment || '—'} />
            <Field label="Case Manager (PSSO)" value={ticket.caseManager || 'Unassigned'} />
            <Field label="Case Type"           value={ticket.isIncident ? 'Security Incident' : 'Vulnerability'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Field label="Classification" value={
              ticket.classification === 'actively_exploitable' ? 'Actively Exploitable'
              : ticket.classification === 'exploitable' ? 'Exploitable'
              : 'Not yet classified'
            } />
            <Field label="CVSS" value={ticket.cvss?.score != null ? `${Number(ticket.cvss.score).toFixed(1)} (${ticket.cvss.severity})` : '—'} />
            <Field label="CERT Notified" value={ticket.certNotifiedAt ? new Date(ticket.certNotifiedAt).toLocaleDateString() : '—'} />
            <Field label="Outcome" value={ticket.closedReason ? ticket.closedReason.replace(/_/g, ' ') : 'Open'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Created"      value={new Date(ticket.createdAt).toLocaleString()} />
            <Field label="Last Updated" value={new Date(ticket.updatedAt).toLocaleString()} />
          </div>
          {ticket.clockStartedAt && (
            <Field label="CRA Clock Started" value={new Date(ticket.clockStartedAt).toLocaleString()} />
          )}
          {ticket.mitigationDeployedAt && (
            <Field label="Mitigation Deployed" value={new Date(ticket.mitigationDeployedAt).toLocaleString()} />
          )}
        </div>
      )}

      {/* Activity Timeline — the case's audit trail */}
      {tab === 'timeline' && <Timeline ticketId={id!} activity={activity} onChanged={load} />}

      {/* Communications — message flows from the VDMA process graph */}
      {tab === 'communications' && (
        notifications.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No communications logged yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(n => {
              const meta = AUDIENCE_META[n.audience] || { label: n.audience, color: '#a8a8c8' };
              return (
                <div key={n._id} className="card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                    color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}44`,
                    borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {meta.label}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.55 }}>{n.message}</p>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Workflow — the current decision drives the case */}
      {tab === 'workflow' && (
        <DecisionCard
          ticket={ticket}
          reports={reports}
          advisory={advisory}
          onChanged={load}
          gotoReports={() => setTab('reports')}
        />
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div>
          {showReportForm || editingReport ? (
            <ReportForm
              ticket={ticket}
              existingReport={editingReport}
              onSaved={() => { setShowReportForm(false); setEditingReport(null); load(); }}
              onCancel={() => { setShowReportForm(false); setEditingReport(null); }}
            />
          ) : (
            <>
              {ticket.clockStartedAt ? (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginBottom: 20 }}
                  onClick={() => setShowReportForm(true)}
                >
                  + New Report
                </button>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                  Reports are available once the CRA clock starts (active exploitation confirmed).
                </p>
              )}
              {reports.length === 0 ? (
                <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No reports yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reports.map(r => (
                    <div key={r._id} className="card" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {r.type.replace('_', ' ')} Report
                        </span>
                        {r.submittedAt
                          ? <span className="pill pill-done">Submitted</span>
                          : <span className="pill pill-pending">Draft</span>
                        }
                        {r.dueAt && (
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
                            Due: {new Date(r.dueAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {r.content}
                      </p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => setEditingReport(r)}>
                          Edit
                        </button>
                        {!r.submittedAt && (
                          <button className="btn btn-primary btn-xs" onClick={() => markSubmitted(r)}>
                            Mark as Submitted
                          </button>
                        )}
                        {!r.submittedAt && (
                          <button className="btn btn-danger btn-xs" onClick={() => setDeletingReport(r)}>
                            Delete
                          </button>
                        )}
                        {r.submittedAt && (
                          <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
                            Submitted {new Date(r.submittedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
      <ConfirmDialog
        open={!!deletingReport}
        title="Delete report draft?"
        message={deletingReport ? `The ${deletingReport.type} report draft will be permanently removed.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={removeReport}
        onCancel={() => setDeletingReport(null)}
      />

      <ConfirmDialog
        open={!!moveBackTo}
        title="Move case back?"
        message={moveBackTo ? `The case will move back to "${stageLabel(moveBackTo)}" so the decision can be revised. Documented data is kept, and the move is recorded in the audit trail.${ticket.status === 'closed' ? ' This reopens the closed case.' : ''}` : ''}
        confirmLabel={moveBackTo ? `Move to ${stageLabel(moveBackTo)}` : 'Move'}
        onConfirm={moveBack}
        onCancel={() => setMoveBackTo(null)}
      />

      <ConfirmDialog
        open={confirmDeleteCase}
        title="Delete this case?"
        message={`${ticket.ticketNumber} and everything attached to it — audit history, notifications, reports, advisories — will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete Case"
        danger
        onConfirm={removeCase}
        onCancel={() => setConfirmDeleteCase(false)}
      />
    </div>
  );
}

function Field({ label, value, pre }: { label: string; value?: React.ReactNode; pre?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: pre ? 'pre-wrap' : undefined }}>
        {value || '—'}
      </div>
    </div>
  );
}
