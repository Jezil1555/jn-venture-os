import React, { useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/ui.css';

export default function Account() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/profile', profileForm);
      updateUser(data.user);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Could not save your profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Could not change your password.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Account</div>
          <h1>{user?.name}</h1>
          <p className="lede">{user?.email}</p>
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 420, marginBottom: '1.5rem' }}>
        <div className="section-title">Profile</div>
        <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0 0 1rem' }}>
          Your name is what everyone sees across the app — including the "Welcome back" greeting.
          Your email is what you log in with.
        </p>

        {profileError && <div className="banner-error">{profileError}</div>}
        {profileSuccess && (
          <div
            style={{
              background: '#e5f0ea',
              color: 'var(--positive)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--step-sm)',
              marginBottom: '1.25rem',
            }}
          >
            Saved.
          </div>
        )}

        <form className="form-grid" onSubmit={handleProfileSubmit}>
          <div className="field">
            <label htmlFor="profileName">Name</label>
            <input
              id="profileName"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="profileEmail">Email</label>
            <input
              id="profileEmail"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              required
            />
            <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0.35rem 0 0' }}>
              Use your real email here — the app doesn't send mail to it, it's just your login ID.
            </p>
          </div>
          <button className="btn btn-dark" type="submit" disabled={savingProfile} style={{ width: 'fit-content' }}>
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="card card-pad" style={{ maxWidth: 420 }}>
        <div className="section-title">Change Password</div>

        {passwordError && <div className="banner-error">{passwordError}</div>}
        {passwordSuccess && (
          <div
            style={{
              background: '#e5f0ea',
              color: 'var(--positive)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--step-sm)',
              marginBottom: '1.25rem',
            }}
          >
            Password changed. Use it next time you sign in.
          </div>
        )}

        <form className="form-grid" onSubmit={handlePasswordSubmit}>
          <div className="field">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              minLength={8}
              required
            />
          </div>
          <button className="btn btn-dark" type="submit" disabled={savingPassword} style={{ width: 'fit-content' }}>
            {savingPassword ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
