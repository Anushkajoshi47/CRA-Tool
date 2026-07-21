import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ConfirmDialog from '../shared/ConfirmDialog';
import { Row, Grid, Stack } from '../components/primitives/layout';
import s from './Products.module.css';

const CRA_CLASS_COLOR: Record<string, string> = { Important: 'var(--amber)', Critical: 'var(--red)' };

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
  const [confirmId, setConfirmId] = useState(null);
  const navigate                = useNavigate();

  useEffect(() => {
    api.get('/requirements/summary/all').then(r => {
      setProducts(r.data.products);
      const map = {};
      Object.entries(r.data.itemsByProduct).forEach(([pid, its]: any) => {
        map[pid] = its.length ? Math.round((its.filter(i => i.status === 'done').length / its.length) * 100) : 0;
      });
      setScores(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    setConfirmId(null);
    setDeleting(id);
    await api.delete(`/products/${id}`);
    setProducts(p => p.filter(x => x._id !== id));
    setDeleting(null);
  }

  return (
    <div className={s.page}>
      {/* Header */}
      <Row justify="between" align="center" gap={3} style={{ marginBottom: 'var(--space-8)' }}>
        <div>
          <div className={s.eyebrow}>Product Registry</div>
          <h1 className={s.title}>Products</h1>
          <p className={s.subtitle}>Manage GH180 product variants and their individual CRA compliance progress.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/product/new')}>+ Add Product</button>
      </Row>

      {/* Summary strip */}
      {!loading && products.length > 0 && (
        <Grid cols={4} gap={2} style={{ marginBottom: 'var(--space-6)' }}>
          {[
            { label: 'Total Products',  value: products.length,                                    color: 'var(--accent)' },
            { label: 'Network-Enabled', value: products.filter(p => p.hasNetworkInterface).length, color: 'var(--text-2)' },
            { label: 'Remote Access',   value: products.filter(p => p.hasRemoteAccess).length,     color: 'var(--warning)' },
            { label: 'Sold in EU',      value: products.filter(p => p.soldInEU).length,            color: 'var(--success)' },
          ].map(stat => (
            <div key={stat.label} className={`card card-flat ${s.statCard}`} style={{ ['--c' as any]: stat.color }}>
              <div className={`mono ${s.statValue}`}>{stat.value}</div>
              <div className={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </Grid>
      )}

      {/* Table */}
      {loading ? (
        <Stack gap={2}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius)' }} />)}
        </Stack>
      ) : products.length === 0 ? (
        <div className={`card ${s.empty}`}>
          <div className={s.emptyIcon}><div className={s.emptyIconInner} /></div>
          <div>
            <div className={s.emptyTitle}>No products registered</div>
            <div className={s.emptyDesc}>Add your first GH180 product to begin compliance tracking.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/product/new')}>Add First Product</button>
        </div>
      ) : (
        <div className={`card ${s.tableCard}`}>
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
                    <td><div className={s.pName}>{p.name}</div></td>
                    <td>
                      <div className={`mono ${s.pModel}`}>{p.modelNumber || '—'}</div>
                      <div className={`mono ${s.pFirmware}`}>{p.firmwareVersion || '—'}</div>
                    </td>
                    <td>
                      <span className={`mono ${s.craClass}`} style={{ ['--c' as any]: CRA_CLASS_COLOR[p.craClass] }}>
                        {p.craClass || 'Default'}
                      </span>
                    </td>
                    <td>
                      <Row gap={3}>
                        <MiniRing score={score} hex={hex} />
                        <span className={`mono ${s.score}`} style={{ ['--c' as any]: hex }}>{score}%</span>
                      </Row>
                    </td>
                    <td className={s.progressCol}>
                      <div className="pbar-track" style={{ height: 6 }}>
                        <div className="pbar-fill" style={{ width: `${score}%`, background: hex, boxShadow: `0 0 6px ${hex}55` }} />
                      </div>
                      <div className={`mono ${s.progressNote}`}>{score}% complete</div>
                    </td>
                    <td>
                      <Row gap={1}>
                        {p.hasNetworkInterface && <FlagChip label="NET"    color="var(--accent)" />}
                        {p.hasRemoteAccess     && <FlagChip label="REMOTE" color="var(--warning)" />}
                        {p.soldInEU            && <FlagChip label="EU"     color="var(--success)" />}
                      </Row>
                    </td>
                    <td className={`mono ${s.support}`}>
                      {p.supportPeriodYears ? `${p.supportPeriodYears} yr` : '—'}
                    </td>
                    <td className={s.actionsCell}>
                      <Row gap={2} justify="end" wrap={false}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/compliance/${p._id}`)}>Open</button>
                        <button className="btn btn-danger btn-sm" disabled={deleting === p._id} onClick={() => setConfirmId(p._id)}>
                          {deleting === p._id ? '...' : 'Delete'}
                        </button>
                      </Row>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Delete product?"
        message="This deletes the product and all its compliance data. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

function FlagChip({ label, color }) {
  return <span className={`mono ${s.flag}`} style={{ ['--c' as any]: color }}>{label}</span>;
}
