import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

export default function Login() {
  const { user, login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const dest = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={dest} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) {
      navigate('/dashboard', { replace: true });
    }
  }

  return (
    <div className="login-screen">
      <div className="login-brand">
        <div className="ledger-rules" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div className="login-brand-mark">
          <img src="/evercrest-logo-full.png" alt="Evercrest Holdings" className="login-logo" />
        </div>
        <p className="login-brand-tag">
          Every decision protects trust before profit.
        </p>
        <div className="login-brand-foot">Holding Company Operations</div>
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Sign in</h1>
          <p className="lede">Enter your credentials to open your ledger.</p>

          {error && <div className="form-error">{error}</div>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          {import.meta.env.DEV && (
            <div className="login-hint">
              Local dev seed accounts (run <code>database/seed.sql</code> first):
              <br />
              admin&nbsp;&mdash;&nbsp;<code>admin@jnventures.test</code> / <code>Passw0rd!</code>
              <br />
              investor&nbsp;&mdash;&nbsp;<code>investor@jnventures.test</code> / <code>Passw0rd!</code>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
