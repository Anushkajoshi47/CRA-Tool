import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import s from './Auth.module.css';

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

        <div className={`card ${s.card}`}>
          <h1 className={s.title}>Create account</h1>
          <p className={s.subtitle}>Start tracking GH180 CRA compliance.</p>

          {error && <div className={s.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Email Address', type: 'email',    value: email,    set: setEmail,    placeholder: 'name@company.com',   autoFocus: true },
              { label: 'Password',      type: 'password', value: password, set: setPassword, placeholder: 'Min. 8 characters' },
              { label: 'Confirm Password', type: 'password', value: confirm, set: setConfirm, placeholder: 'Repeat password' },
            ].map((f, i) => (
              <div key={f.label} className={i === 2 ? s.fieldLast : s.field}>
                <label className="label">{f.label}</label>
                <input className="input" type={f.type} value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder} required autoFocus={f.autoFocus} />
              </div>
            ))}
            <button type="submit" className={`btn btn-primary ${s.submit}`} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className={s.footer}>
            Already have an account?{' '}
            <Link to="/login" className={s.footerLink}>Sign in</Link>
          </div>
        </div>

        <div className={s.legal}>EU Cyber Resilience Act — Regulation (EU) 2024/2847</div>
      </div>
    </div>
  );
}
