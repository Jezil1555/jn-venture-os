import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/settings')
      .then(({ data }) => {
        if (!cancelled) setSettings(data.settings);
      })
      .catch(() => {
        // No hero content is a fine fallback — the button through to the
        // real dashboard still works either way.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = user?.role === 'admin';
  const coreValues = (settings?.core_values || '')
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <div className="home-screen">
      <div className="ledger-rules home-rules" />
      <div className="home-content">
        <img src="/evercrest-logo-full.png" alt="Evercrest Holdings" className="home-logo" />

        <p className="home-greeting">Welcome back, {user?.name?.split(' ')[0]}.</p>

        {settings?.purpose && <p className="home-purpose">{settings.purpose}</p>}

        {settings?.vision && (
          <div className="home-block">
            <div className="home-label">Vision</div>
            <p>{settings.vision}</p>
          </div>
        )}

        {settings?.mission && (
          <div className="home-block">
            <div className="home-label">Mission</div>
            <p>{settings.mission}</p>
          </div>
        )}

        {settings?.promise && (
          <div className="home-promise">
            <span>&ldquo;</span>
            {settings.promise}
          </div>
        )}

        {settings?.brand_story && (
          <div className="home-block">
            <div className="home-label">Our Story</div>
            <p>{settings.brand_story}</p>
          </div>
        )}

        {coreValues.length > 0 && (
          <div className="home-values">
            {coreValues.map((v) => (
              <span className="home-value-tag" key={v}>
                {v}
              </span>
            ))}
          </div>
        )}

        <button type="button" className="home-cta" onClick={() => navigate('/dashboard/overview')}>
          {isAdmin ? 'View Dashboard' : 'View Your Portfolio'}
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  );
}
