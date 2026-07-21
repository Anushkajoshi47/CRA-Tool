import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import rs from './Compliance.module.css';

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
  const [spinning, setSpinning] = useState(false);
  const pillarColor = PILLAR_COLOR[item.pillar] || '#6e6e8a';
  const statusCfg   = STATUS_CFG[item.status] || STATUS_CFG.not_started;

  function handleCycle() {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
    onStatusCycle(item);
  }

  return (
    <div className={rs.row} style={{ ['--pc' as any]: pillarColor, ['--sc' as any]: statusCfg.color }}>
      <div className={rs.accent} />

      {/* Clickable status icon */}
      <StatusIcon status={item.status} onClick={handleCycle} spinning={spinning} />

      <span className={rs.index}>{String(index + 1).padStart(2, '0')}</span>

      <span className={rs.articleRef}>{item.articleRef}</span>

      <span className={rs.title} onClick={() => onOpenPanel(item)}>{item.title}</span>

      <div className={rs.rightGroup}>
        {item.evidenceRequired?.length > 0 && <span className={rs.chipEvidence}>EVIDENCE</span>}
        {item.urgent && <span className={rs.chipUrgent}>URGENT</span>}
        <span className={rs.statusLabel}>{statusCfg.label}</span>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className={rs.arrow}
          onClick={() => onOpenPanel(item)}
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
  const [items, setItems]       = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
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

  async function savePanel(newStatus?: any) {
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
      <div className={rs.landing}>
        <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Compliance Tracker</div>
        <h1 className={rs.landingTitle}>Select a product</h1>
        {products.map(p => (
          <button key={p._id} onClick={() => navigate(`/compliance/${p._id}`)} className={rs.productBtn}>
            <span className={rs.productName}>{p.name}</span>
            <span className={rs.productChevron}>›</span>
          </button>
        ))}
        {!loading && products.length === 0 && (
          <div className={rs.landingEmpty}>
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

  const scoreHex = score >= 70 ? '#00e676' : score >= 30 ? '#f59e0b' : '#f87171';

  return (
    <div className={rs.page}>

      {/* ── Header ── */}
      <div className={rs.header}>
        <div>
          <div className={rs.crumbRow}>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 'var(--text-sm)', padding: '3px 10px' }}
              onClick={() => navigate('/compliance')}>← All</button>
            <span className={rs.crumbSep}>/</span>
            <span className={rs.crumbName}>{product?.name}</span>
          </div>
          <h1 className={rs.pageTitle}>{product?.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <span className={rs.progressText}>
              <span className={rs.progressDone}>{done}</span> of {items.length} completed
            </span>
            <div className={rs.miniBar}>
              <div className={rs.miniBarFill} style={{ width: `${score}%`, background: scoreHex, boxShadow: `0 0 8px ${scoreHex}66` }} />
            </div>
          </div>
        </div>
        <ScoreRing score={score} />
      </div>

      {/* ── Pillar filter tabs ── */}
      <div className={rs.pillarTabs}>
        {allPillars.map(p => {
          const col     = PILLAR_COLOR[p];
          const active  = pillar === p;
          const cnt     = p === 'All' ? items.length : items.filter(i => i.pillar === p).length;
          const doneCnt = p === 'All' ? done : items.filter(i => i.pillar === p && i.status === 'done').length;
          return (
            <button key={p} onClick={() => setPillar(p)} className={rs.pillarTab} data-active={active}
              style={{ ['--pc' as any]: col || 'var(--accent)' }}>
              {col && <div className={rs.pillarDot} />}
              {p === 'All' ? 'All' : p.split(' ')[0]}
              <span className={rs.pillarCount}>{doneCnt}/{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* ── Hint ── */}
      <div className={rs.hint}>
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
          <div key={grpPillar} className={rs.group} style={{ ['--gc' as any]: col }}>
            {pillar === 'All' && (
              <div className={rs.groupHead}>
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
                <span className={rs.groupTitle}>{grpPillar}</span>
                <div className={rs.groupLine} />
                <span className={rs.groupCount}>{grpDone}/{rows.length}</span>
              </div>
            )}

            {/* Rows container */}
            <div className={rs.rowsCard}>
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
      <div className={rs.legend}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => {
          const cnt = items.filter(i => i.status === key).length;
          return (
            <div key={key} className={rs.legendItem}>
              <div className={rs.legendDot} style={{ ['--lc' as any]: cfg.color, boxShadow: key !== 'not_started' ? cfg.glow : 'none' }} />
              <span className={rs.legendLabel}>{cfg.label}</span>
              <span className={rs.legendCount}>{cnt}</span>
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
            <div className={rs.panelHead} style={{ ['--pc' as any]: PILLAR_COLOR[panel.pillar] || 'var(--accent)', ['--sc' as any]: STATUS_CFG[panel.status]?.color || '#6e6e8a' }}>
              <div className={rs.panelHeadTop}>
                <span className={rs.panelRef}>{panel.articleRef}</span>
                <button onClick={() => setPanel(null)} className={rs.panelClose}>×</button>
              </div>
              <h2 className={rs.panelTitle}>{panel.title}</h2>
              <div className={rs.panelStatus}>
                <div className={rs.panelStatusDot} style={{ boxShadow: STATUS_CFG[panel.status]?.glow }} />
                <span className={rs.panelStatusLabel}>{STATUS_CFG[panel.status]?.label}</span>
              </div>
            </div>

            <div className={rs.panelBody}>
              {panel.plainEnglish && (
                <div>
                  <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Plain English</div>
                  <p className={rs.plainEnglish}>{panel.plainEnglish}</p>
                </div>
              )}

              {/* Status buttons */}
              <div>
                <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Set Status</div>
                <div className={rs.statusBtns}>
                  {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                    const active = panel.status === key;
                    return (
                      <button key={key} onClick={() => savePanel(key)} className={rs.statusBtn} data-active={active}
                        style={{ ['--sbc' as any]: cfg.color }}>
                        <div className={rs.statusBtnDot} style={{ boxShadow: active ? cfg.glow : 'none' }} />
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
                <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Notes / Evidence</div>
                <textarea className={`input ${rs.notesArea}`} rows={5}
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Paste evidence references, links, or notes…" />
                <button className={`btn btn-primary ${rs.saveNotes}`} disabled={saving} onClick={() => savePanel()}>
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
