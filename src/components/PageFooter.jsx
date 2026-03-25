import React from 'react';

function PageFooter({ onNavigate, currentUser }) {
  const linkStyle = {
    color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '0.82rem', cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif", letterSpacing: '0.03em', transition: 'color 0.2s', fontWeight: 400
  };
  const creatorStatus = currentUser?.creatorStatus || 'none';
  const getCreatorsDestination = () => {
    if (creatorStatus === 'approved') return 'creator-portal';
    if (creatorStatus === 'pending') return 'creator-pending';
    return 'creators-landing';
  };
  return (
    <footer style={{ padding: '2.5rem 2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <span style={linkStyle} onClick={() => onNavigate('terms')}
          onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>Terms</span>
        <span style={linkStyle} onClick={() => onNavigate(getCreatorsDestination())}
          onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>Creators</span>
        <a href="mailto:admin@pilotlighthq.com" style={linkStyle}
          onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>Contact</a>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem', marginTop: '1.25rem', letterSpacing: '0.04em' }}>
        © 2026 Pilot Light. All rights reserved.
      </p>
    </footer>
  );
}

export default PageFooter;
