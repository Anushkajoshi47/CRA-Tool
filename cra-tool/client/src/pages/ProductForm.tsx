import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Stack, Row, Grid } from '../components/primitives/layout';
import fp from '../shared/FormPage.module.css';
import s from './ProductForm.module.css';

const PRODUCTS = [
  { id: 'gh150',    label: 'Innomotics Perfect Harmony GH150', prefix: 'GH150',   range: 'Medium Voltage Drive', network: true, remote: true  },
  { id: 'gh180',    label: 'Innomotics Perfect Harmony GH180', prefix: 'GH180',   range: 'Medium Voltage Drive', network: true, remote: true  },
  { id: 'sh150',    label: 'Innomotics Perfect Harmony SH150', prefix: 'SH150',   range: 'Medium Voltage Drive', network: true, remote: true  },
  { id: 'gm150',    label: 'Innomotics GM150',                 prefix: 'GM150',   range: 'Medium Voltage Drive', network: true, remote: true  },
  { id: 'sm150',    label: 'Innomotics SM150',                 prefix: 'SM150',   range: 'Medium Voltage Drive', network: true, remote: true  },
  { id: 'gl150',    label: 'Innomotics GL150',                 prefix: 'GL150',   range: 'Medium Voltage Drive', network: true, remote: true  },
  { id: 'sl150',    label: 'Innomotics SL150',                 prefix: 'SL150',   range: 'Medium Voltage Drive', network: true, remote: true  },
  { id: 'pr150',    label: 'Innomotics Rectifier PR150',       prefix: 'PR150',   range: 'Medium Voltage Rectifier', network: true, remote: true },
];

function classify(hasNetwork, hasRemote) {
  if (hasRemote) return { cls: 'Important', color: 'var(--amber)', dim: 'rgba(245,158,11,0.06)', reason: 'Remote access capability triggers Important class under Annex III.' };
  if (hasNetwork) return { cls: 'Default',  color: 'var(--text-2)', dim: 'rgba(110,110,138,0.08)', reason: 'Network interface present but no remote access. Default class applies.' };
  return             { cls: 'Default',  color: 'var(--text-2)', dim: 'rgba(110,110,138,0.08)', reason: 'No network interface or remote access. Default class applies.' };
}

function Toggle({ label, hint, value, onChange }: any) {
  return (
    <label className={s.toggle}>
      <div>
        <div className={s.toggleLabel}>{label}</div>
        {hint && <div className={s.toggleHint}>{hint}</div>}
      </div>
      <div className={s.switch} data-on={!!value} onClick={() => onChange(!value)}>
        <div className={s.knob} />
      </div>
    </label>
  );
}

function FormField({ label, hint, children }: any) {
  return (
    <div className={s.field}>
      <label className="label" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>{label}</label>
      {hint && <div className={s.fieldHint}>{hint}</div>}
      {children}
    </div>
  );
}

export default function ProductForm() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: '', modelNumber: '', firmwareVersion: '', supportPeriodYears: '',
    hasNetworkInterface: false, hasRemoteAccess: false, soldInEU: false,
  });
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const classification = classify(form.hasNetworkInterface, form.hasRemoteAccess);

  function set(field) { return v => setForm(f => ({ ...f, [field]: v })); }

  function pickProduct(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) { setSelected(null); return; }
    setSelected(p);
    setForm(f => ({
      ...f,
      name:               p.label,
      modelNumber:        p.prefix + '-',
      hasNetworkInterface: p.network,
      hasRemoteAccess:    p.remote,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    if (!selected)         { setError('Please select an Innomotics product.'); return; }
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
    <div className={fp.page} style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }} onClick={() => navigate('/products')}>← Products</button>
        <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Product Registry</div>
        <h1 className={s.title}>Add Product</h1>
        <p className={s.subtitle}>Select an Innomotics Medium Voltage Drive. CRA compliance checklist is created automatically.</p>
      </div>

      {error && <div className={fp.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Product selector */}
        <div className={`card ${s.card}`}>
          <FormField label="Innomotics Product" hint="Select the Medium Voltage Drive you are registering for CRA compliance.">
            <select className={`input ${s.select}`} value={selected?.id || ''} onChange={e => pickProduct(e.target.value)}>
              <option value="">— Select a product —</option>
              {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </FormField>

          {/* Product info chip row */}
          {selected && (
            <div className={s.chipRow}>
              <span className={`mono ${s.chipModel}`}>{selected.prefix}</span>
              <span className={s.chipRange}>{selected.range}</span>
              {selected.network && <span className={s.chipNet}>NET</span>}
              {selected.remote  && <span className={s.chipRemote}>REMOTE</span>}
            </div>
          )}
        </div>

        {/* Identity — only shown after product picked */}
        {selected && (
          <>
            <div className={`card ${s.card}`}>
              <div className="section-label" style={{ marginBottom: 18 }}>Product Details</div>
              <FormField label="Product Name" hint="Add a variant or application label if needed.">
                <input className="input" value={form.name} onChange={e => set('name')(e.target.value)}
                  placeholder={selected.label} required autoFocus />
              </FormField>
              <Grid cols={2} gap={3}>
                <FormField label="Model Number">
                  <input className="input mono" value={form.modelNumber} onChange={e => set('modelNumber')(e.target.value)}
                    placeholder={`e.g. ${selected.prefix}-XXX`} />
                </FormField>
                <FormField label="Firmware Version">
                  <input className="input mono" value={form.firmwareVersion} onChange={e => set('firmwareVersion')(e.target.value)}
                    placeholder="e.g. v3.14.2" />
                </FormField>
              </Grid>
              <FormField label="Support Period (years)" hint="Security update commitment under CRA Article 13(8).">
                <input className={`input ${s.supportInput}`} type="number" min="1" max="30" value={form.supportPeriodYears}
                  onChange={e => set('supportPeriodYears')(e.target.value)} placeholder="e.g. 10" />
              </FormField>
            </div>

            <div className={`card ${s.card}`}>
              <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Connectivity &amp; Market</div>
              <div className={s.connNote}>
                Pre-filled for <strong style={{ color: 'var(--text-2)' }}>{selected.label.split('—')[0].trim()}</strong> — override if your variant differs.
              </div>
              <Stack gap={4}>
                <Toggle label="Has Network Interface"
                  hint="Connects to an industrial network (PROFINET, EtherNet/IP, Modbus TCP, etc.)"
                  value={form.hasNetworkInterface} onChange={set('hasNetworkInterface')} />
                <Toggle label="Has Remote Access"
                  hint="Can be operated or configured remotely over a network connection."
                  value={form.hasRemoteAccess} onChange={set('hasRemoteAccess')} />
                <Toggle label="Sold in the EU"
                  hint="Product is placed on the European market. CRA applies directly."
                  value={form.soldInEU} onChange={set('soldInEU')} />
              </Stack>
            </div>

            <div className={`card ${s.classCard}`} style={{ ['--cc' as any]: classification.color, ['--ccdim' as any]: classification.dim }}>
              <div className={s.classHead}>
                <span className={s.classLabel}>CRA Classification</span>
                <span className={`mono ${s.classValue}`}>{classification.cls}</span>
              </div>
              <p className={s.classReason}>{classification.reason}</p>
            </div>

            <Row gap={2}>
              <button type="submit" className={`btn btn-primary ${s.submit}`} disabled={saving}>
                {saving ? 'Creating…' : 'Create Product'}
              </button>
              <button type="button" className="btn btn-ghost" style={{ padding: '11px 20px' }} onClick={() => navigate('/products')}>Cancel</button>
            </Row>
          </>
        )}
      </form>
    </div>
  );
}
