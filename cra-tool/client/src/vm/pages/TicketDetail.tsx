import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTicket, getTicketHistory, getTicketNotifications, getReports, getAdvisories } from '../api/vmApi';
import StatusBadge from '../components/StatusBadge';
import ClockWidget from '../components/ClockWidget';
import WorkflowChecklist from '../components/WorkflowChecklist';
import StatusHistoryLog from '../components/StatusHistoryLog';
import ReportForm from '../components/ReportForm';
import FlowStepper from '../components/FlowStepper';

const TABS = ['workflow', 'overview', 'history', 'communications', 'reports'];

const TERMINAL_STATES = new Set(['invalid', 'not_reproducible', 'not_exploitable', 'not_verified', 'closed']);

const AUDIENCE_META = {
  finder:    { label: 'Finder',        color: '#60a5fa' },
  users:     { label: 'Product Users', color: '#00e676' },
  authority: { label: 'ENISA / CSIRT', color: '#f87171' },
};

export default function TicketDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [ticket,  setTicket]        = useState(null);
  const [history, setHistory]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports]       = useState([]);
  const [advisory, setAdvisory]     = useState(null);
  const [tab,     setTab]           = useState('workflow');
  const [loading, setLoading]       = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, h, n, r, a] = await Promise.all([
        getTicket(id),
        getTicketHistory(id),
        getTicketNotifications(id),
        getReports(id),
        getAdvisories(id),
      ]);
      setTicket(t.data);
      setHistory(h.data);
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
          <StatusBadge
            status={ticket.status}
            pulse={ticket.activelyExploited && !TERMINAL_STATES.has(ticket.status)}
          />
          {ticket.isIncident && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Security Incident
            </span>
          )}
          {ticket.activelyExploited && (
            <span className="urgent-pulse" style={{ fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ⚡ Active Exploit Confirmed
            </span>
          )}
        </div>
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

      {/* VDMA process position */}
      <FlowStepper status={ticket.status} />

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
          <Field label="Description" value={ticket.description} pre />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Field label="Source Channel"    value={ticket.sourceChannel?.replace(/_/g, ' ')} />
            <Field label="Reporter Contact"  value={ticket.reporterContact || '—'} />
            <Field label="Case Manager (PSSO)" value={ticket.caseManager || 'Unassigned'} />
            <Field label="Case Type"          value={ticket.isIncident ? 'Security Incident' : 'Vulnerability'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Field label="Actively Exploited" value={ticket.activelyExploited ? 'Yes' : 'No'} />
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

      {/* History */}
      {tab === 'history' && <StatusHistoryLog history={history} />}

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

      {/* Workflow — guided case tracker */}
      {tab === 'workflow' && (
        <WorkflowChecklist
          ticket={ticket}
          history={history}
          reports={reports}
          advisory={advisory}
          onChanged={load}
          gotoReports={() => setTab('reports')}
        />
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div>
          {showReportForm ? (
            <ReportForm
              ticket={ticket}
              onSaved={() => { setShowReportForm(false); load(); }}
              onCancel={() => setShowReportForm(false)}
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
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
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
