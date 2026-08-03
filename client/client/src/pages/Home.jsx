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

  return (
    <div className="home-screen">
      <div className="ledger-rules home-rules" />
      <div className="home-content">
        <img src="/evercrest-logo-full.png" alt="Evercrest Holdings" className="home-logo" />

        <p className="home-greeting">Welcome back, {user?.name?.split(' ')[0]}.</p>

        {settings?.brand_story && (
          <div className="home-block">
            <div className="home-label">Our Story</div>
            <p>{settings.brand_story}</p>
          </div>
        )}

        {settings?.vision && (
          <div className="home-block">
            <div className="home-label">Our Vision</div>
            <p>{settings.vision}</p>
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
