import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets, getAdvisories } from '../api/vmApi';
import StatusBadge from '../components/StatusBadge';
import { computeDeadlines, timeRemaining } from '../utils/clockCalculations';
import { PHASES, phaseOf } from '../utils/flowPhases';

const TERMINAL = new Set(['closed', 'invalid', 'not_reproducible', 'not_exploitable', 'not_verified']);

export default function VmDashboard() {
  const [tickets, setTickets]       = useState([]);
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([getTickets(), getAdvisories()])
      .then(([t, a]) => { setTickets(t.data); setAdvisories(a.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open   = tickets.filter(t => !TERMINAL.has(t.status));
  const urgent = open.filter(t => t.activelyExploited);

  // Tickets with a running CRA clock, annotated with their most pressing deadline
  const clocked = open
    .filter(t => t.clockStartedAt)
    .map(t => {
      const d    = computeDeadlines(t.clockStartedAt, t.mitigationDeployedAt, t.isIncident);
      const next = [
        { label: '24h early warning', due: d.initial },
        { label: '72h notification',  due: d.detailed },
        { label: 'final report',      due: d.final },
      ].filter(x => x.due).sort((a, b) => new Date(a.due as any).getTime() - new Date(b.due as any).getTime());
      const soonest = next.find(x => !timeRemaining(x.due)?.overdue) || next[next.length - 1];
      return { ...t, soonest, overdueCount: next.filter(x => timeRemaining(x.due)?.overdue).length };
    })
    .sort((a, b) => new Date(a.soonest?.due || 0).getTime() - new Date(b.soonest?.due || 0).getTime());

  const overdueTotal = clocked.reduce((n, t) => n + t.overdueCount, 0);

  // Pipeline counts per VDMA phase (open tickets only)
  const pipeline = PHASES.slice(0, 6).map(p => ({
    ...p,
    count: open.filter(t => phaseOf(t.status) === p.key).length,
  }));

  const recent = [...tickets]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 6);

  if (loading) return <div style={{ padding: 40, color: 'var(--text-2)' }}>Loading…</div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Vulnerability Management</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>
            PSIRT process per VDMA CRA Vulnerability Handling Guideline &amp; CRA Art. 14.
          </p>
        </div>
        <Link to="/vm/tickets/new" className="btn btn-primary">+ Log Vulnerability</Link>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <Kpi label="Open Tickets"       value={open.length} />
        <Kpi label="Actively Exploited" value={urgent.length}    color="#f87171" pulse={urgent.length > 0} />
        <Kpi label="Overdue Deadlines"  value={overdueTotal}     color={overdueTotal > 0 ? '#f87171' : '#00e676'} />
        <Kpi label="Advisories"         value={advisories.length} color="#00c8c8" />
      </div>

      {/* Process pipeline */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Process Pipeline — open tickets by phase</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {pipeline.map((p, i) => (
            <React.Fragment key={p.key}>
              {i > 0 && <div style={{ width: 16, height: 2, background: 'var(--border)', flexShrink: 0 }} />}
              <div style={{ textAlign: 'center', flex: '1 1 0', minWidth: 0 }}>
                <div style={{
                  fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)',
                  color: p.count > 0 ? 'var(--accent)' : 'var(--text-3)',
                }}>
                  {p.count}
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                  {p.label}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
        {/* CRA clocks running */}
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>⚡ CRA Clocks Running</div>
          {clocked.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--text-3)' }}>No tickets under CRA Art. 14 reporting obligations.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clocked.map(t => {
                const rem = timeRemaining(t.soonest?.due);
                return (
                  <Link key={t._id} to={`/vm/tickets/${t._id}`} className="card card-click" style={{ padding: '12px 16px', display: 'block' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{t.ticketNumber}</span>
                      <StatusBadge status={t.status} pulse />
                    </div>
                    <div style={{ fontSize: 11.5, color: rem?.overdue ? '#f87171' : 'var(--text-2)', fontFamily: 'var(--mono)' }}>
                      {t.soonest ? `${t.soonest.label}: ${rem?.label}` : ''}
                      {t.overdueCount > 0 && ` · ${t.overdueCount} overdue`}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>Recent Tickets</div>
          {recent.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
              No tickets yet. <Link to="/vm/tickets/new">Log the first one →</Link>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map(t => (
                <Link key={t._id} to={`/vm/tickets/${t._id}`} className="card card-click" style={{ padding: '12px 16px', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{t.ticketNumber}</span>
                    <StatusBadge status={t.status} />
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-3)' }}>
                      {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, color, pulse }: any) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div className={pulse ? 'urgent-pulse' : undefined} style={{ fontSize: 28, fontWeight: 700, color: color || 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>
        {label}
      </div>
    </div>
  );
}
