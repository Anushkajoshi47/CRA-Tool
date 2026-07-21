import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets, getAdvisories, getRecentActivity } from '../api/vmApi';
import StatusBadge, { ClassDot } from '../components/StatusBadge';
import { SEVERITY_COLOR } from '../components/CvssCalculator';
import { computeDeadlines, timeRemaining } from '../utils/clockCalculations';
import { PHASES, phaseOf } from '../utils/flowPhases';
import { stageLabel } from '../utils/lifecycleConfig';
import LifecycleJourney from '../components/LifecycleJourney';
import { Stack, Row, Grid } from '../../components/primitives/layout';
import s from './VmDashboard.module.css';

// Styling: layout via Stack/Row/Grid primitives, appearance via the scoped
// VmDashboard.module.css, dynamic accents via the `--c` custom property.

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

  const activeQueue      = open.filter(t => t.classification === 'actively_exploitable');
  const exploitableQueue = open.filter(t => t.classification === 'exploitable');
  const unclassified     = open.filter(t => !t.classification);

  const overdueTotal = activeQueue.reduce((n, t) => {
    if (!t.clockStartedAt) return n;
    const d = computeDeadlines(t.clockStartedAt, t.mitigationDeployedAt, t.isIncident);
    return n + [d.initial, d.detailed, d.final].filter(x => x && timeRemaining(x)?.overdue).length;
  }, 0);

  const pipeline = PHASES.filter(p => p.key !== 'closed').map(p => ({
    ...p,
    count: open.filter(t => phaseOf(t.status) === p.key).length,
  }));

  const recent = [...tickets]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5);

  if (loading) return <div className={s.loading}>Loading…</div>;

  return (
    <Stack gap={0} className={s.page}>
      <Row justify="between" align="center" style={{ marginBottom: 'var(--space-8)' }}>
        <div>
          <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Vulnerability Management</div>
          <h1 className={s.headerTitle}>Dashboard</h1>
          <p className={s.headerSub}>Decision-driven lifecycle per the VDMA CRA guideline &amp; CRA Art. 14.</p>
        </div>
        <Link to="/vm/tickets/new" className="btn btn-primary">+ Log Vulnerability</Link>
      </Row>

      {/* Lifecycle journey — static process education */}
      <LifecycleJourney />

      {/* KPI cards */}
      <Grid min="170px" gap={3} className={s.kpiGrid}>
        <Kpi label="Actively Exploitable" dot="actively_exploitable" value={activeQueue.length} color="#f87171" pulse={activeQueue.length > 0} />
        <Kpi label="Exploitable"          dot="exploitable" value={exploitableQueue.length} color="#f59e0b" />
        <Kpi label="Overdue Deadlines"    value={overdueTotal} color={overdueTotal > 0 ? '#f87171' : '#00e676'} />
        <Kpi label="Advisories"           value={advisories.length} color="#00c8c8" />
      </Grid>

      {/* Priority queues — Actively Exploitable always first */}
      <Queue
        title="Actively Exploitable" classification="actively_exploitable"
        subtitle="Confirmed active exploitation — highest priority, CRA Art. 14 timers running"
        color="#f87171" tickets={activeQueue} showClock
        empty="No actively exploitable cases — no CRA reporting timers running."
      />
      <Queue
        title="Exploitable" classification="exploitable"
        subtitle="Exploitable under practical conditions — open, normal remediation lifecycle"
        color="#f59e0b" tickets={exploitableQueue}
        empty="No open exploitable cases."
      />

      {/* Pipeline */}
      <div className={`card ${s.pipelineCard}`}>
        <div className="section-label" style={{ marginBottom: 'var(--space-4)' }}>Lifecycle Pipeline — open cases by stage</div>
        <div className={s.pipelineTrack}>
          {pipeline.map((p, i) => (
            <React.Fragment key={p.key}>
              {i > 0 && <div className={s.pipelineConnector} />}
              <div className={s.pipelineCol}>
                <div className={s.pipelineCount} data-has={p.count > 0 ? 1 : 0}>{p.count}</div>
                <div className={s.pipelineLabel}>{stageLabel(p.key)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        {unclassified.length > 0 && (
          <div className={s.pipelineNote}>
            {unclassified.length} case{unclassified.length > 1 ? 's' : ''} not yet classified (pre–risk-assessment).
          </div>
        )}
      </div>

      {/* Recent activity + recent cases */}
      <Grid min="340px" gap={4} className={s.columns}>
        <div>
          <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Recent Activity</div>
          <div className={`card card-flat ${s.feedCard}`}>
            {feed.length === 0 ? (
              <p className={s.feedEmpty}>No activity yet.</p>
            ) : feed.map((a, i) => (
              <Link key={a._id || i} to={`/vm/tickets/${a.ticketId}`} className={s.feedRow}>
                <Row gap={2} align="baseline">
                  <span className={s.feedDot} style={{ ['--c' as any]: FEED_COLOR[a.type], alignSelf: 'center' }} />
                  <span className={s.feedTicket}>{a.ticketNumber || '—'}</span>
                  <span className={s.feedActor}>{a.actorName}</span>
                  <span className={`mono ${s.feedTime}`} title={new Date(a.createdAt).toLocaleString()}>{timeAgo(a.createdAt)}</span>
                </Row>
                <div className={s.feedAction}>{a.action}{a.decision ? ` — ${a.decision}` : ''}</div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Recent Cases</div>
          {recent.length === 0 ? (
            <p className={s.recentEmpty}>No cases yet. <Link to="/vm/tickets/new">Log the first one →</Link></p>
          ) : (
            <Stack gap={3}>
              {recent.map(t => (
                <Link key={t._id} to={`/vm/tickets/${t._id}`} className={`card card-click ${s.recentCard}`}>
                  <Row gap={3}>
                    <span className={s.recentNo}>{t.ticketNumber}</span>
                    <StatusBadge status={t.status} />
                    <span className={s.recentDate}>{new Date(t.updatedAt || t.createdAt).toLocaleDateString()}</span>
                  </Row>
                  <div className={s.recentDesc}>{t.title || t.description}</div>
                </Link>
              ))}
            </Stack>
          )}
        </div>
      </Grid>
    </Stack>
  );
}

/* ── Recent-activity helpers ─────────────────────────────────── */
const FEED_COLOR: Record<string, string> = {
  created: '#60a5fa', transition: '#00c8c8', closure: '#00e676', moved_back: '#f59e0b',
  ownership: '#a78bfa', stage_data: '#a8a8c8', cert: '#f87171', report: '#f97316',
  advisory: '#00c8c8', comment: '#818cf8',
};

function timeAgo(iso: string) {
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60)     return 'just now';
  if (sec < 3600)   return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)  return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ── Priority queue card ─────────────────────────────────────── */
function Queue({ title, classification, subtitle, color, tickets, empty, showClock }: any) {
  return (
    <div className={`card card-flat ${s.queueCard}`} style={{ ['--c' as any]: color }}>
      <Row gap={2}>
        <ClassDot classification={classification} size={9} />
        <span className={s.queueTitle}>{title}</span>
        <span className={`mono ${s.queueCount}`}>{tickets.length}</span>
      </Row>
      <div className={`${s.queueSub} ${tickets.length ? '' : s.queueSubTight}`}>{subtitle}</div>

      {tickets.length === 0 ? (
        <div className={s.queueEmpty}>{empty}</div>
      ) : (
        <Stack gap={0}>
          {tickets.map((t: any) => {
            const d = showClock && t.clockStartedAt ? computeDeadlines(t.clockStartedAt, t.mitigationDeployedAt, t.isIncident) : null;
            const next = d ? [d.initial, d.detailed, d.final].filter(Boolean)
              .map(x => ({ due: x, rem: timeRemaining(x) }))
              .find(x => !x.rem?.overdue) : null;
            const overdue = d ? [d.initial, d.detailed, d.final].filter(x => x && timeRemaining(x)?.overdue).length : 0;
            const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000));
            return (
              <Link key={t._id} to={`/vm/tickets/${t._id}`} className={s.queueRow}>
                <Row gap={3}>
                  <span className={s.qTicket}>{t.ticketNumber}</span>
                  <StatusBadge status={t.status} pulse={showClock} />
                  {t.cvss?.score != null && (
                    <span className={`mono ${s.qCvss}`} style={{ ['--c' as any]: SEVERITY_COLOR[t.cvss.severity] }}>
                      CVSS {Number(t.cvss.score).toFixed(1)}
                    </span>
                  )}
                  <span className={s.qDesc}>{t.title || t.description}</span>
                  {showClock && (
                    <span className={`mono ${s.qClock} ${overdue ? s.qClockOverdue : ''}`}>
                      {overdue ? `${overdue} OVERDUE` : next ? `next: ${next.rem?.label}` : ''}
                    </span>
                  )}
                </Row>
                <Row gap={4} className={s.qMeta}>
                  <span>Owner: <span className={s.qOwner}>{t.caseManager || 'Unassigned'}</span></span>
                  <span className="mono">{daysOpen}d open</span>
                </Row>
              </Link>
            );
          })}
        </Stack>
      )}
    </div>
  );
}

function Kpi({ label, value, color, pulse, dot }: any) {
  return (
    <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
      <div className={pulse ? 'urgent-pulse' : undefined} style={{ ['--c' as any]: color }}>
        <span className={s.kpiValue}>{value}</span>
      </div>
      <Row gap={2} className={s.kpiLabel}>
        {dot && <ClassDot classification={dot} size={7} />}
        {label}
      </Row>
    </div>
  );
}
