import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>404</h1>
        <p style={{ color: 'var(--slate)', marginBottom: '1.5rem' }}>That page doesn&rsquo;t exist.</p>
        <Link to="/dashboard" style={{ color: 'var(--brass)' }}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
