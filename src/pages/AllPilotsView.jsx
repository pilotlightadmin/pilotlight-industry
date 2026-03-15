import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import StorageManager from '../services/StorageManager';

const AllPilotsView = ({ currentUser, onSelectPilot, onBack, onNavigate, onLogout }) => {
  const [pilots, setPilots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPilots = async () => {
      try {
        const allPilots = await StorageManager.getPilotsForVoting();
        setPilots(allPilots);
      } catch (error) {
        console.error('Failed to load pilots:', error);
        setPilots([]);
      } finally {
        setLoading(false);
      }
    };
    loadPilots();
  }, []);

  const getThumbnailUrl = (playbackId) => {
    if (!playbackId) return null;
    return `https://image.mux.com/${playbackId}/thumbnail.png`;
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', padding: '2rem 3rem', fontFamily: '"DM Sans", sans-serif', color: '#f5f0eb' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1.5rem', background: 'none', border: 'none',
            color: '#d4a574', cursor: 'pointer', fontSize: '0.85rem',
            fontFamily: '"DM Sans", sans-serif', padding: 0
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <ArrowLeft size={18} />
          <span>Back to Viewing Room</span>
        </button>

        <h1 style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '2.8rem', fontWeight: 300, letterSpacing: '0.15em',
          color: '#f5f0eb', margin: '0 0 0.75rem 0'
        }}>All Pilots</h1>
        <p style={{
          fontSize: '0.95rem', fontWeight: 300,
          color: 'rgba(245,240,235,0.5)', margin: 0
        }}>The complete collection</p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 size={32} style={{ color: '#d4a574', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Pilots Grid */}
      {!loading && pilots.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px'
        }}>
          {pilots.map((pilot) => {
            const thumbnailUrl = getThumbnailUrl(pilot.playbackId);
            return (
              <div
                key={pilot.id}
                onClick={() => onSelectPilot(pilot)}
                style={{
                  backgroundColor: 'rgba(15, 15, 15, 0.8)',
                  border: '1px solid rgba(212, 165, 116, 0.15)',
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  overflow: 'hidden', borderRadius: '4px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {thumbnailUrl && (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                    <img
                      src={thumbnailUrl}
                      alt={pilot.pilotTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: '1.15rem', fontWeight: 300, color: '#f5f0eb',
                    margin: '0 0 0.5rem 0', letterSpacing: '0.05em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>{pilot.pilotTitle}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {pilot.genre && (
                      <span style={{
                        fontSize: '0.7rem', padding: '0.2rem 0.5rem',
                        backgroundColor: 'rgba(212, 165, 116, 0.1)',
                        color: '#d4a574', borderRadius: '2px'
                      }}>{pilot.genre}</span>
                    )}
                    {pilot.creatorName && (
                      <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,235,0.4)' }}>
                        {pilot.creatorName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && pilots.length === 0 && (
        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 300, color: 'rgba(245,240,235,0.4)' }}>
            No pilots available yet
          </p>
        </div>
      )}
    </div>
  );
};

export default AllPilotsView;
