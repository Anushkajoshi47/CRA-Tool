import React, { useEffect, useState } from 'react';
import api from '../api';
import { getTheme, applyTheme, ThemeMode } from '../shared/theme';
import { Stack, Row, Grid } from '../components/primitives/layout';
import s from './Settings.module.css';

export default function Settings() {
  return (
    <div className={s.page}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Account</div>
        <h1 className={s.title}>Settings</h1>
        <p className={s.subtitle}>Manage your profile, appearance, and product registry.</p>
      </div>

      <Stack gap={6}>
        <ProfileSection />
        <PasswordSection />
        <AppearanceSection />
        <ProductsSection />
      </Stack>
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
      <Stack as="form" gap={3} onSubmit={save}>
        <div className={s.grid2}>
          <div>
            <label className="label">Display Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Anushka Joshi" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className={`input ${s.emailDisabled}`} value={email} disabled />
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
      </Stack>
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
      <Stack as="form" gap={3} onSubmit={save}>
        <div className={s.grid3}>
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
      </Stack>
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
      <Grid cols={2} gap={3}>
        {OPTIONS.map(o => {
          const active = mode === o.value;
          return (
            <button key={o.value} onClick={() => choose(o.value)} className={`card card-flat ${s.themeCard}`} data-active={active}>
              <Row gap={2} style={{ marginBottom: 'var(--space-1)' }}>
                <span className={s.themeDot} data-active={active} />
                <span className={s.themeLabel}>{o.label}</span>
              </Row>
              <div className={s.themeDesc}>{o.desc}</div>
            </button>
          );
        })}
      </Grid>
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
        <div className={s.muted}>Loading…</div>
      ) : products.length === 0 ? (
        <div className={s.muted}>No products registered yet.</div>
      ) : (
        <Stack gap={3}>
          {products.map(p => <ProductRow key={p._id} product={p} />)}
        </Stack>
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
    <div className={`card card-flat ${s.productRow}`}>
      <div className={s.productGrid}>
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
    <section className={`card card-flat ${s.section}`}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>{title}</h2>
        {subtitle && <p className={s.sectionSub}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Feedback({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return (
    <div className={`${s.feedback} ${error ? s.feedbackError : s.feedbackOk}`}>
      {error || message}
    </div>
  );
}
