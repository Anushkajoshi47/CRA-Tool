import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function classify(hasNetwork, hasRemote) {
  if (hasRemote) return { cls: 'Important', color: 'var(--amber)', dim: 'var(--amber-dim)', reason: 'Remote access capability triggers Important class under Annex III.' };
  if (hasNetwork) return { cls: 'Default',  color: 'var(--text-2)', dim: 'rgba(110,110,138,0.08)', reason: 'Network interface present but no remote access. Default class applies.' };
  return { cls: 'Default', color: 'var(--text-2)', dim: 'rgba(110,110,138,0.08)', reason: 'No network interface or remote access. Default class applies.' };
}

function Toggle({ label, hint, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', cursor: 'pointer', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{label}</div>
        {hint && <div style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5, maxWidth: '320px' }}>{hint}</div>}
      </div>
      <div onClick={() => onChange(!value)}
        style={{ width: '42px', height: '24px', borderRadius: '12px', background: value ? 'var(--accent)' : 'rgba(255,255,255,0.08)', border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0, boxShadow: value ? '0 0 12px rgba(0,200,200,0.25)' : 'none' }}>
        <div style={{ position: 'absolute', top: '3px', left: value ? '20px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: value ? '#000' : 'rgba(255,255,255,0.3)', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </div>
    </label>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label className="label" style={{ display: 'block', marginBottom: '6px' }}>{label}</label>
      {hint && <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginBottom: '8px', lineHeight: 1.5 }}>{hint}</div>}
      {children}
    </div>
  );
}

export default function ProductForm() {
  const navigate  = useNavigate();
  const [form, setForm] = useState({
    name:               '',
    modelNumber:        '',
    firmwareVersion:    '',
    supportPeriodYears: '',
    hasNetworkInterface: false,
    hasRemoteAccess:    false,
    soldInEU:           false,
  });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const classification = classify(form.hasNetworkInterface, form.hasRemoteAccess);

  function set(field) { return v => setForm(f => ({ ...f, [field]: v })); }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    if (!form.name.trim()) { setError('Product name is required.'); return; }
    setSaving(true);
    try {
      await api.post('/products', { ...form, craClass: classification.cls });
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product. Please try again.');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '680px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => navigate('/products')}>← Products</button>
        </div>
        <div className="section-label" style={{ marginBottom: '4px' }}>Product Registry</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>Add Product</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>Register a GH180 variant. CRA compliance requirements will be created automatically.</p>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--red)', fontSize: '12.5px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Identity */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div className="section-label" style={{ marginBottom: '18px' }}>Product Identity</div>
          <FormField label="Product Name" hint="A descriptive name for this GH180 variant.">
            <input className="input" value={form.name} onChange={e => set('name')(e.target.value)} placeholder="e.g. GH180 MV Drive — Frame A" required autoFocus />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Model Number">
              <input className="input mono" value={form.modelNumber} onChange={e => set('modelNumber')(e.target.value)} placeholder="e.g. GH180-4A7" />
            </FormField>
            <FormField label="Firmware Version">
              <input className="input mono" value={form.firmwareVersion} onChange={e => set('firmwareVersion')(e.target.value)} placeholder="e.g. v3.14.2" />
            </FormField>
          </div>
          <FormField label="Support Period (years)" hint="Minimum support commitment for security updates.">
            <input className="input" type="number" min="1" max="30" value={form.supportPeriodYears}
              onChange={e => set('supportPeriodYears')(e.target.value)} placeholder="e.g. 10" style={{ maxWidth: '160px' }} />
          </FormField>
        </div>

        {/* Connectivity flags */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div className="section-label" style={{ marginBottom: '18px' }}>Connectivity &amp; Market</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Toggle label="Has Network Interface"
              hint="Drive connects to an industrial network (PROFINET, EtherNet/IP, Modbus TCP, etc.)"
              value={form.hasNetworkInterface}
              onChange={set('hasNetworkInterface')} />
            <Toggle label="Has Remote Access"
              hint="Drive can be operated or configured remotely over a network connection."
              value={form.hasRemoteAccess}
              onChange={set('hasRemoteAccess')} />
            <Toggle label="Sold in the EU"
              hint="Product is placed on the European market. CRA applies directly."
              value={form.soldInEU}
              onChange={set('soldInEU')} />
          </div>
        </div>

        {/* Classification result */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', borderLeft: `3px solid ${classification.color}`, background: classification.dim }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>CRA Classification</span>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: classification.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {classification.cls}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.65 }}>{classification.reason}</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center', padding: '11px', fontSize: '13.5px' }}>
            {saving ? 'Creating…' : 'Create Product'}
          </button>
          <button type="button" className="btn btn-ghost" style={{ padding: '11px 20px' }} onClick={() => navigate('/products')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
