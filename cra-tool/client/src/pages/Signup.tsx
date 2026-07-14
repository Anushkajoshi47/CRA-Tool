import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Signup() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('email', res.data.email);
      localStorage.setItem('name', res.data.name || '');
      localStorage.setItem('orgName', res.data.orgName || '');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="fade-up" style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(0,200,200,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L13.5 4v4.5c0 3.5-2.5 6-5.5 6.5-3-.5-5.5-3-5.5-6.5V4z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M5.5 8.5l2 2 3.5-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>CRA Comply</div>
            <div style={{ fontSize: '10px', color: 'var(--text-2)', fontWeight: 500, letterSpacing: '0.04em' }}>Innomotics GH180</div>
          </div>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '6px' }}>Create account</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-2)', marginBottom: '28px' }}>Start tracking GH180 CRA compliance.</p>

          {error && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--red)', fontSize: '12.5px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Email Address', type: 'email',    value: email,    set: setEmail,    placeholder: 'name@company.com',   autoFocus: true },
              { label: 'Password',      type: 'password', value: password, set: setPassword, placeholder: 'Min. 8 characters' },
              { label: 'Confirm Password', type: 'password', value: confirm, set: setConfirm, placeholder: 'Repeat password' },
            ].map((f, i) => (
              <div key={f.label} style={{ marginBottom: i === 2 ? '22px' : '14px' }}>
                <label className="label">{f.label}</label>
                <input className="input" type={f.type} value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder} required autoFocus={f.autoFocus} />
              </div>
            ))}
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '13.5px' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: '22px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-2)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--text-3)' }}>
          EU Cyber Resilience Act — Regulation (EU) 2024/2847
        </div>
      </div>
    </div>
  );
}
