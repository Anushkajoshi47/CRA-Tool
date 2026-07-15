import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTickets } from '../api/vmApi';
import StatusBadge, { ClassificationBadge } from '../components/StatusBadge';
import { computeDeadlines, timeRemaining } from '../utils/clockCalculations';
import { exportCsv } from '../../shared/exportCsv';


export default function TicketQueue() {
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState('');

  useEffect(() => {
    getTickets()
      .then(r => setTickets(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible      = filterStatus ? tickets.filter(t => t.status === filterStatus) : tickets;
  const openCount    = tickets.filter(t => t.status !== 'closed').length;
  const urgentCount  = tickets.filter(t => t.classification === 'actively_exploitable' && t.status !== 'closed').length;

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Vulnerability Management</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Ticket Queue</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5, verticalAlign: -1 }}>
              <path d="M8 2v8m0 0 3-3M8 10 5 7M2.5 13.5h11" />
            </svg>
            Export CSV
          </button>
          <Link to="/vm/tickets/new" className="btn btn-primary">+ Log Vulnerability</Link>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <StatCard label="Open"          value={openCount} />
        <StatCard label="Active Exploit" value={urgentCount} color="#f87171" />
        <StatCard label="Total"          value={tickets.length} />
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20 }}>
        <select
          className="input"
          style={{ width: 220, fontSize: 13 }}
          value={filterStatus}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="">All stages</option>
          {[
            'receipt','validation','verification','remediation',
            'advisory','disclosure','reporting','closed',
          ].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Loading…</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Affected Products</th>
              <th>Status</th>
              <th>Source</th>
              <th>CRA 24h Deadline</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(t => {
              const { initial } = computeDeadlines(t.clockStartedAt, t.mitigationDeployedAt, t.isIncident);
              const rem = timeRemaining(initial);
              return (
                <tr
                  key={t._id}
                  onClick={() => navigate(`/vm/tickets/${t._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <Link
                      to={`/vm/tickets/${t._id}`}
                      style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}
                    >
                      {t.ticketNumber}
                    </Link>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text)', maxWidth: 220 }}>
                    {t.affectedProducts?.length
                      ? t.affectedProducts.map(p => [p.name, p.version].filter(Boolean).join(' ')).join(', ')
                      : <span style={{ color: 'var(--text-3)' }}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <StatusBadge
                        status={t.status}
                        pulse={t.classification === 'actively_exploitable' && t.status !== 'closed'}
                      />
                      <ClassificationBadge classification={t.classification} />
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                    {t.sourceChannel?.replace('_', ' ')}
                  </td>
                  <td style={{
                    fontFamily: 'var(--mono)', fontSize: 12,
                    color: rem?.overdue ? '#f87171' : rem ? 'var(--text-2)' : 'var(--text-3)',
                  }}>
                    {rem ? rem.label : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                  {filterStatus
                    ? 'No tickets with this status.'
                    : <>No tickets yet. <Link to="/vm/tickets/new">Log the first one →</Link></>
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}
