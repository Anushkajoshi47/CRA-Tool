import React, { useEffect, useState } from 'react';
import api from '../api';
import { getTheme, applyTheme, ThemeMode } from '../shared/theme';

export default function Settings() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="section-label" style={{ marginBottom: 6 }}>Account</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>
          Manage your profile, appearance, and product registry.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <ProfileSection />
        <PasswordSection />
        <AppearanceSection />
        <ProductsSection />
      </div>
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────── */
function ProfileSection() {
  const [name, setName]       = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then(r => { setName(r.data.name || ''); setOrgName(r.data.orgName || ''); setEmail(r.data.email); })
      .catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      const { data } = await api.patch('/auth/me', { name, orgName });
      localStorage.setItem('name', data.name || '');
      localStorage.setItem('orgName', data.orgName || '');
      setMessage('Profile saved.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Profile" subtitle="Your display name is shown in the sidebar and audit trail. The organization line appears under the logo.">
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="label">Display Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Anushka Joshi" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
        </div>
        <div>
          <label className="label">Organization / Product Line</label>
          <input className="input" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Innomotics GH180" />
        </div>
        <Feedback message={message} error={error} />
        <div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </Section>
  );
}

/* ── Password ────────────────────────────────────────────────── */
function PasswordSection() {
  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(''); setError('');
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    setSaving(true);
    try {
      await api.patch('/auth/me', { currentPassword: current, newPassword: next });
      setMessage('Password changed.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Password" subtitle="Change the password you use to sign in.">
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label className="label">Current Password</label>
            <input className="input" type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input className="input" type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="label">Confirm New</label>
            <input className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
        </div>
        <Feedback message={message} error={error} />
        <div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !current || !next}>
            {saving ? 'Saving…' : 'Change Password'}
          </button>
        </div>
      </form>
    </Section>
  );
}

/* ── Appearance ──────────────────────────────────────────────── */
function AppearanceSection() {
  const [mode, setMode] = useState<ThemeMode>(getTheme());

  function choose(m: ThemeMode) {
    applyTheme(m);
    setMode(m);
  }

  const OPTIONS: { value: ThemeMode; label: string; desc: string }[] = [
    { value: 'dark',  label: 'Dark',  desc: 'Default — high-contrast dark workspace.' },
    { value: 'light', label: 'Light', desc: 'Corporate light theme for offices and projectors.' },
  ];

  return (
    <Section title="Appearance" subtitle="Applies immediately and is remembered on this browser.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => choose(o.value)}
            className="card card-flat"
            style={{
              padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
              border: `1px solid ${mode === o.value ? 'var(--accent)' : 'var(--border)'}`,
              background: mode === o.value ? 'var(--accent-dim)' : 'var(--card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${mode === o.value ? 'var(--accent)' : 'var(--text-3)'}`,
                background: mode === o.value ? 'var(--accent)' : 'transparent',
              }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{o.label}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{o.desc}</div>
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ── Products ────────────────────────────────────────────────── */
function ProductsSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/products')
      .then(r => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section title="Products" subtitle="Rename products or update model and firmware details. Compliance data stays attached.">
      {loading ? (
        <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Loading…</div>
      ) : products.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>No products registered yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(p => <ProductRow key={p._id} product={p} />)}
        </div>
      )}
    </Section>
  );
}

function ProductRow({ product }: { product: any }) {
  const [name, setName]         = useState(product.name || '');
  const [model, setModel]       = useState(product.modelNumber || '');
  const [firmware, setFirmware] = useState(product.firmwareVersion || '');
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');

  const dirty =
    name !== (product.name || '') ||
    model !== (product.modelNumber || '') ||
    firmware !== (product.firmwareVersion || '');

  async function save() {
    setSaving(true); setMessage(''); setError('');
    try {
      const { data } = await api.patch(`/products/${product._id}`, {
        name, modelNumber: model, firmwareVersion: firmware,
      });
      product.name = data.name;
      product.modelNumber = data.modelNumber;
      product.firmwareVersion = data.firmwareVersion;
      setMessage('Saved.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card card-flat" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr auto', gap: 10, alignItems: 'end' }}>
        <div>
          <label className="label">Product Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Model Number</label>
          <input className="input" value={model} onChange={e => setModel(e.target.value)} />
        </div>
        <div>
          <label className="label">Firmware</label>
          <input className="input" value={firmware} onChange={e => setFirmware(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !dirty} style={{ marginBottom: 1 }}>
          {saving ? '…' : 'Save'}
        </button>
      </div>
      <Feedback message={message} error={error} />
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────────────── */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card card-flat" style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '4px 0 0', lineHeight: 1.5 }}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Feedback({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return (
    <div style={{ fontSize: 12, marginTop: 8, color: error ? 'var(--red)' : 'var(--success)' }}>
      {error || message}
    </div>
  );
}
