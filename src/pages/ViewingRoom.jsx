import React, { useEffect, useState } from 'react';
import { FlameIcon } from '../components/Icons';

const ViewingRoom = ({ currentUser, onNavigate, onLogout }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2rem 3rem',
        borderBottom: '1px solid rgba(212, 165, 116, 0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FlameIcon size={20} />
          <h1 style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '0.95rem',
            fontWeight: 300,
            letterSpacing: '0.15em',
            margin: 0,
            textTransform: 'uppercase',
            color: '#f5f0eb'
          }}>The Viewing Room</h1>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(245, 240, 235, 0.4)',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.75rem',
            fontWeight: 300,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            textTransform: 'uppercase',
            padding: '0.5rem 0'
          }}
          onMouseEnter={e => e.target.style.color = 'rgba(245, 240, 235, 0.7)'}
          onMouseLeave={e => e.target.style.color = 'rgba(245, 240, 235, 0.4)'}
        >Logout</button>
      </header>

      {/* Main Content */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 140px)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '2.5rem',
          fontWeight: 300,
          margin: '0 0 2rem 0',
          color: '#f5f0eb',
          lineHeight: 1.2
        }}>Welcome to the Viewing Room</h2>

        <p style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.95rem',
          fontWeight: 300,
          color: 'rgba(245, 240, 235, 0.5)',
          margin: '0 0 3rem 0',
          lineHeight: 1.7,
          maxWidth: '600px'
        }}>
          Watch. Rate. Comment. Your anonymous feedback helps discover the next generation of television. Browse the current season's top-rated pilots or explore the full collection.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2rem',
          width: '100%',
          maxWidth: '600px',
          marginBottom: '3rem'
        }}>
          {/* The Season Card */}
          <button
            onClick={() => onNavigate('season')}
            style={{
              padding: '2.5rem 2rem',
              border: '1px solid rgba(212, 165, 116, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              borderRadius: 0,
              color: '#f5f0eb'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 165, 116, 0.15), inset 0 0 30px rgba(212, 165, 116, 0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '1.5rem',
              fontWeight: 300,
              margin: '0 0 0.75rem 0',
              color: '#f5f0eb',
              letterSpacing: '0.08em'
            }}>The Season</h3>
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.85rem',
              fontWeight: 300,
              color: 'rgba(245, 240, 235, 0.5)',
              margin: 0,
              lineHeight: 1.5
            }}>Top-rated pilots, curated for your review</p>
          </button>

          {/* All Pilots Card */}
          <button
            onClick={() => onNavigate('all-pilots')}
            style={{
              padding: '2.5rem 2rem',
              border: '1px solid rgba(212, 165, 116, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              borderRadius: 0,
              color: '#f5f0eb'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 165, 116, 0.15), inset 0 0 30px rgba(212, 165, 116, 0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '1.5rem',
              fontWeight: 300,
              margin: '0 0 0.75rem 0',
              color: '#f5f0eb',
              letterSpacing: '0.08em'
            }}>All Pilots</h3>
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.85rem',
              fontWeight: 300,
              color: 'rgba(245, 240, 235, 0.5)',
              margin: 0,
              lineHeight: 1.5
            }}>Explore the full collection</p>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        borderTop: '1px solid rgba(212, 165, 116, 0.1)',
        color: 'rgba(245, 240, 235, 0.3)',
        fontSize: '0.75rem',
        fontWeight: 300,
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }}>Pilot Light</footer>
    </div>
  );
};

export default ViewingRoom;
