import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../api/vmApi';
import type { SourceChannel } from '../../types';

const SOURCE_CHANNELS = ['email', 'phone', 'internal_testing', 'supplier', 'other'];

export default function NewTicketForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title:           '',
    sourceChannel:   'email' as SourceChannel,
    reporterName:    '',
    reporterContact: '',
    caseManager:     '',
    environment:     '',
    description:     '',
    isIncident:      false,
  });
  const [products, setProducts] = useState([{ name: '', version: '' }]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addProduct    = () => setProducts(p => [...p, { name: '', version: '' }]);
  const removeProduct = (i) => setProducts(p => p.filter((_, j) => j !== i));
  const setProduct    = (i, k, v) =>
    setProducts(p => p.map((item, j) => j === i ? { ...item, [k]: v } : item));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        affectedProducts: products.filter(p => p.name || p.version),
      };
      const { data } = await createTicket(payload);
      navigate(`/vm/tickets/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <div className="section-label" style={{ marginBottom: 6 }}>Vulnerability Management</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Log Vulnerability</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.6 }}>
          A ticket number (PSIRT-YYYY-NNNN) will be auto-assigned. Everything after this
          is worked through the lifecycle by the PSIRT team.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Vulnerability */}
        <section>
          <div className="section-label" style={{ marginBottom: 12 }}>Vulnerability</div>
          <label className="label">Title *</label>
          <input
            className="input"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
            placeholder="Short summary, e.g. RCE in firmware update service"
          />
        </section>

        {/* Affected Products */}
        <section>
          <div className="section-label" style={{ marginBottom: 12 }}>Affected Products</div>
          {products.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                {i === 0 && <label className="label">Product Name</label>}
                <input
                  className="input"
                  value={p.name}
                  onChange={e => setProduct(i, 'name', e.target.value)}
                  placeholder="e.g. GH180"
                />
              </div>
              <div style={{ flex: 1 }}>
                {i === 0 && <label className="label">Version / Firmware</label>}
                <input
                  className="input"
                  value={p.version}
                  onChange={e => setProduct(i, 'version', e.target.value)}
                  placeholder="e.g. fw2.1"
                />
              </div>
              {products.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeProduct(i)}
                  style={{ marginBottom: 1 }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addProduct}>
            + Add Product
          </button>
          <div style={{ marginTop: 14 }}>
            <label className="label">Operational / Deployment Environment</label>
            <input
              className="input"
              value={form.environment}
              onChange={e => set('environment', e.target.value)}
              placeholder="e.g. medium-voltage drive in industrial plant network, air-gapped"
            />
          </div>
        </section>

        {/* Source */}
        <section>
          <div className="section-label" style={{ marginBottom: 12 }}>Source</div>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Case Type *</label>
            <select
              className="input"
              value={form.isIncident ? 'incident' : 'vulnerability'}
              onChange={e => set('isIncident', e.target.value === 'incident')}
            >
              <option value="vulnerability">Vulnerability report</option>
              <option value="incident">Serious security incident (CRA Art. 14 §3)</option>
            </select>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>
              Incidents follow the same handling flow but the final report to ENISA is due
              1 month after notification instead of 14 days after mitigation.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Received Via *</label>
              <select
                className="input"
                value={form.sourceChannel}
                onChange={e => set('sourceChannel', e.target.value)}
                required
              >
                {SOURCE_CHANNELS.map(c => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reporter Name</label>
              <input
                className="input"
                value={form.reporterName}
                onChange={e => set('reporterName', e.target.value)}
                placeholder="Researcher / reporter name"
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label className="label">Reporter Contact</label>
            <input
              className="input"
              value={form.reporterContact}
              onChange={e => set('reporterContact', e.target.value)}
              placeholder="Email or phone"
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <label className="label">Case Manager (PSSO of affected product)</label>
            <input
              className="input"
              value={form.caseManager}
              onChange={e => set('caseManager', e.target.value)}
              placeholder="Who navigates this ticket to closure"
            />
          </div>
        </section>

        {/* Description */}
        <section>
          <div className="section-label" style={{ marginBottom: 12 }}>Description</div>
          <label className="label">What was reported? *</label>
          <textarea
            className="input"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            required
            rows={5}
            placeholder="Attack vector, observed behavior, reproduction steps, any additional context the reporter provided..."
            style={{ resize: 'vertical' }}
          />
        </section>

        {error && <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Ticket'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/vm/tickets')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
