import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

/* ─── Constants ──────────────────────────────────────────────── */
const PILLAR_COLOR = {
  'Security Properties':    '#00c8c8',
  'Vulnerability Handling': '#f59e0b',
  'Incident Reporting':     '#f87171',
  'Documentation':          '#00e676',
};
const PILLARS = ['Security Properties', 'Vulnerability Handling', 'Incident Reporting', 'Documentation'];
const STATUS_ORDER = ['not_started', 'in_progress', 'done', 'needs_review'];
const STATUS_CFG = {
  not_started:  { label: 'Pending',      color: '#4a4a6a', glow: 'none' },
  in_progress:  { label: 'In Progress',  color: '#f59e0b', glow: '0 0 10px #f59e0b66' },
  done:         { label: 'Completed',    color: '#00e676', glow: '0 0 10px #00e67666' },
  needs_review: { label: 'Needs Review', color: '#f97316', glow: '0 0 10px #f9731666' },
};

/* ─── Animated status icon (clickable) ───────────────────────── */
function StatusIcon({ status, onClick, spinning }) {
  const { color, glow } = STATUS_CFG[status] || STATUS_CFG.not_started;
  const size = 26;

  return (
    <div onClick={e => { e.stopPropagation(); onClick(); }}
      title="Click to change status"
      style={{ width: size, height: size, flexShrink: 0, cursor: 'pointer',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 150ms', position: 'relative' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.18)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg width={size} height={size} viewBox="0 0 26 26" fill="none"
        style={{ filter: status !== 'not_started' ? `drop-shadow(${glow})` : 'none' }}>

        {/* Track ring */}
        <circle cx="13" cy="13" r="11" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

        {status === 'not_started' && (
          <circle cx="13" cy="13" r="11" stroke={color} strokeWidth="2"
            strokeDasharray="4 3" strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '13px 13px' }} />
        )}

        {status === 'in_progress' && (
          <>
            <circle cx="13" cy="13" r="11" stroke={color} strokeWidth="2.5"
              strokeDasharray="43 26" strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '13px 13px',
                animation: spinning ? 'spin 1s linear infinite' : 'none' }} />
            <circle cx="13" cy="13" r="5" fill={color} opacity="0.25" />
          </>
        )}

        {status === 'done' && (
          <>
            <circle cx="13" cy="13" r="11" fill={color} opacity="0.15" />
            <circle cx="13" cy="13" r="11" stroke={color} strokeWidth="2" />
            <path d="M8.5 13.5l3 3 6-6" stroke={color} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {status === 'needs_review' && (
          <>
            <circle cx="13" cy="13" r="11" fill={color} opacity="0.12" />
            <circle cx="13" cy="13" r="11" stroke={color} strokeWidth="2" />
            <path d="M13 8.5v5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="13" cy="16.5" r="1.2" fill={color} />
          </>
        )}
      </svg>
    </div>
  );
}

