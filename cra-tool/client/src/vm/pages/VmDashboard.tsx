import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets, getAdvisories, getRecentActivity } from '../api/vmApi';
import StatusBadge, { ClassDot } from '../components/StatusBadge';
import { SEVERITY_COLOR } from '../components/CvssCalculator';
import { computeDeadlines, timeRemaining } from '../utils/clockCalculations';
import { PHASES, phaseOf } from '../utils/flowPhases';
import { stageLabel } from '../utils/lifecycleConfig';
import LifecycleJourney from '../components/LifecycleJourney';

export default function VmDashboard() {
  const [tickets, setTickets]       = useState<any[]>([]);
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [feed, setFeed]             = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([getTickets(), getAdvisories(), getRecentActivity(12)])
      .then(([t, a, f]) => { setTickets(t.data); setAdvisories(a.data); setFeed(f.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open = tickets.filter(t => t.status !== 'closed');

  // The two priority queues — classification is independent of stage
  const activeQueue      = open.filter(t => t.classification === 'actively_exploitable');
  const exploitableQueue = open.filter(t => t.classification === 'exploitable');
  const unclassified     = open.filter(t => !t.classification);

  const overdueTotal = activeQueue.reduce((n, t) => {
    if (!t.clockStartedAt) return n;
    const d = computeDeadlines(t.clockStartedAt, t.mitigationDeployedAt, t.isIncident);
    return n + [d.initial, d.detailed, d.final].filter(x => x && timeRemaining(x)?.overdue).length;
  }, 0);

  // Pipeline counts per lifecycle stage (open cases only)
  const pipeline = PHASES.filter(p => p.key !== 'closed').map(p => ({
    ...p,
    count: open.filter(t => phaseOf(t.status) === p.key).length,
  }));

  const recent = [...tickets]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5);

  if (loading) return <div style={{ padding: 40, color: 'var(--text-2)' }}>Loading…</div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Vulnerability Management</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>
            Decision-driven lifecycle per the VDMA CRA guideline &amp; CRA Art. 14.
          </p>
        </div>
        <Link to="/vm/tickets/new" className="btn btn-primary">+ Log Vulnerability</Link>
      </div>

      {/* Lifecycle journey — static process education */}
      <LifecycleJourney />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 28 }}>
        <Kpi label="Actively Exploitable" dot="actively_exploitable" value={activeQueue.length} color="#f87171" pulse={activeQueue.length > 0} />
        <Kpi label="Exploitable"          dot="exploitable" value={exploitableQueue.length} color="#f59e0b" />
        <Kpi label="Overdue Deadlines"    value={overdueTotal} color={overdueTotal > 0 ? '#f87171' : '#00e676'} />
        <Kpi label="Advisories"           value={advisories.length} color="#00c8c8" />
      </div>

      {/* ── Priority queues — Actively Exploitable always first ── */}
      <Queue
        title="Actively Exploitable"
        classification="actively_exploitable"
        subtitle="Confirmed active exploitation — highest priority, CRA Art. 14 timers running"
        color="#f87171"
        tickets={activeQueue}
        empty="No actively exploitable cases — no CRA reporting timers running."
        showClock
      />
      <Queue
        title="Exploitable"
        classification="exploitable"
        subtitle="Exploitable under practical conditions — open, normal remediation lifecycle"
        color="#f59e0b"
        tickets={exploitableQueue}
        empty="No open exploitable cases."
      />

      {/* Pipeline + intake */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Lifecycle Pipeline — open cases by stage</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {pipeline.map((p, i) => (
            <React.Fragment key={p.key}>
              {i > 0 && <div style={{ flex: 1, height: 2, background: 'var(--border)', minWidth: 8 }} />}
              <div style={{ textAlign: 'center', flex: '1 1 0', minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: p.count > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                  {p.count}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
                  {stageLabel(p.key)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        {unclassified.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12 }}>
            {unclassified.length} case{unclassified.length > 1 ? 's' : ''} not yet classified (pre–risk-assessment).
          </div>
        )}
      </div>

      {/* Recent activity + recent cases, side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>Recent Activity</div>
          <div className="card card-flat" style={{ padding: '6px 16px' }}>
            {feed.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)', padding: '10px 0' }}>No activity yet.</p>
            ) : feed.map((a, i) => (
              <Link key={a._id || i} to={`/vm/tickets/${a.ticketId}`}
                style={{ display: 'block', padding: '9px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: FEED_COLOR[a.type] || 'var(--text-3)', flexShrink: 0, alignSelf: 'center' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--accent)', fontWeight: 700 }}>{a.ticketNumber || '—'}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)' }}>{a.actorName}</span>
                  <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-3)', marginLeft: 'auto', whiteSpace: 'nowrap' }} title={new Date(a.createdAt).toLocaleString()}>
                    {timeAgo(a.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.action}{a.decision ? ` — ${a.decision}` : ''}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>Recent Cases</div>
          {recent.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
              No cases yet. <Link to="/vm/tickets/new">Log the first one →</Link>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map(t => (
                <Link key={t._id} to={`/vm/tickets/${t._id}`} className="card card-click" style={{ padding: '12px 16px', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{t.ticketNumber}</span>
                    <StatusBadge status={t.status} />
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-3)' }}>
                      {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title || t.description}
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

/* ── Recent-activity helpers ─────────────────────────────────── */
const FEED_COLOR: Record<string, string> = {
  created: '#60a5fa', transition: '#00c8c8', closure: '#00e676', moved_back: '#f59e0b',
  ownership: '#a78bfa', stage_data: '#a8a8c8', cert: '#f87171', report: '#f97316',
  advisory: '#00c8c8', comment: '#818cf8',
};

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)     return 'just now';
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ── Priority queue card ─────────────────────────────────────── */
function Queue({ title, classification, subtitle, color, tickets, empty, showClock }: any) {
  return (
    <div className="card card-flat" style={{ padding: '18px 22px', marginBottom: 16, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        <ClassDot classification={classification} size={9} />
        <span style={{ fontSize: 14, fontWeight: 800, color }}>{title}</span>
        <span className="mono" style={{ fontSize: 12, fontWeight: 700, color }}>{tickets.length}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: tickets.length ? 12 : 0 }}>{subtitle}</div>

      {tickets.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-3)', paddingTop: 8 }}>{empty}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tickets.map((t: any) => {
            const d   = showClock && t.clockStartedAt ? computeDeadlines(t.clockStartedAt, t.mitigationDeployedAt, t.isIncident) : null;
            const next = d ? [d.initial, d.detailed, d.final].filter(Boolean)
              .map(x => ({ due: x, rem: timeRemaining(x) }))
              .find(x => !x.rem?.overdue) : null;
            const overdue = d ? [d.initial, d.detailed, d.final].filter(x => x && timeRemaining(x)?.overdue).length : 0;
            const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000));
            return (
              <Link key={t._id} to={`/vm/tickets/${t._id}`}
                style={{ display: 'block', padding: '9px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{t.ticketNumber}</span>
                  <StatusBadge status={t.status} pulse={showClock} />
                  {t.cvss?.score != null && (
                    <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: SEVERITY_COLOR[t.cvss.severity] || 'var(--text-2)' }}>
                      CVSS {Number(t.cvss.score).toFixed(1)}
                    </span>
                  )}
                  <span style={{ flex: 1, minWidth: 120, fontSize: 11.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title || t.description}
                  </span>
                  {showClock && (
                    <span className="mono" style={{ fontSize: 10.5, color: overdue ? '#f87171' : 'var(--text-2)' }}>
                      {overdue ? `${overdue} OVERDUE` : next ? `next: ${next.rem?.label}` : ''}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontSize: 10.5, color: 'var(--text-3)' }}>
                  <span>Owner: <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{t.caseManager || 'Unassigned'}</span></span>
                  <span className="mono">{daysOpen}d open</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, color, pulse, dot }: any) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div className={pulse ? 'urgent-pulse' : undefined} style={{ fontSize: 28, fontWeight: 700, color: color || 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>
        {dot && <ClassDot classification={dot} size={7} />}
        {label}
      </div>
    </div>
  );
}
