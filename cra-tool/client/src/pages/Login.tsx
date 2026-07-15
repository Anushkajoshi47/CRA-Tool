import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('email', res.data.email);
      localStorage.setItem('name', res.data.name || '');
      localStorage.setItem('orgName', res.data.orgName || '');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: 'var(--full-h)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      {/* Ambient glow handled by body::before */}

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

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '6px' }}>Sign in</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-2)', marginBottom: '28px' }}>Access your compliance workspace.</p>

          {error && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--red)', fontSize: '12.5px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com" required autoFocus />
            </div>
            <div style={{ marginBottom: '22px' }}>
              <label className="label">Password</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '13.5px' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: '22px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-2)', textAlign: 'center' }}>
            No account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--text-3)' }}>
          EU Cyber Resilience Act — Regulation (EU) 2024/2847
        </div>
      </div>
    </div>
  );
}
