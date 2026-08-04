import React from 'react';
import './BrandLockup.css';

// Renders the logo as: monogram icon (raster, high-res) + "EVERCREST /
// HOLDINGS" as real text. Text is used instead of baking it into the image
// so it's always crisp at any size and adapts color to light or dark
// backgrounds via CSS, rather than needing a separate image per context.
export default function BrandLockup({ size = 'md', tagline, dark = true }) {
  return (
    <div className={`brand-lockup brand-lockup-${size} ${dark ? 'on-dark' : 'on-light'}`}>
      <img src="/evercrest-mark.png" alt="Evercrest Holdings" className="brand-lockup-icon" />
      <div className="brand-lockup-name">EVERCREST</div>
      <div className="brand-lockup-holdings">
        <span className="rule" />
        <span>HOLDINGS</span>
        <span className="rule" />
      </div>
      {tagline && <div className="brand-lockup-tagline">{tagline}</div>}
    </div>
  );
}
