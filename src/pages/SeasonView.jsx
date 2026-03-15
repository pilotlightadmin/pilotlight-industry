import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import StarIcon from '../components/Icons';
import StorageManager from '../services/StorageManager';

const SeasonView = ({ currentUser, onSelectPilot, onBack, onNavigate, onLogout }) => {
  const [pilots, setPilots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPilots = async () => {
      try {
        const allPilots = await StorageManager.getPilotsForVoting();
        // Sort by avgOverall descending and take top 10
        const topPilots = allPilots
          .filter(p => p.avgOverall !== undefined && p.avgOverall !== null)
          .sort((a, b) => (b.avgOverall || 0) - (a.avgOverall || 0))
          .slice(0, 10);
        setPilots(topPilots);
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

  const truncateLogline = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const stars = Math.round(rating);
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            filled={i < stars}
            className="w-3.5 h-3.5"
          />
        ))}
        <span className="text-xs ml-1" style={{ color: '#d4a574' }}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <div className="mb-12">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
          style={{ color: '#d4a574' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to Viewing Room</span>
        </button>

        <h1
          className="text-5xl font-light mb-3"
          style={{
            fontFamily: 'Cormorant Garamond',
            letterSpacing: '0.15em',
            color: '#f5f0eb'
          }}
        >
          The Season
        </h1>
        <p
          className="text-base font-light"
          style={{
            fontFamily: 'DM Sans',
            color: 'rgba(245,240,235,0.5)'
          }}
        >
          The highest-rated pilots this season
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#d4a574' }} />
        </div>
      )}

      {/* Pilots List */}
      {!loading && pilots.length > 0 && (
        <div className="space-y-4 max-w-4xl">
          {pilots.map((pilot) => {
            const thumbnailUrl = getThumbnailUrl(pilot.playbackId);

            return (
              <div
                key={pilot.id}
                onClick={() => onSelectPilot(pilot)}
                className="cursor-pointer transition-all duration-300 p-4 rounded-lg flex gap-6"
                style={{
                  backgroundColor: 'rgba(15, 15, 15, 0.8)',
                  border: '1px solid rgba(212, 165, 116, 0.15)',
                  borderColor: 'rgba(212, 165, 116, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Thumbnail */}
                {thumbnailUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={thumbnailUrl}
                      alt={pilot.pilotTitle}
                      className="w-40 h-24 object-cover rounded-md"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="96"%3E%3Crect fill="%23222" width="160" height="96"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-lg font-light mb-2 truncate"
                    style={{
                      fontFamily: 'Cormorant Garamond',
                      color: '#f5f0eb'
                    }}
                  >
                    {pilot.pilotTitle}
                  </h3>

                  <p
                    className="text-sm mb-3 line-clamp-2"
                    style={{
                      fontFamily: 'DM Sans',
                      color: 'rgba(245,240,235,0.6)'
                    }}
                  >
                    {truncateLogline(pilot.logline)}
                  </p>

                  <div className="flex items-center gap-4 flex-wrap">
                    {pilot.genre && (
                      <span
                        className="text-xs px-2.5 py-1 rounded"
                        style={{
                          backgroundColor: 'rgba(212, 165, 116, 0.1)',
                          color: '#d4a574',
                          fontFamily: 'DM Sans'
                        }}
                      >
                        {pilot.genre}
                      </span>
                    )}

                    {pilot.creatorName && (
                      <span
                        className="text-xs"
                        style={{
                          color: 'rgba(245,240,235,0.5)',
                          fontFamily: 'DM Sans'
                        }}
                      >
                        by {pilot.creatorName}
                      </span>
                    )}

                    {pilot.avgOverall && renderStars(pilot.avgOverall)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && pilots.length === 0 && (
        <div className="py-16 text-center">
          <p
            className="text-base font-light"
            style={{
              fontFamily: 'DM Sans',
              color: 'rgba(245,240,235,0.4)'
            }}
          >
            No pilots available yet
          </p>
        </div>
      )}
    </div>
  );
};

export default SeasonView;
