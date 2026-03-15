import React from 'react';

function PageFooter({ onNavigate, currentUser }) {
  const linkStyle = { color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem', cursor: 'pointer' };
  const creatorStatus = currentUser?.creatorStatus || 'none';
  const getCreatorsDestination = () => {
    if (creatorStatus === 'approved') return 'creator-portal';
    if (creatorStatus === 'pending') return 'creator-pending';
    return 'creators-landing';
  };
  return (
    <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <span style={linkStyle} onClick={() => onNavigate('about')}>About</span>
        <span style={linkStyle} onClick={() => onNavigate('privacy')}>Privacy</span>
        <span style={linkStyle} onClick={() => onNavigate('terms')}>Terms</span>
        <span style={linkStyle} onClick={() => onNavigate(getCreatorsDestination())}>Creators</span>
        <a href="mailto:admin@pilotlighthq.com" style={linkStyle}>Contact</a>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '1rem' }}>
        © 2026 Pilot Light. All rights reserved.
      </p>
    </footer>
  );
}

export default PageFooter;
