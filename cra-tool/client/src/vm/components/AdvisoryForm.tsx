import React, { useState } from 'react';
import { createAdvisory, updateAdvisory } from '../api/vmApi';

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

// Draft the security advisory for a ticket (VDMA ch. 14 field set, condensed).
// Saved as a draft; it is stamped published when the ticket transitions to
// advisory_published.
export default function AdvisoryForm({ ticket, existing, onSaved }: any) {
  const [title, setTitle]       = useState(existing?.title || `Security Advisory — ${ticket.ticketNumber}`);
  const [severity, setSeverity] = useState(existing?.content?.severity || 'High');
  const [products, setProducts] = useState(
    existing?.content?.affectedProducts?.join(', ')
    || (ticket.affectedProducts || []).map(p => [p.name, p.version].filter(Boolean).join(' ')).join(', ')
  );
  const [remedies, setRemedies]     = useState(existing?.content?.remedies || '');
  const [references, setReferences] = useState(existing?.content?.references?.join('\n') || '');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      ticketId: ticket._id,
      title,
      content: {
        severity,
        affectedProducts: products.split(',').map(s => s.trim()).filter(Boolean),
        remedies,
        references: references.split('\n').map(s => s.trim()).filter(Boolean),
      },
    };
    try {
      if (existing) await updateAdvisory(existing._id, payload);
      else          await createAdvisory(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save advisory');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="label">Advisory Title *</label>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
        <div>
          <label className="label">Severity</label>
          <select className="input" value={severity} onChange={e => setSeverity(e.target.value)}>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Affected Products (comma-separated)</label>
          <input className="input" value={products} onChange={e => setProducts(e.target.value)} placeholder="GH180 fw2.4.1, GH150 fw1.9" />
        </div>
      </div>
      <div>
        <label className="label">Remedies / Mitigations *</label>
        <textarea className="input" rows={4} value={remedies} onChange={e => setRemedies(e.target.value)} required
          placeholder="Update to firmware X.Y.Z; interim workaround: disable service Z..." style={{ resize: 'vertical' }} />
      </div>
      <div>
        <label className="label">References (one per line)</label>
        <textarea className="input" rows={2} value={references} onChange={e => setReferences(e.target.value)}
          placeholder={'CVE-2026-XXXXX\nhttps://...'} style={{ resize: 'vertical' }} />
      </div>
      {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? 'Saving…' : existing ? 'Update Draft' : 'Save Advisory Draft'}
        </button>
      </div>
    </form>
  );
}
