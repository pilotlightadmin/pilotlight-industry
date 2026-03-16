import React, { useEffect, useState } from 'react';
import StorageManager from '../services/StorageManager';

const ViewingRoom = ({ currentUser, onNavigate, onLogout, onSelectPilot }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingSeason, setLoadingSeason] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSeasonClick = async () => {
    setLoadingSeason(true);
    try {
      const pilots = await StorageManager.getPilotsForVoting();
      if (pilots && pilots.length > 0) {
        const randomPilot = pilots[Math.floor(Math.random() * pilots.length)];
        onSelectPilot(randomPilot);
      } else {
        onNavigate('season');
      }
    } catch (err) {
      console.error('Failed to load pilots:', err);
      onNavigate('season');
    } finally {
      setLoadingSeason(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#f5f0eb',
      fontFamily: '"DM Sans", sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.8s ease-in-out'
    }}>
      {/* Pilot Light wordmark — top left, matching landing page */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '2.5rem',
        fontFamily: '"Playfair Display", serif',
        fontSize: '0.95rem',
        fontWeight: 400,
        fontStyle: 'italic',
        color: '#d4a574',
        letterSpacing: '0.15em',
        zIndex: 10
      }}>Pilot Light</div>

      {/* Logout — top right */}
      <button
        onClick={onLogout}
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2.5rem',
          background: 'none',
          border: 'none',
          color: 'rgba(245, 240, 235, 0.4)',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.75rem',
          fontWeight: 300,
          letterSpacing: '0.08em',
          cursor: 'pointer',
          textTransform: 'uppercase',
          padding: '0.5rem 0',
          zIndex: 10
        }}
        onMouseEnter={e => e.target.style.color = 'rgba(245, 240, 235, 0.7)'}
        onMouseLeave={e => e.target.style.color = 'rgba(245, 240, 235, 0.4)'}
      >Logout</button>

      {/* Main Content — centered on page */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: '100vh',
        textAlign: 'center'
      }}>
        <p style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '1.15rem',
          fontWeight: 300,
          color: 'rgba(245, 240, 235, 0.35)',
          margin: '0 0 1.5rem 0',
          lineHeight: 1.7,
          maxWidth: '600px'
        }}>
          Your anonymous contributions are greatly valued.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '400px',
          marginBottom: '3rem'
        }}>
          {/* The Season — Featured Button */}
          <button
            className="roll-hover"
            onClick={handleSeasonClick}
            disabled={loadingSeason}
            style={{
              width: '100%',
              padding: '3rem 2rem',
              border: '1px solid rgba(212, 165, 116, 0.4)',
              backgroundColor: 'rgba(212, 165, 116, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              borderRadius: 0,
              color: '#f5f0eb'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(212, 165, 116, 0.2), inset 0 0 40px rgba(212, 165, 116, 0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.4)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '1.8rem',
              fontWeight: 400,
              margin: '0 0 0.75rem 0',
              color: '#f5f0eb',
              letterSpacing: '0.04em',
              fontStyle: 'italic'
            }}>The Season</h3>
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.85rem',
              fontWeight: 300,
              color: 'rgba(245, 240, 235, 0.5)',
              margin: 0,
              lineHeight: 1.5
            }}>View the slate</p>
          </button>

          {/* All Pilots — Text Link */}
          <button
            className="roll-hover"
            onClick={() => onNavigate('all-pilots')}
            style={{
              marginTop: '1.5rem',
              background: 'none',
              border: 'none',
              color: 'rgba(245, 240, 235, 0.5)',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.9rem',
              fontWeight: 300,
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              padding: '0.5rem 0',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#4ecdc4'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245, 240, 235, 0.5)'; }}
          >
            Browse All Pilots
          </button>
        </div>
      </main>

    </div>
  );
};

export default ViewingRoom;
