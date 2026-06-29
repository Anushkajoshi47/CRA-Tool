import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function scoreHex(pct) {
  if (pct >= 70) return '#00e676';
  if (pct >= 30) return '#f59e0b';
  return '#f87171';
}

function MiniRing({ score, hex }) {
  const [drawn, setDrawn] = useState(false);
  const r = 10, circ = 2 * Math.PI * r;
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 200); return () => clearTimeout(t); }, []);
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={hex} strokeWidth="3.5"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={drawn ? circ * (1 - score / 100) : circ}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '14px 14px', transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${hex}55)` }} />
    </svg>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [scores, setScores]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);
  const navigate                = useNavigate();

  useEffect(() => {
    api.get('/products').then(async r => {
      const prods = r.data;
      setProducts(prods);
      const map = {};
      await Promise.all(prods.map(async p => {
        const res = await api.get(`/requirements/${p._id}`);
        const its = res.data;
        map[p._id] = its.length ? Math.round((its.filter(i => i.status === 'done').length / its.length) * 100) : 0;
      }));
      setScores(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this product and all its compliance data? This cannot be undone.')) return;
    setDeleting(id);
    await api.delete(`/products/${id}`);
    setProducts(p => p.filter(x => x._id !== id));
    setDeleting(null);
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Product Registry</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>Products</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>Manage GH180 product variants and their individual CRA compliance progress.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/product/new')}>+ Add Product</button>
      </div>

      {/* Summary strip */}
      {!loading && products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Total Products',  value: products.length,                                      color: 'var(--accent)' },
            { label: 'Network-Enabled', value: products.filter(p => p.hasNetworkInterface).length,   color: 'var(--text-2)' },
            { label: 'Remote Access',   value: products.filter(p => p.hasRemoteAccess).length,       color: 'var(--warning)' },
            { label: 'Sold in EU',      value: products.filter(p => p.soldInEU).length,              color: 'var(--success)' },
          ].map(s => (
            <div key={s.label} className="card card-flat" style={{ padding: '18px 20px' }}>
              <div className="mono" style={{ fontSize: '26px', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '6px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', border: '1px dashed rgba(0,200,200,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '20px', height: '20px', background: 'rgba(0,200,200,0.1)', borderRadius: '6px' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>No products registered</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Add your first GH180 product to begin compliance tracking.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/product/new')}>Add First Product</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Model / Firmware</th>
                <th>CRA Class</th>
                <th>Score</th>
                <th>Progress</th>
                <th>Flags</th>
                <th>Support</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const score = scores[p._id] ?? 0;
                const hex   = scoreHex(score);
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: '11px', color: 'var(--text-2)' }}>{p.modelNumber || '—'}</div>
                      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{p.firmwareVersion || '—'}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700,
                        color: p.craClass === 'Important' ? 'var(--amber)' : p.craClass === 'Critical' ? 'var(--red)' : 'var(--text-2)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{p.craClass || 'Default'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MiniRing score={score} hex={hex} />
                        <span className="mono" style={{ fontSize: '15px', fontWeight: 700, color: hex }}>{score}%</span>
                      </div>
                    </td>
                    <td style={{ width: '130px' }}>
                      <div className="pbar-track" style={{ height: '4px' }}>
                        <div className="pbar-fill" style={{ width: `${score}%`, background: hex, boxShadow: `0 0 6px ${hex}55` }} />
                      </div>
                      <div className="mono" style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: '4px' }}>
                        {score}% complete
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {p.hasNetworkInterface && <FlagChip label="NET"    color="var(--accent)" />}
                        {p.hasRemoteAccess     && <FlagChip label="REMOTE" color="var(--warning)" />}
                        {p.soldInEU            && <FlagChip label="EU"     color="var(--success)" />}
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                      {p.supportPeriodYears ? `${p.supportPeriodYears} yr` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/compliance/${p._id}`)}>Open</button>
                        <button className="btn btn-danger btn-sm" disabled={deleting === p._id}
                          onClick={() => handleDelete(p._id)}>
                          {deleting === p._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FlagChip({ label, color }) {
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', fontWeight: 700, color, border: `1px solid ${color}30`, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em', background: color + '0d' }}>
      {label}
    </span>
  );
}
