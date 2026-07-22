import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, uploadAttachments } from '../api/vmApi';
import type { SourceChannel } from '../../types';
import { Stack, Row, Grid } from '../../components/primitives/layout';
import s from '../../shared/FormPage.module.css';

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
  const [references, setReferences] = useState([{ label: '', url: '' }]);
  const [files, setFiles]       = useState<File[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const addFiles    = (list: FileList | null) => setFiles(f => [...f, ...Array.from(list || [])]);
  const removeFile  = (i: number) => setFiles(f => f.filter((_, j) => j !== i));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addProduct    = () => setProducts(p => [...p, { name: '', version: '' }]);
  const removeProduct = (i) => setProducts(p => p.filter((_, j) => j !== i));
  const setProduct    = (i, k, v) =>
    setProducts(p => p.map((item, j) => j === i ? { ...item, [k]: v } : item));

  const addReference    = () => setReferences(r => [...r, { label: '', url: '' }]);
  const removeReference = (i) => setReferences(r => r.filter((_, j) => j !== i));
  const setReference    = (i, k, v) =>
    setReferences(r => r.map((item, j) => j === i ? { ...item, [k]: v } : item));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        affectedProducts: products.filter(p => p.name || p.version),
        references: references.filter(r => r.url.trim() || r.label.trim()),
      };
      const { data } = await createTicket(payload);
      // Upload any chosen files to the freshly created case, then open it.
      if (files.length) {
        try { await uploadAttachments(data._id, files); }
        catch { /* case is created; attachments can be re-added on the case page */ }
      }
      navigate(`/vm/tickets/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
      setLoading(false);
    }
  }

  return (
    <div className={s.page}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Vulnerability Management</div>
        <h1 className={s.title}>Log Vulnerability</h1>
        <p className={s.subtitle}>
          A ticket number (PSIRT-YYYY-NNNN) will be auto-assigned. Everything after this
          is worked through the lifecycle by the PSIRT team.
        </p>
      </div>

      <Stack as="form" gap={6} onSubmit={handleSubmit}>

        {/* Vulnerability */}
        <section>
          <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Vulnerability</div>
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
          <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Affected Products</div>
          <Stack gap={2} style={{ marginBottom: 'var(--space-2)' }}>
            {products.map((p, i) => (
              <Row key={i} gap={2} align="end">
                <div className={s.productNameCol}>
                  {i === 0 && <label className="label">Product Name</label>}
                  <input className="input" value={p.name} onChange={e => setProduct(i, 'name', e.target.value)} placeholder="e.g. GH180" />
                </div>
                <div className={s.productVerCol}>
                  {i === 0 && <label className="label">Version / Firmware</label>}
                  <input className="input" value={p.version} onChange={e => setProduct(i, 'version', e.target.value)} placeholder="e.g. fw2.1" />
                </div>
                {products.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeProduct(i)} style={{ marginBottom: 1 }}>✕</button>
                )}
              </Row>
            ))}
          </Stack>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addProduct}>+ Add Product</button>
          <div style={{ marginTop: 'var(--space-3)' }}>
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
          <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Source</div>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label className="label">Case Type *</label>
            <select
              className="input"
              value={form.isIncident ? 'incident' : 'vulnerability'}
              onChange={e => set('isIncident', e.target.value === 'incident')}
            >
              <option value="vulnerability">Vulnerability report</option>
              <option value="incident">Serious security incident (CRA Art. 14 §3)</option>
            </select>
            <p className={s.hint}>
              Incidents follow the same handling flow but the final report to ENISA is due
              1 month after notification instead of 14 days after mitigation.
            </p>
          </div>
          <Grid cols={2} gap={3}>
            <div>
              <label className="label">Received Via *</label>
              <select className="input" value={form.sourceChannel} onChange={e => set('sourceChannel', e.target.value)} required>
                {SOURCE_CHANNELS.map(c => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reporter Name</label>
              <input className="input" value={form.reporterName} onChange={e => set('reporterName', e.target.value)} placeholder="Researcher / reporter name" />
            </div>
          </Grid>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <label className="label">Reporter Contact</label>
            <input className="input" value={form.reporterContact} onChange={e => set('reporterContact', e.target.value)} placeholder="Email or phone" />
          </div>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <label className="label">Duty Manager</label>
            <p className={s.hint} style={{ marginTop: 0, marginBottom: 'var(--space-2)' }}>
              PSIRT duty manager who receives the vulnerability issue.
            </p>
            <input className="input" value={form.caseManager} onChange={e => set('caseManager', e.target.value)} placeholder="e.g. on-call PSIRT duty manager" />
          </div>
        </section>

        {/* Description */}
        <section>
          <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Description</div>
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

        {/* References & Attachments */}
        <section>
          <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>References &amp; Attachments</div>
          <p className={s.hint} style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>
            Upload PDFs or screenshots directly, or link to material hosted elsewhere.
          </p>

          {/* Upload files */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Upload files (PDF or images, max 10 MB each)</label>
            <input
              type="file"
              multiple
              accept=".pdf,image/png,image/jpeg,image/gif,image/webp"
              onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
              style={{ display: 'block', fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}
            />
            {files.length > 0 && (
              <Stack gap={1} style={{ marginTop: 'var(--space-2)' }}>
                {files.map((f, i) => (
                  <Row key={i} gap={2} align="center">
                    <span style={{ fontSize: 12.5, color: 'var(--text)' }}>{f.name}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeFile(i)}>Remove</button>
                  </Row>
                ))}
              </Stack>
            )}
          </div>

          <label className="label">Or add a link / URL</label>
          <Stack gap={2}>
            {references.map((r, i) => (
              <Row key={i} gap={2} align="end">
                <div className={s.productNameCol}>
                  {i === 0 && <label className="label">Label</label>}
                  <input className="input" value={r.label} onChange={e => setReference(i, 'label', e.target.value)} placeholder="e.g. PoC screenshot, packet capture" />
                </div>
                <div style={{ flex: 2 }}>
                  {i === 0 && <label className="label">Link / URL</label>}
                  <input className="input" type="url" value={r.url} onChange={e => setReference(i, 'url', e.target.value)} placeholder="https://…" />
                </div>
                {references.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeReference(i)} style={{ marginBottom: 1 }}>✕</button>
                )}
              </Row>
            ))}
          </Stack>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-2)' }} onClick={addReference}>
            + Add Reference
          </button>
        </section>

        {error && <div className={s.error}>{error}</div>}

        <Row gap={3}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Ticket'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/vm/tickets')}>
            Cancel
          </button>
        </Row>
      </Stack>
    </div>
  );
}
