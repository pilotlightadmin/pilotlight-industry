import React, { useState, useEffect } from 'react';
import StorageManager from '../services/StorageManager';
import { getResubmissionTagStyle } from '../utils/badges';

function ArchivedVersionsModal({ pilot, onClose, onSelectVersion }) {
  const [archivedVersions, setArchivedVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArchivedVersions = async () => {
      setLoading(true);
      try {
        // Get all pilots including hidden ones
        const allPilots = await StorageManager.getPilots();
        const versions = [];

        // Follow the previousVersionId chain
        let currentId = pilot.previousVersionId;
        while (currentId) {
          const prevPilot = allPilots.find(p => p.id === currentId);
          if (prevPilot) {
            versions.push(prevPilot);
            currentId = prevPilot.previousVersionId;
          } else {
            break;
          }
        }
        setArchivedVersions(versions);
      } catch (err) {
        console.error('Error loading archived versions:', err);
      }
      setLoading(false);
    };
    loadArchivedVersions();
  }, [pilot.previousVersionId]);

  return React.createElement('div', {
    style: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    },
    onClick: onClose
  },
    React.createElement('div', {
      style: {
        background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 100%)',
        borderRadius: '20px', padding: '2rem', maxWidth: '600px', width: '100%',
        maxHeight: '80vh', overflowY: 'auto',
        border: '1px solid rgba(78,205,196,0.3)'
      },
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { style: { marginBottom: '1.5rem' } },
        React.createElement('h2', {
          style: { fontSize: '1.5rem', fontWeight: '700', color: '#4ecdc4', marginBottom: '0.5rem' }
        }, 'Version History'),
        React.createElement('p', {
          style: { color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }
        }, `Viewing archived versions of "${pilot.pilotTitle}"`)
      ),
      React.createElement('div', { style: { marginBottom: '1.5rem', padding: '1rem', background: 'rgba(78,205,196,0.1)', borderRadius: '12px', border: '1px solid rgba(78,205,196,0.2)' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' } },
          React.createElement('span', { style: { background: '#4ecdc4', color: '#0a0a0a', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '700' } }, 'CURRENT'),
          React.createElement('span', { style: { color: '#fff', fontWeight: '600' } }, `Version ${pilot.version || 1}`)
        ),
        React.createElement('p', { style: { color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' } }, pilot.pilotTitle)
      ),
      loading ?
        React.createElement('div', { style: { textAlign: 'center', padding: '2rem' } },
          React.createElement('p', { style: { color: 'rgba(255,255,255,0.6)' } }, 'Loading archived versions...')
        ) :
        archivedVersions.length === 0 ?
          React.createElement('p', { style: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '1rem' } }, 'No archived versions found.') :
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
            archivedVersions.map((archivedPilot, index) => {
              const versionNum = (pilot.version || 2) - index - 1;
              const tagStyle = getResubmissionTagStyle(versionNum);
              return React.createElement('div', {
                key: archivedPilot.id,
                style: {
                  background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem',
                  border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                },
                onClick: () => onSelectVersion && onSelectVersion(archivedPilot),
                onMouseOver: (e) => { e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; },
                onMouseOut: (e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }
              },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem' } },
                  archivedPilot.playbackId && React.createElement('img', {
                    src: `https://image.mux.com/${archivedPilot.playbackId}/thumbnail.png?width=120`,
                    style: { width: '80px', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px' }
                  }),
                  React.createElement('div', { style: { flex: 1 } },
                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' } },
                      React.createElement('span', {
                        style: {
                          background: tagStyle ? tagStyle.background : 'rgba(255,255,255,0.2)',
                          color: tagStyle ? tagStyle.color : '#fff',
                          padding: '0.15rem 0.4rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700'
                        }
                      }, `V${versionNum}`),
                      React.createElement('span', { style: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' } }, 'Archived')
                    ),
                    React.createElement('p', { style: { color: '#fff', margin: '0 0 0.25rem', fontWeight: '600', fontSize: '0.9rem' } }, archivedPilot.pilotTitle),
                    React.createElement('p', {
                      style: { color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.8rem',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
                    }, archivedPilot.logline)
                  )
                )
              );
            })
          ),
      React.createElement('button', {
        onClick: onClose,
        style: {
          marginTop: '1.5rem', width: '100%', padding: '0.875rem',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '10px', color: '#fff', fontSize: '1rem', cursor: 'pointer'
        }
      }, 'Close')
    )
  );
}

export default ArchivedVersionsModal;
