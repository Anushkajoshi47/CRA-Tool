import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdvisories } from '../api/vmApi';

export default function AdvisoryList() {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    getAdvisories()
      .then(r => setAdvisories(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Vulnerability Management</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Security Advisories</h1>
        </div>
        <button className="btn btn-ghost btn-sm no-print" disabled={advisories.length === 0} onClick={() => window.print()}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5, verticalAlign: -1 }}>
            <path d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5.5h11v5.5h-2M4.5 9.5h7v4h-7z" />
          </svg>
          Print / Save as PDF
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Loading…</div>
      ) : advisories.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          No advisories yet. Advisories are drafted in a ticket's <strong>Workflow</strong> tab at the
          “Document the security advisory” step, and published from there.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {advisories.map(a => (
            <div key={a._id} className="card card-flat" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                      {a.title}
                    </h3>
                    {a.publishedAt
                      ? <span className="pill pill-done">Published</span>
                      : <span className="pill pill-pending">Draft</span>
                    }
                  </div>
                  {a.content?.severity && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      {a.content.severity}
                    </div>
                  )}
                  {a.content?.affectedProducts?.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                      Affected: {a.content.affectedProducts.join(', ')}
                    </div>
                  )}
                  {a.content?.remedies && (
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                      {a.content.remedies}
                    </div>
                  )}
                  {a.content?.references?.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>
                      References: {a.content.references.join(' · ')}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {a.publishedAt && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
                      Published {new Date(a.publishedAt).toLocaleDateString()}
                    </div>
                  )}
                  <Link to={`/vm/tickets/${a.ticketId}`} style={{ fontSize: 12, color: 'var(--accent)' }}>
                    View Ticket →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
