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
          All Pilots
        </h1>
        <p
          className="text-base font-light"
          style={{
            fontFamily: 'DM Sans',
            color: 'rgba(245,240,235,0.5)'
          }}
        >
          The complete collection
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#d4a574' }} />
        </div>
      )}

      {/* Pilots Grid */}
      {!loading && pilots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
          {pilots.map((pilot) => {
            const thumbnailUrl = getThumbnailUrl(pilot.playbackId);

            return (
              <div
                key={pilot.id}
                onClick={() => onSelectPilot(pilot)}
                className="cursor-pointer transition-all duration-300 overflow-hidden rounded-lg"
                style={{
                  backgroundColor: 'rgba(15, 15, 15, 0.8)',
                  border: '1px solid rgba(212, 165, 116, 0.15)',
                  borderTopLeftRadius: '0.5rem',
                  borderTopRightRadius: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Thumbnail */}
                {thumbnailUrl && (
                  <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={thumbnailUrl}
                      alt={pilot.pilotTitle}
                      className="w-full h-full object-cover"
                      style={{
                        borderTopLeftRadius: '0.5rem',
                        borderTopRightRadius: '0.5rem'
                      }}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect fill="%23222" width="400" height="225"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3
                    className="text-lg font-light mb-2 truncate"
                    style={{
                      fontFamily: 'Cormorant Garamond',
                      color: '#f5f0eb'
                    }}
                  >
                    {pilot.pilotTitle}
                  </h3>

                  <div className="flex items-center gap-2 flex-wrap">
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

export default AllPilotsView;
