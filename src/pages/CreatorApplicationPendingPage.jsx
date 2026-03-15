import React from 'react';

function CreatorApplicationPendingPage({ onBrowse, onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ background: 'rgba(254,202,87,0.15)', border: '1px solid rgba(254,202,87,0.3)', borderRadius: '16px', padding: '2.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Application Under Review</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '1.5rem' }}>Thanks for applying! We're reviewing your submission and will get back to you within 48 hours. You'll receive an email when your status is updated.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </button>
            <button onClick={onBrowse} style={{ padding: '0.875rem 1.5rem', background: 'linear-gradient(135deg, #4ecdc4, #44a08d)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '1rem', cursor: 'pointer', fontWeight: '600' }}>
              Browse Pilots
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatorApplicationPendingPage;
