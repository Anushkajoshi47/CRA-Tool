import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

/* ── Constants ──────────────────────────────────────────────── */
const REPORT_DL  = new Date('2026-09-11');
const ENFORCE_DL = new Date('2027-12-11');
const daysUntil  = (d: Date) => Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));

const STATUS_CFG = {
  not_started:  { label: 'Pending',      color: '#6e6e8a', Icon: PendingIcon },
  in_progress:  { label: 'In Progress',  color: '#f59e0b', Icon: ProgressIcon },
  done:         { label: 'Completed',    color: '#00e676', Icon: DoneIcon },
  needs_review: { label: 'Needs Review', color: '#f97316', Icon: ReviewIcon },
};

function scoreHex(pct) {
  if (pct >= 70) return '#00e676';
  if (pct >= 30) return '#f59e0b';
  return '#f87171';
}

/* ── Animated SVG ring ──────────────────────────────────────── */
function ScoreRing({ score, loading, size = 140 }) {
  const [drawn, setDrawn] = useState(false);
  const R = 52, circ = 2 * Math.PI * R;
  const color = scoreHex(score);
  const offset = drawn ? circ * (1 - score / 100) : circ;

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setDrawn(true), 120);
    return () => clearTimeout(t);
  }, [loading, score]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: 'visible' }}>
        {/* Outer ring decoration */}
        <circle cx="60" cy="60" r="58" fill="none" stroke={color} strokeWidth="0.5" opacity="0.1" />
        {/* Track */}
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
        {/* Tick marks */}
        {[0, 90, 180, 270].map(deg => {
          const a = (deg - 90) * Math.PI / 180;
          return <line key={deg}
            x1={60 + (R - 8) * Math.cos(a)} y1={60 + (R - 8) * Math.sin(a)}
            x2={60 + (R + 8) * Math.cos(a)} y2={60 + (R + 8) * Math.sin(a)}
            stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeLinecap="round" />;
        })}
        {/* Fill arc */}
        {!loading && (
          <circle cx="60" cy="60" r={R} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{
              transform: 'rotate(-90deg)', transformOrigin: '60px 60px',
              transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)',
              filter: `drop-shadow(0 0 10px ${color}66)`,
            }} />
        )}
        {loading && (
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"
            strokeDasharray="20 10" style={{ animation: 'urgentPulse 1.5s ease infinite', transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }} />
        )}
        {/* Score text */}
        {!loading && (
          <>
            <text x="60" y="55" textAnchor="middle" fill={color}
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '20px', fontWeight: 700, letterSpacing: '-1px' }}>
              {score}%
            </text>
            <text x="60" y="70" textAnchor="middle" fill="#3a3a52"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '7px', fontWeight: 700, letterSpacing: '1.5px' }}>
              AVG COMPLIANCE
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ── Mini ring for table rows ───────────────────────────────── */
function MiniRing({ score, hex }) {
  const [drawn, setDrawn] = useState(false);
  const r = 10, circ = 2 * Math.PI * r;
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 200); return () => clearTimeout(t); }, []);
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3.5" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={hex} strokeWidth="3.5"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={drawn ? circ * (1 - score / 100) : circ}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '14px 14px', transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${hex}55)` }} />
    </svg>
  );
}

