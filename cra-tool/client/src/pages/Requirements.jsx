import React, { useEffect, useState } from 'react';
import api from '../api';

const PILLARS = ['All', 'Security Properties', 'Vulnerability Handling', 'Incident Reporting', 'Documentation'];
const PILLAR_CFG = {
  'Security Properties':    { color: '#00c8c8', dim: 'rgba(0,200,200,0.08)',   label: 'SECURITY' },
  'Vulnerability Handling': { color: '#f59e0b', dim: 'rgba(245,158,11,0.08)',  label: 'VULN' },
  'Incident Reporting':     { color: '#f87171', dim: 'rgba(248,113,113,0.08)', label: 'INCIDENT' },
  'Documentation':          { color: '#00e676', dim: 'rgba(0,230,118,0.08)',   label: 'DOCS' },
};

export default function Requirements() {
  const [reqs, setReqs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [pillar, setPillar]     = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    api.get('/requirements').then(r => { setReqs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = reqs
    .filter(r => pillar === 'All' || r.pillar === pillar)
    .filter(r => !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.articleRef?.toLowerCase().includes(search.toLowerCase()));

  const pillarCounts = PILLARS.slice(1).reduce((acc, p) => ({ ...acc, [p]: reqs.filter(r => r.pillar === p).length }), {});

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Reference Library</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>CRA Requirements</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>All 31 EU Cyber Resilience Act requirements for the Perfect Harmony GH180.</p>
      </div>

      {/* Pillar summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {PILLARS.slice(1).map(p => {
          const cfg = PILLAR_CFG[p];
          const isActive = pillar === p;
          return (
            <button key={p} onClick={() => setPillar(isActive ? 'All' : p)}
              className="card card-click"
              style={{ padding: '16px 18px', textAlign: 'left', border: `1px solid ${isActive ? cfg.color + '50' : 'var(--border)'}`, background: isActive ? cfg.dim : 'var(--card)', borderLeft: `3px solid ${isActive ? cfg.color : 'transparent'}` }}>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{cfg.label}</div>
              <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: isActive ? cfg.color : 'var(--text)', lineHeight: 1, marginBottom: '4px' }}>{pillarCounts[p] || 0}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-2)', lineHeight: 1.3 }}>{p.split(' ').slice(0,2).join(' ')}</div>
            </button>
          );
        })}
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" style={{ maxWidth: '280px' }} value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Search requirements..." />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PILLARS.map(p => (
            <button key={p}
              onClick={() => setPillar(p)}
              className={pillar === p ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              style={{ fontSize: '11px' }}>
              {p}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-3)' }}>{filtered.length} items</span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: '58px', borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map((req, idx) => {
            const isOpen = expanded === req._id;
            const cfg    = PILLAR_CFG[req.pillar] || { color: '#6e6e8a', dim: 'rgba(110,110,138,0.08)', label: 'OTHER' };
            return (
              <div key={req._id} className="card"
                style={{ padding: 0, borderLeft: `3px solid ${isOpen ? cfg.color : 'transparent'}`, transition: 'border-color 200ms', cursor: 'pointer' }}>
                {/* Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px' }}
                  onClick={() => setExpanded(isOpen ? null : req._id)}>
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--text-3)', width: '24px', flexShrink: 0, textAlign: 'right' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', fontWeight: 700, color: cfg.color, background: cfg.dim, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                    {req.articleRef}
                  </span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{req.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {req.urgent && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-dim)', border: '1px solid rgba(249,115,22,0.22)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.07em' }}>
                        URGENT
                      </span>
                    )}
                    {req.evidenceRequired && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text-3)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.04em' }}>EVIDENCE</span>
                    )}
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, opacity: 0.7 }} />
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }}>
                      <path d="M2.5 4.5l3.5 3 3.5-3" />
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '20px 20px 22px 58px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <div className="section-label" style={{ marginBottom: '10px' }}>Plain English</div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.85, margin: 0 }}>{req.plainEnglish}</p>
                    </div>
                    <div>
                      <div className="section-label" style={{ marginBottom: '10px' }}>Legal Text</div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-3)', lineHeight: 1.85, margin: 0, fontStyle: 'italic' }}>{req.legalText}</p>
                      <div style={{ marginTop: '16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <InfoChip label="Pillar" value={req.pillar} color={cfg.color} />
                        {req.appliesToClass  && <InfoChip label="Class"    value={req.appliesToClass} />}
                        {req.evidenceRequired && <InfoChip label="Evidence" value="Required" color="var(--warning)" />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '56px', color: 'var(--text-3)', fontSize: '13px' }}>
              No requirements match your filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoChip({ label, value, color = 'var(--text-2)' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px' }}>
      <span style={{ fontSize: '9.5px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}: </span>
      <span className="mono" style={{ fontSize: '9.5px', color }}>{value}</span>
    </div>
  );
}
