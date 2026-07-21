import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import s from './Auth.module.css';

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
    <div className={s.page}>
      <div className={`fade-up ${s.wrap}`}>
        {/* Logo */}
        <div className={s.logoRow}>
          <div className={s.logoBox}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L13.5 4v4.5c0 3.5-2.5 6-5.5 6.5-3-.5-5.5-3-5.5-6.5V4z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M5.5 8.5l2 2 3.5-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className={s.logoName}>CRA Comply</div>
            <div className={s.logoSub}>Innomotics GH180</div>
          </div>
        </div>

        {/* Card */}
        <div className={`card ${s.card}`}>
          <h1 className={s.title}>Sign in</h1>
          <p className={s.subtitle}>Access your compliance workspace.</p>

          {error && <div className={s.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={s.field}>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com" required autoFocus />
            </div>
            <div className={s.fieldLast}>
              <label className="label">Password</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password" required />
            </div>
            <button type="submit" className={`btn btn-primary ${s.submit}`} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className={s.footer}>
            No account?{' '}
            <Link to="/signup" className={s.footerLink}>Create one</Link>
          </div>
        </div>

        <div className={s.legal}>EU Cyber Resilience Act — Regulation (EU) 2024/2847</div>
      </div>
    </div>
  );
}