/* ── Compliance journey stepper ─────────────────────────────── */
function ComplianceJourney({ products, items }) {
  const all: any[] = Object.values(items).flat();
  const hasProds = products.length > 0;
  const hasItems = all.length > 0;
  const hasEvid  = all.some(i => i.notes?.trim());
  const done     = all.filter(i => i.status === 'done').length;
  const total    = all.length;
  const reviewing = total > 0 && done >= total * 0.5;
  const complete  = total > 0 && done === total;

  const stages = [
    { label: 'Product\nRegistration', done: hasProds },
    { label: 'CRA\nRequirements',     done: hasItems },
    { label: 'Evidence\nUpload',      done: hasEvid },
    { label: 'Review',                done: reviewing },
    { label: 'Compliance\nReport',    done: complete },
  ];
  const completedCount = stages.filter(s => s.done).length;

  return (
    <div className="card card-flat" style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: '2px' }}>
            Compliance Journey
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>
            {completedCount} of {stages.length} stages complete
          </div>
        </div>
        <div style={{
          background: completedCount === stages.length ? 'var(--success-dim)' : 'var(--accent-dim)',
          border: `1px solid ${completedCount === stages.length ? 'rgba(0,230,118,0.2)' : 'rgba(0,200,200,0.15)'}`,
          borderRadius: '20px', padding: '3px 12px',
          fontSize: '11px', fontWeight: 700,
          color: completedCount === stages.length ? 'var(--success)' : 'var(--accent)',
          fontFamily: 'var(--mono)',
        }}>
          {Math.round((completedCount / stages.length) * 100)}%
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {stages.map((stage, i) => {
          const isActive = !stage.done && (i === 0 || stages[i - 1].done);
          // nodeColor unused — styling via borderCol/nodeBg/textColor below
          const borderCol  = stage.done ? '#00e676' : isActive ? '#00c8c8' : '#2c2c40';
          const nodeBg     = stage.done ? 'rgba(0,230,118,0.12)' : isActive ? 'rgba(0,200,200,0.1)' : 'rgba(30,30,46,0.8)';
          const textColor  = stage.done ? '#00e676' : isActive ? '#00c8c8' : 'var(--text-3)';

          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '76px' }}>
                <div className={isActive ? 'journey-node-active' : ''}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: nodeBg, border: `2px solid ${borderCol}`, transition: 'all 300ms ease', position: 'relative', zIndex: 2 }}>
                  {stage.done ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#00e676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 7.5l3 3 6-6" />
                    </svg>
                  ) : isActive ? (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00c8c8' }} />
                  ) : (
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--border-hi)' }} />
                  )}
                </div>
                <div style={{ fontSize: '8.5px', fontWeight: 700, color: textColor, textAlign: 'center', marginTop: '10px', lineHeight: 1.4, whiteSpace: 'pre-line', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 300ms' }}>
                  {stage.label}
                </div>
                <div className="mono" style={{ fontSize: '8px', color: 'var(--text-3)', marginTop: '3px' }}>
                  0{i + 1}
                </div>
              </div>
              {i < stages.length - 1 && (
                <div style={{ flex: 1, height: '2px', marginBottom: '30px', background: stage.done ? 'linear-gradient(90deg, #00e676, rgba(0,230,118,0.3))' : 'var(--border)', borderRadius: '1px', transition: 'background 400ms ease' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ── Recent activity timeline ───────────────────────────────── */
const ACTIVITY_COLOR = {
  'Registered product':        '#60a5fa',
  'Edited product details':    '#a78bfa',
  'Deleted product':           '#f87171',
  'Updated compliance status': '#00e676',
};

function activityTimeAgo(date) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

// Team-wide audit feed: shows WHO changed what across the shared product
// registry. Timestamps render in each viewer's local timezone.
function RecentActivity() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/products/activity/feed?limit=8')
      .then(res => setFeed(res.data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="card card-flat" style={{ padding: '24px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Recent Activity</div>
      <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '20px' }}>Who changed what across the team</div>

      {loaded && feed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)', fontSize: '12px' }}>
          No activity yet. Register a product or update requirement statuses.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {feed.map((a, idx) => {
            const color = ACTIVITY_COLOR[a.action] || '#6e6e8a';
            return (
              <div key={a._id || idx} style={{ display: 'flex', gap: '12px', paddingTop: idx === 0 ? '0' : '14px', paddingBottom: '14px', borderBottom: idx < feed.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '2px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}66`, flexShrink: 0 }} />
                  {idx < feed.length - 1 && <div style={{ width: '1px', flex: 1, background: 'var(--border)', marginTop: '6px', minHeight: '24px' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{a.actorName || 'System'}</span>
                    {a.actorOrg && <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>· {a.actorOrg}</span>}
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-3)', marginLeft: 'auto', whiteSpace: 'nowrap' }} title={new Date(a.createdAt).toLocaleString()}>
                      {activityTimeAgo(a.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text)' }}>
                    {a.action}
                    {a.productName && <span style={{ color: 'var(--text-2)' }}> · {a.productName}</span>}
                  </div>
                  {a.detail && (
                    <div style={{ fontSize: '10.5px', color: 'var(--text-2)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Deadline card ──────────────────────────────────────────── */
function DeadlineCard({ label, article, date, days, urgent }) {
  const color = urgent ? 'var(--warning)' : 'var(--accent)';
  const hex   = urgent ? '#f97316' : '#00c8c8';
  const borderClass = urgent ? 'card-warning' : 'card-accent';
  return (
    <div className={`card card-flat ${borderClass}`} style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${hex}88` }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {urgent ? 'Urgent' : 'Scheduled'}
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', lineHeight: 1.3 }}>{label}</div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '2px' }}>{article}</div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>{date}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className={`mono${urgent ? ' urgent-pulse' : ''}`}
            style={{ fontSize: '48px', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-2px', filter: `drop-shadow(0 0 12px ${hex}44)` }}>
            {days}
          </div>
          <div className="mono" style={{ fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.15em', marginTop: '3px' }}>DAYS</div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────── */
function StatCard({ label, value, sub, loading, icon, color = 'var(--accent)' }: any) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        {sub !== undefined && !loading && (
          <span style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 600, fontFamily: 'var(--mono)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>{sub}</span>
        )}
      </div>
      {loading
        ? <div className="skeleton" style={{ height: '42px', width: '55%', borderRadius: '6px' }} />
        : <div className="mono" style={{ fontSize: '40px', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-1.5px' }}>{value}</div>
      }
      <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '8px', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* ── Quick actions ──────────────────────────────────────────── */
function QuickActions({ navigate }) {
  const actions = [
    { label: 'Add New Product',     desc: 'Register a GH180 variant',     color: 'var(--accent)', icon: <PlusIcon />,    onClick: () => navigate('/product/new') },
    { label: 'View Requirements',   desc: 'Browse all 31 CRA articles',    color: '#3b82f6',       icon: <ListAltIcon />, onClick: () => navigate('/requirements') },
    { label: 'Open Compliance',     desc: 'Update requirement statuses',   color: 'var(--success)',icon: <ShieldCheckIcon />, onClick: () => navigate('/compliance') },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
      {actions.map(a => (
        <button key={a.label} onClick={a.onClick} className="card card-click"
          style={{ padding: '20px', textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', width: '100%' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: a.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, marginBottom: '12px' }}>
            {a.icon}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>{a.label}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>{a.desc}</div>
        </button>
      ))}
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────────────────── */
export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems]       = useState<any>({});
  const [loading, setLoading]   = useState(true);
  const navigate                = useNavigate();
  const reportD                 = daysUntil(REPORT_DL);
  const enforceD                = daysUntil(ENFORCE_DL);

  useEffect(() => {
    api.get('/requirements/summary/all').then(res => {
      setProducts(res.data.products);
      setItems(res.data.itemsByProduct);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function productScore(pid) {
    const it = items[pid] || [];
    return it.length ? Math.round((it.filter(i => i.status === 'done').length / it.length) * 100) : 0;
  }

  const all: any[]  = Object.values(items).flat();
  const totalReqs = all.length;
  const totalDone = all.filter(i => i.status === 'done').length;
  const totalIP   = all.filter(i => i.status === 'in_progress').length;
  const totalNR   = all.filter(i => i.status === 'needs_review').length;
  const avgScore  = products.length ? Math.round(products.reduce((s, p) => s + productScore(p._id), 0) / products.length) : 0;
  const email     = localStorage.getItem('email') || '';
  const name      = email ? email.split('@')[0] : 'User';

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Executive Overview
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Good morning, <span style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{name}</span>
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>
            Innomotics Perfect Harmony GH180 — CRA Compliance Dashboard
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/requirements')}>Requirements</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/product/new')}>+ Add Product</button>
        </div>
      </div>

      {/* 4 Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Products Tracked" value={products.length}
          icon={<BoxIcon16 color="var(--accent)" />} color="var(--accent)" loading={loading} />
        <StatCard label="Requirements Done" value={totalDone}
          sub={`of ${totalReqs}`}
          icon={<CheckIcon16 color="var(--success)" />} color="var(--success)" loading={loading} />
        <StatCard label="In Progress" value={totalIP}
          icon={<ClockIcon color="var(--amber)" />} color="var(--amber)" loading={loading} />
        <StatCard label="Needs Review" value={totalNR}
          icon={<WarningIcon color="var(--warning)" />} color="var(--warning)" loading={loading} />
      </div>

      {/* Score ring + Journey */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="card card-flat" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '180px' }}>
          <ScoreRing score={avgScore} loading={loading} size={140} />
          {!loading && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 500 }}>
                {products.length} {products.length === 1 ? 'product' : 'products'} tracked
              </div>
            </div>
          )}
        </div>
        {loading
          ? <div className="skeleton" style={{ borderRadius: 'var(--radius)', minHeight: '180px' }} />
          : <ComplianceJourney products={products} items={items} />
        }
      </div>

      {/* Activity + Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '12px', marginBottom: '20px' }}>
        {loading
          ? <div className="skeleton" style={{ borderRadius: 'var(--radius)', minHeight: '280px' }} />
          : <RecentActivity />
        }
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DeadlineCard label="Vulnerability Reporting" article="Article 14 — CRA" date="11 September 2026" days={reportD}  urgent={reportD < 180} />
          <DeadlineCard label="Full CRA Enforcement"    article="Annex I — All Requirements" date="11 December 2027"  days={enforceD} urgent={enforceD < 180} />
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '20px' }}>
        <div className="section-label" style={{ marginBottom: '12px' }}>Quick Actions</div>
        <QuickActions navigate={navigate} />
      </div>

      {/* Products table */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div className="section-label">Products</div>
          <span className="mono" style={{ fontSize: '10px', color: 'var(--text-3)' }}>{products.length} registered</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '64px', borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState onClick={() => navigate('/product/new')} />
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Model</th>
                  <th>Class</th>
                  <th>Score</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const score = productScore(p._id);
                  const hex   = scoreHex(score);
                  const its   = items[p._id] || [];
                  const ip    = its.filter(i => i.status === 'in_progress').length;
                  const status = score === 100 ? 'done' : ip > 0 ? 'in_progress' : score > 0 ? 'in_progress' : 'not_started';
                  const scfg  = STATUS_CFG[status] || STATUS_CFG.not_started;
                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
                        <div className="mono" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-2)', marginTop: '2px' }}>{p.firmwareVersion || '—'}</div>
                      </td>
                      <td className="mono" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text)' }}>{p.modelNumber || '—'}</td>
                      <td>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '10.5px', fontWeight: 800, color: p.craClass === 'Important' ? 'var(--amber)' : p.craClass === 'Critical' ? 'var(--red)' : 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {p.craClass || 'Default'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <MiniRing score={score} hex={hex} />
                          <span className="mono" style={{ fontSize: '16px', fontWeight: 800, color: hex, lineHeight: 1 }}>{score}%</span>
                        </div>
                      </td>
                      <td style={{ width: '120px', paddingRight: '16px' }}>
                        <div className="pbar-track" style={{ height: '6px' }}>
                          <div className="pbar-fill" style={{ width: `${score}%`, background: hex, boxShadow: `0 0 6px ${hex}55` }} />
                        </div>
                      </td>
                      <td>
                        <span className={`pill pill-${status === 'not_started' ? 'pending' : status === 'done' ? 'completed' : 'in-progress'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                          <scfg.Icon size={9} />
                          {scfg.label}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/compliance/${p._id}`)}>Open</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────── */
function EmptyState({ onClick }) {
  return (
    <div className="card" style={{ padding: '56px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '1px dashed rgba(0,200,200,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '20px', height: '20px', background: 'rgba(0,200,200,0.1)', borderRadius: '6px' }} />
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>No products yet</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Add a product to begin CRA compliance tracking.</div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={onClick}>Add First Product</button>
    </div>
  );
}

/* ── Status icons ───────────────────────────────────────────── */
function PendingIcon({ size = 10 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.2 1.4"/></svg>;
}
function ProgressIcon({ size = 10 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
}
function DoneIcon({ size = 10 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 6l2 2 3-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ReviewIcon({ size = 10 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none"><path d="M6 1.5L10.5 9.5H1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M6 5.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="6" cy="8.8" r=".55" fill="currentColor"/></svg>;
}

/* ── UI Icons ───────────────────────────────────────────────── */
function BoxIcon16({ color }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5.5L8 2.5l6 3v5L8 13.5 2 10.5V5.5z"/><path d="M8 2.5v11M2 5.5l6 3 6-3"/></svg>;
}
function CheckIcon16({ color }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M5 8l2.5 2.5 4-5"/></svg>;
}
function ClockIcon({ color }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
}
function WarningIcon({ color }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2L14.5 13H1.5z"/><path d="M8 6v4"/><circle cx="8" cy="11.5" r=".6" fill={color}/></svg>;
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 2.5v9M2.5 7h9"/></svg>;
}
function ListAltIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M5 3.5h7M5 7h7M5 10.5h7M2 3.5h.01M2 7h.01M2 10.5h.01"/></svg>;
}
function ShieldCheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1.5L12.5 4v4c0 3-2.5 5-5.5 5.5-3-.5-5.5-2.5-5.5-5.5V4z"/><path d="M4.5 7.5l2 2 3.5-4"/></svg>;
}
