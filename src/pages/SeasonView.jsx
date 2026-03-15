import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { StarIcon } from '../components/Icons';
import StorageManager from '../services/StorageManager';

const SeasonView = ({ currentUser, onSelectPilot, onBack, onNavigate, onLogout }) => {
  const [pilots, setPilots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPilots = async () => {
      try {
        const allPilots = await StorageManager.getPilotsForVoting();
        const topPilots = allPilots
          .filter(p => p.avgOverall !== undefined && p.avgOverall !== null && p.avgOverall > 0)
          .sort((a, b) => (b.avgOverall || 0) - (a.avgOverall || 0))
          .slice(0, 10);
        setPilots(topPilots.length > 0 ? topPilots : allPilots.slice(0, 10));
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

  const truncateLogline = (text, maxLength = 120) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const stars = Math.round(rating);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} size={14} filled={i < stars} color="#d4a574" emptyColor="rgba(212,165,116,0.2)" />
        ))}
        <span style={{ fontSize: '0.75rem', marginLeft: '0.4rem', color: '#d4a574', fontFamily: '"DM Sans", sans-serif' }}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
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
        }}>The Season</h1>
        <p style={{
          fontSize: '0.95rem', fontWeight: 300,
          color: 'rgba(245,240,235,0.5)', margin: 0
        }}>The highest-rated pilots this season</p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 size={32} style={{ color: '#d4a574', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Pilots List */}
      {!loading && pilots.length > 0 && (
        <div style={{ maxWidth: '800px' }}>
          {pilots.map((pilot) => {
            const thumbnailUrl = getThumbnailUrl(pilot.playbackId);
            return (
              <div
                key={pilot.id}
                onClick={() => onSelectPilot(pilot)}
                style={{
                  display: 'flex', gap: '1.5rem', padding: '1.25rem',
                  backgroundColor: 'rgba(15, 15, 15, 0.8)',
                  border: '1px solid rgba(212, 165, 116, 0.15)',
                  marginBottom: '1rem', cursor: 'pointer',
                  transition: 'all 0.3s ease', borderRadius: '4px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {thumbnailUrl && (
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src={thumbnailUrl}
                      alt={pilot.pilotTitle}
                      style={{ width: '160px', height: '96px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: '1.25rem', fontWeight: 300, color: '#f5f0eb',
                    margin: '0 0 0.5rem 0', letterSpacing: '0.05em'
                  }}>{pilot.pilotTitle}</h3>
                  <p style={{
                    fontSize: '0.85rem', color: 'rgba(245,240,235,0.5)',
                    margin: '0 0 0.75rem 0', lineHeight: 1.5
                  }}>{truncateLogline(pilot.logline)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {pilot.genre && (
                      <span style={{
                        fontSize: '0.7rem', padding: '0.25rem 0.6rem',
                        backgroundColor: 'rgba(212, 165, 116, 0.1)',
                        color: '#d4a574', borderRadius: '2px'
                      }}>{pilot.genre}</span>
                    )}
                    {pilot.creatorName && (
                      <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,235,0.4)' }}>
                        by {pilot.creatorName}
                      </span>
                    )}
                    {pilot.avgOverall > 0 && renderStars(pilot.avgOverall)}
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

export default SeasonView;
