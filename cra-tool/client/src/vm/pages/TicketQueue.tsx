import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTickets, deleteTicket } from '../api/vmApi';
import StatusBadge, { ClassificationBadge } from '../components/StatusBadge';
import { computeDeadlines, timeRemaining } from '../utils/clockCalculations';
import { exportCsv } from '../../shared/exportCsv';
import { Row } from '../../components/primitives/layout';
import ConfirmDialog from '../../shared/ConfirmDialog';
import s from './TicketQueue.module.css';

export default function TicketQueue() {
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [deletingId, setDeletingId]        = useState<string | null>(null);

  useEffect(() => {
    getTickets()
      .then(r => setTickets(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function removeTicket() {
    if (!confirmDelete) return;
    const id = confirmDelete._id;
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      await deleteTicket(id);
      setTickets(prev => prev.filter((t: any) => t._id !== id));
    } catch {
      // leave the row in place if the delete failed
    } finally {
      setDeletingId(null);
    }
  }

  const visible      = filterStatus ? tickets.filter(t => t.status === filterStatus) : tickets;
  const openCount    = tickets.filter(t => t.status !== 'closed').length;
  const urgentCount  = tickets.filter(t => t.classification === 'actively_exploitable' && t.status !== 'closed').length;

  return (
    <div className={s.page}>
      <Row justify="between" align="center" style={{ marginBottom: 'var(--space-8)' }}>
        <div>
          <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Vulnerability Management</div>
          <h1 className={s.title}>Ticket Queue</h1>
        </div>
        <Row gap={2} wrap={false}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={visible.length === 0}
            onClick={() => exportCsv(`psirt-tickets-${new Date().toISOString().slice(0, 10)}`, visible.map(t => ({
              Ticket: t.ticketNumber,
              Status: t.status.replace(/_/g, ' '),
              'Case Type': t.isIncident ? 'incident' : 'vulnerability',
              'Affected Products': (t.affectedProducts || []).map(p => [p.name, p.version].filter(Boolean).join(' ')).join('; '),
              Source: t.sourceChannel,
              'Case Manager': t.caseManager || '',
              Classification: t.classification ? t.classification.replace(/_/g, ' ') : 'unclassified',
              CVSS: t.cvss?.score != null ? Number(t.cvss.score).toFixed(1) : '',
              'CRA Clock Started': t.clockStartedAt || '',
              Created: t.createdAt,
              Updated: t.updatedAt,
            })))}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={s.exportIcon}>
              <path d="M8 2v8m0 0 3-3M8 10 5 7M2.5 13.5h11" />
            </svg>
            Export CSV
          </button>
          <Link to="/vm/tickets/new" className="btn btn-primary">+ Log Vulnerability</Link>
        </Row>
      </Row>

      {/* Summary */}
      <Row gap={3} style={{ marginBottom: 'var(--space-8)' }}>
        <StatCard label="Open"           value={openCount} />
        <StatCard label="Active Exploit" value={urgentCount} color="#f87171" />
        <StatCard label="Total"          value={tickets.length} />
      </Row>

      {/* Filter */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <select className={`input ${s.filter}`} value={filterStatus} onChange={e => setFilter(e.target.value)}>
          <option value="">All stages</option>
          {[
            'receipt','validation','verification','remediation',
            'advisory','disclosure','reporting','closed',
          ].map(st => (
            <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={s.loading}>Loading…</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Affected Products</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Source</th>
              <th>CRA 24h Deadline</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(t => {
              const { initial } = computeDeadlines(t.clockStartedAt, t.mitigationDeployedAt, t.isIncident);
              const rem = timeRemaining(initial);
              return (
                <tr key={t._id} onClick={() => navigate(`/vm/tickets/${t._id}`)} className={s.rowClickable}>
                  <td>
                    <Link to={`/vm/tickets/${t._id}`} className={s.ticketLink}>{t.ticketNumber}</Link>
                  </td>
                  <td className={s.products}>
                    {t.affectedProducts?.length
                      ? t.affectedProducts.map(p => [p.name, p.version].filter(Boolean).join(' ')).join(', ')
                      : <span className={s.muted}>—</span>}
                  </td>
                  <td>
                    <Row gap={2}>
                      <StatusBadge status={t.status} pulse={t.classification === 'actively_exploitable' && t.status !== 'closed'} />
                      <ClassificationBadge classification={t.classification} />
                    </Row>
                  </td>
                  <td className={s.reporter}>
                    {t.reporterName || <span className={s.muted}>Anonymous</span>}
                  </td>
                  <td className={s.source}>{t.sourceChannel?.replace('_', ' ')}</td>
                  <td className={`${s.deadline} ${rem?.overdue ? s.overdue : rem ? s.active : ''}`}>
                    {rem ? rem.label : '—'}
                  </td>
                  <td className={s.created}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className={s.actionsCell}>
                    <button
                      className="btn btn-danger btn-xs"
                      disabled={deletingId === t._id}
                      title="Delete this case"
                      onClick={e => { e.stopPropagation(); setConfirmDelete(t); }}
                    >
                      {deletingId === t._id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className={s.empty}>
                  {filterStatus
                    ? 'No tickets with this status.'
                    : <>No tickets yet. <Link to="/vm/tickets/new">Log the first one →</Link></>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this case?"
        message={confirmDelete
          ? `${confirmDelete.ticketNumber} and everything attached to it — audit history, notifications, reports, advisories — will be permanently deleted. This cannot be undone.`
          : ''}
        confirmLabel="Delete Case"
        danger
        onConfirm={removeTicket}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <Row gap={4} className={`card ${s.statCard}`} style={{ ['--c' as any]: color }}>
      <div className={s.statValue}>{value}</div>
      <div className={s.statLabel}>{label}</div>
    </Row>
  );
}
