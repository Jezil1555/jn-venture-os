import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import BrandLockup from '../components/BrandLockup.jsx';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/settings')
      .then(({ data }) => {
        if (!cancelled) setSettings(data.settings);
      })
      .catch(() => {
        // No slides is a fine fallback — the button through to the real
        // dashboard still works either way.
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

  // Build slides only from fields that actually have content, so an
  // empty field just doesn't get a slide rather than showing blank.
  const slides = [
    settings?.purpose && { label: 'Purpose', body: <p>{settings.purpose}</p> },
    settings?.vision && { label: 'Vision', body: <p>{settings.vision}</p> },
    settings?.mission && { label: 'Mission', body: <p>{settings.mission}</p> },
    settings?.promise && {
      label: 'Promise',
      body: <p className="home-slide-quote">&ldquo;{settings.promise}&rdquo;</p>,
    },
    settings?.brand_story && { label: 'Our Story', body: <p>{settings.brand_story}</p> },
    coreValues.length > 0 && {
      label: 'Core Values',
      body: (
        <div className="home-values">
          {coreValues.map((v) => (
            <span className="home-value-tag" key={v}>
              {v}
            </span>
          ))}
        </div>
      ),
    },
  ].filter(Boolean);

  const current = slides[slideIndex];

  function goPrev() {
    setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  }
  function goNext() {
    setSlideIndex((i) => (i + 1) % slides.length);
  }

  return (
    <div className="home-screen">
      <div className="ledger-rules home-rules" />
      <div className="home-content">
        <BrandLockup size="md" dark />

        <p className="home-greeting">Welcome back, {user?.name?.split(' ')[0]}.</p>

        {slides.length > 0 && (
          <div className="home-carousel">
            <button
              type="button"
              className="home-carousel-arrow"
              onClick={goPrev}
              aria-label="Previous"
              disabled={slides.length < 2}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="home-slide">
              <div className="home-label">{current.label}</div>
              {current.body}
            </div>

            <button
              type="button"
              className="home-carousel-arrow"
              onClick={goNext}
              aria-label="Next"
              disabled={slides.length < 2}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {slides.length > 1 && (
          <div className="home-dots">
            {slides.map((s, i) => (
              <button
                key={s.label}
                type="button"
                className={`home-dot ${i === slideIndex ? 'active' : ''}`}
                onClick={() => setSlideIndex(i)}
                aria-label={`Go to ${s.label}`}
              />
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
