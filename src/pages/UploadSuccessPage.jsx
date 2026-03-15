import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Icon } from '../components/Icons';

function UploadSuccessPage({ onHome, onCreatorPortal }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <Icon component={CheckCircle2} style={{ width: '80px', height: '80px', color: '#4ecdc4', marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', color: '#4ecdc4' }}>Thank You for Your Pitch!</h1>
        <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '2.5rem' }}>
          The Pilot Light community is excited to review your materials!
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onCreatorPortal}
            style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
              border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>
            View My Pilots
          </button>
          <button onClick={onHome}
            style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadSuccessPage;