/* ─── Score ring ─────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const [drawn, setDrawn] = useState(false);
  const r = 38, circ = 2 * Math.PI * r;
  const hex = score >= 70 ? '#00e676' : score >= 30 ? '#f59e0b' : '#f87171';
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 150); return () => clearTimeout(t); }, [score]);
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={hex} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={drawn ? circ * (1 - score / 100) : circ}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '48px 48px',
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)',
            filter: `drop-shadow(0 0 10px ${hex}55)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '20px', fontWeight: 700, color: hex, lineHeight: 1 }}>
          {score}%
        </span>
        <span style={{ fontSize: '9px', color: 'var(--text-2)', marginTop: '3px',
          letterSpacing: '0.12em', textTransform: 'uppercase' }}>score</span>
      </div>
    </div>
  );
}

/* ─── Single requirement row ─────────────────────────────────── */
function RequirementRow({ item, index, onOpenPanel, onStatusCycle }) {
  const [hovered, setHovered]   = useState(false);
  const [spinning, setSpinning] = useState(false);
  const pillarColor = PILLAR_COLOR[item.pillar] || '#6e6e8a';
  const statusCfg   = STATUS_CFG[item.status] || STATUS_CFG.not_started;

  function handleCycle() {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
    onStatusCycle(item);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '0 20px', height: '58px',
        background: hovered ? 'rgba(255,255,255,0.022)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 120ms',
        position: 'relative',
      }}
    >
      {/* Pillar accent bar — far left */}
      <div style={{
        position: 'absolute', left: 0, top: '12px', bottom: '12px',
        width: '3px', borderRadius: '0 2px 2px 0',
        background: pillarColor,
        opacity: hovered ? 1 : 0.35,
        transition: 'opacity 150ms',
      }} />

      {/* Clickable status icon */}
      <StatusIcon status={item.status} onClick={handleCycle} spinning={spinning} />

      {/* Index */}
      <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)',
        width: '22px', textAlign: 'right', flexShrink: 0, userSelect: 'none' }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Article ref */}
      <span style={{
        fontFamily: 'var(--mono)', fontSize: '9.5px', fontWeight: 700,
        color: pillarColor, background: pillarColor + '14',
        padding: '2px 9px', borderRadius: '4px', flexShrink: 0,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        border: `1px solid ${pillarColor}22`,
        transition: 'background 150ms',
        ...(hovered ? { background: pillarColor + '24' } : {}),
      }}>
        {item.articleRef}
      </span>

      {/* Title — main content */}
      <span
        onClick={() => onOpenPanel(item)}
        style={{
          flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--text)',
          lineHeight: 1.35, cursor: 'pointer',
          transition: 'color 120ms',
          ...(hovered ? { color: '#fff' } : {}),
        }}
      >
        {item.title}
      </span>

      {/* Right-side: chips + status label (visible on hover) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {item.evidenceRequired?.length > 0 && (
          <span style={{
            fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text-3)',
            border: '1px solid var(--border)', padding: '2px 7px', borderRadius: '4px',
            letterSpacing: '0.07em', userSelect: 'none',
          }}>EVIDENCE</span>
        )}
        {item.urgent && (
          <span style={{
            fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 700,
            color: 'var(--warning)', background: 'var(--warning-dim)',
            border: '1px solid rgba(249,115,22,0.25)',
            padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.07em',
          }}>URGENT</span>
        )}

        {/* Status label — slides in on hover */}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600,
          color: statusCfg.color,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(6px)',
          transition: 'opacity 150ms, transform 150ms',
          minWidth: '80px', textAlign: 'right',
          userSelect: 'none',
        }}>
          {statusCfg.label}
        </span>

        {/* Open details arrow */}
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
          onClick={() => onOpenPanel(item)}
          style={{
            cursor: 'pointer', flexShrink: 0,
            stroke: hovered ? 'var(--text-2)' : 'transparent',
            transition: 'stroke 150ms',
          }}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5.5 3l4.5 4.5-4.5 4.5" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function Compliance() {
  const { productId } = useParams();
  const navigate      = useNavigate();

  const [product, setProduct]   = useState(null);
  const [items, setItems]       = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [pillar, setPillar]     = useState('All');
  const [panel, setPanel]       = useState(null);
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const load = useCallback(async (pid) => {
    setLoading(true);
    try {
      const [pr, reqsRes, statusRes] = await Promise.all([
        api.get(`/products/${pid}`),
        api.get('/requirements'),
        api.get(`/requirements/${pid}`),
      ]);
      setProduct(pr.data);

      const reqs   = reqsRes.data;
      const status = statusRes.data;

      const statusMap = {};
      status.forEach(s => {
        const key = s.reqId?.toString()
          || s.requirementId?._id?.toString()
          || s.requirementId?.toString();
        if (key) statusMap[key] = s;
      });

      const merged = reqs.map(r => {
        const s = statusMap[r._id.toString()] || {};
        return {
          reqId: r._id, title: r.title, articleRef: r.articleRef,
          pillar: r.pillar, plainEnglish: r.plainEnglish, legalText: r.legalText,
          urgent: r.urgent, evidenceRequired: r.evidenceRequired, sortOrder: r.sortOrder,
          itemId: s.itemId || s._id,
          status: s.status || 'not_started',
          notes:  s.notes  || '',
          updatedAt: s.updatedAt,
        };
      });

      setItems(merged);
    } catch (err) {
      console.error('load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (productId) load(productId);
    else setLoading(false);
  }, [productId, load]);

  const done  = items.filter(i => i.status === 'done').length;
  const score = items.length ? Math.round(done / items.length * 100) : 0;

  const allPillars = ['All', ...PILLARS];
  const filtered   = pillar === 'All' ? items : items.filter(i => i.pillar === pillar);

  function openPanel(item) { setPanel(item); setNotes(item.notes || ''); }

  /* Inline status cycle (no panel needed) */
  async function cycleStatus(item) {
    if (!item.itemId) return;
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(item.status) + 1) % STATUS_ORDER.length];
    // Optimistic update
    setItems(prev => prev.map(i => i.itemId?.toString() === item.itemId?.toString()
      ? { ...i, status: next } : i));
    if (panel?.itemId?.toString() === item.itemId?.toString())
      setPanel(p => ({ ...p, status: next }));
    try {
      await api.patch(`/requirements/item/${item.itemId}`, { status: next });
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => i.itemId?.toString() === item.itemId?.toString()
        ? { ...i, status: item.status } : i));
    }
  }

  async function savePanel(newStatus) {
    if (!panel?.itemId) return;
    setSaving(true);
    const s = newStatus ?? panel.status;
    try {
      await api.patch(`/requirements/item/${panel.itemId}`, { status: s, notes });
      const updated = { ...panel, status: s, notes };
      setItems(prev => prev.map(i => i.itemId?.toString() === panel.itemId?.toString() ? updated : i));
      setPanel(updated);
    } finally { setSaving(false); }
  }

  /* ── No product selected ── */
  if (!productId) {
    return (
      <div style={{ padding: '40px', maxWidth: '640px', margin: '0 auto' }}>
        <div className="section-label" style={{ marginBottom: '8px' }}>Compliance Tracker</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)',
          letterSpacing: '-0.03em', marginBottom: '28px' }}>Select a product</h1>
        {products.map(p => (
          <button key={p._id} onClick={() => navigate(`/compliance/${p._id}`)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', padding: '18px 22px', marginBottom: '8px',
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 150ms' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
            <span style={{ color: 'var(--accent)', fontSize: '18px' }}>›</span>
          </button>
        ))}
        {!loading && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-2)' }}>
            No products registered yet.
            <br /><br />
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/product/new')}>Add Product</button>
          </div>
        )}
      </div>
    );
  }

  if (loading) return (
    <div style={{ padding: '40px' }}>
      {[...Array(10)].map((_, i) => (
        <div key={i} className="skeleton"
          style={{ height: '56px', borderRadius: 'var(--radius)', marginBottom: '4px',
            opacity: 1 - i * 0.07 }} />
      ))}
    </div>
  );

  /* ── Grouped render ── */
  const groups = pillar === 'All'
    ? PILLARS.map(p => ({ pillar: p, rows: items.filter(i => i.pillar === p) })).filter(g => g.rows.length)
    : [{ pillar, rows: filtered }];

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1060px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px', padding: '3px 10px' }}
              onClick={() => navigate('/compliance')}>← All</button>
            <span style={{ color: 'var(--border-hi)' }}>/</span>
            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{product?.name}</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)',
            letterSpacing: '-0.04em', marginBottom: '6px' }}>{product?.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              <span style={{ color: '#00e676', fontWeight: 700 }}>{done}</span> of {items.length} completed
            </span>
            {/* Mini progress bar */}
            <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.06)',
              borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${score}%`, borderRadius: '99px',
                background: score >= 70 ? '#00e676' : score >= 30 ? '#f59e0b' : '#f87171',
                transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: `0 0 8px ${score >= 70 ? '#00e676' : score >= 30 ? '#f59e0b' : '#f87171'}66`,
              }} />
            </div>
          </div>
        </div>
        <ScoreRing score={score} />
      </div>

      {/* ── Pillar filter tabs ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {allPillars.map(p => {
          const col     = PILLAR_COLOR[p];
          const active  = pillar === p;
          const cnt     = p === 'All' ? items.length : items.filter(i => i.pillar === p).length;
          const doneCnt = p === 'All' ? done : items.filter(i => i.pillar === p && i.status === 'done').length;
          return (
            <button key={p} onClick={() => setPillar(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '12px', fontWeight: active ? 700 : 500,
                background: active ? (col ? col + '15' : 'rgba(0,200,200,0.1)') : 'transparent',
                color: active ? (col || 'var(--accent)') : 'var(--text-2)',
                border: `1px solid ${active ? (col || 'var(--accent)') + '40' : 'var(--border)'}`,
                transition: 'all 150ms',
              }}>
              {/* Mini pillar dot */}
              {col && <div style={{ width: '6px', height: '6px', borderRadius: '50%',
                background: col, opacity: active ? 1 : 0.4 }} />}
              {p === 'All' ? 'All' : p.split(' ')[0]}
              <span style={{ fontFamily: 'var(--mono)', fontSize: '10px',
                opacity: 0.65, letterSpacing: '0.03em' }}>
                {doneCnt}/{cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Hint ── */}
      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '12px',
        display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor"
          strokeWidth="1.4" strokeLinecap="round"><circle cx="6" cy="6" r="5"/><path d="M6 5.5v3M6 4h.01"/></svg>
        Click the status icon to cycle status · Click the row title to open details
      </div>

      {/* ── Grouped checklist ── */}
      {groups.map(({ pillar: grpPillar, rows }) => {
        const col       = PILLAR_COLOR[grpPillar] || '#6e6e8a';
        const grpDone   = rows.filter(r => r.status === 'done').length;
        const grpPct    = rows.length ? Math.round(grpDone / rows.length * 100) : 0;
        const circ      = 2 * Math.PI * 9;

        return (
          <div key={grpPillar} style={{ marginBottom: '28px' }}>
            {pillar === 'All' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '4px', padding: '0 4px' }}>
                {/* Tiny pillar ring */}
                <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="9" fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                  <circle cx="12" cy="12" r="9" fill="none" stroke={col} strokeWidth="2.5"
                    strokeLinecap="round" strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - grpPct / 100)}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '12px 12px',
                      filter: `drop-shadow(0 0 4px ${col}55)` }} />
                </svg>
                <span style={{ fontSize: '11px', fontWeight: 700, color: col,
                  textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {grpPillar}
                </span>
                <div style={{ flex: 1, height: '1px', background: col + '25' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)' }}>
                  {grpDone}/{rows.length}
                </span>
              </div>
            )}

            {/* Rows container */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {rows.map((item, idx) => (
                <RequirementRow
                  key={item.itemId || item.reqId || idx}
                  item={item}
                  index={pillar === 'All'
                    ? items.findIndex(i => i.reqId === item.reqId)
                    : idx}
                  onOpenPanel={openPanel}
                  onStatusCycle={cycleStatus}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Status legend ── */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '4px 0' }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => {
          const cnt = items.filter(i => i.status === key).length;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%',
                background: cfg.color,
                boxShadow: key !== 'not_started' ? cfg.glow : 'none' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{cfg.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)' }}>
                {cnt}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Detail panel ── */}
      {panel && (
        <>
          <div className="panel-overlay" onClick={() => setPanel(null)} />
          <aside className="detail-panel">
            {/* Panel header */}
            <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: '14px' }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700,
                  color: PILLAR_COLOR[panel.pillar] || 'var(--accent)',
                  background: (PILLAR_COLOR[panel.pillar] || '#00c8c8') + '18',
                  padding: '3px 10px', borderRadius: '5px',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  border: `1px solid ${(PILLAR_COLOR[panel.pillar] || '#00c8c8')}25`,
                }}>
                  {panel.articleRef}
                </span>
                <button onClick={() => setPanel(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-2)',
                    fontSize: '20px', cursor: 'pointer', lineHeight: 1,
                    padding: '0 2px', transition: 'color 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                  ×
                </button>
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)',
                lineHeight: 1.5, marginBottom: '8px' }}>
                {panel.title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%',
                  background: STATUS_CFG[panel.status]?.color || '#6e6e8a',
                  boxShadow: STATUS_CFG[panel.status]?.glow }} />
                <span style={{ fontSize: '12px', color: STATUS_CFG[panel.status]?.color || '#6e6e8a',
                  fontWeight: 600 }}>
                  {STATUS_CFG[panel.status]?.label}
                </span>
              </div>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1,
              display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {panel.plainEnglish && (
                <div>
                  <div className="section-label" style={{ marginBottom: '10px' }}>Plain English</div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.85 }}>
                    {panel.plainEnglish}
                  </p>
                </div>
              )}

              {/* Status buttons */}
              <div>
                <div className="section-label" style={{ marginBottom: '10px' }}>Set Status</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                    const active = panel.status === key;
                    return (
                      <button key={key} onClick={() => savePanel(key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${active ? cfg.color + '45' : 'var(--border)'}`,
                          background: active ? cfg.color + '10' : 'transparent',
                          color: active ? cfg.color : 'var(--text-2)',
                          fontSize: '13px', fontWeight: active ? 600 : 400,
                          cursor: 'pointer', transition: 'all 150ms', textAlign: 'left',
                        }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%',
                          background: cfg.color, flexShrink: 0,
                          boxShadow: active ? cfg.glow : 'none' }} />
                        {cfg.label}
                        {active && (
                          <svg style={{ marginLeft: 'auto' }} width="13" height="13" viewBox="0 0 14 14"
                            fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round">
                            <path d="M2.5 7l3 3 6-6" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="section-label" style={{ marginBottom: '10px' }}>Notes / Evidence</div>
                <textarea className="input" rows={5}
                  style={{ resize: 'vertical', fontSize: '13px', lineHeight: 1.75 }}
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Paste evidence references, links, or notes…" />
                <button className="btn btn-primary" disabled={saving}
                  style={{ marginTop: '10px', width: '100%',
                    justifyContent: 'center', padding: '10px' }}
                  onClick={() => savePanel()}>
                  {saving ? 'Saving…' : 'Save Notes'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
