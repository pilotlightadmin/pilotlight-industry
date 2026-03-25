import React, { useState, useEffect } from 'react';
import StorageManager from '../services/StorageManager';
import VideoModal from '../components/VideoModal';
import PageFooter from '../components/PageFooter';
import { getCreatorBadges, CreatorBadgeIcon } from '../utils/badges';
import { FlameIcon, AnimatedFlameIcon, Icon } from '../components/Icons';
import LoginModal from './LoginModal';

function BrowsePage({ currentUser, onLogout, onSelectPilot, onLogin, onNavigate }) {
  const [allPilots, setAllPilots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginModalMode, setLoginModalMode] = useState(null);
  const [selectedPilotModal, setSelectedPilotModal] = useState(null);
  const [viewedPilotsSession, setViewedPilotsSession] = useState(new Set());
  const [votedPilotIds, setVotedPilotIds] = useState(new Set());
  const [seasonStarted, setSeasonStarted] = useState(false);
  const [seasonComplete, setSeasonComplete] = useState(false);
  const [selectedCreatorProfile, setSelectedCreatorProfile] = useState(null);
  const [creatorsCache, setCreatorsCache] = useState({});
  const [hoveredBtn, setHoveredBtn] = useState(null);

  // Load user's voted pilots
  useEffect(() => {
    if (currentUser?.id) {
      StorageManager.getVoterVotes(currentUser.id).then(votes => {
        const pilotIds = new Set(votes.map(v => Array.isArray(v.pilotId) ? v.pilotId[0] : v.pilotId));
        setVotedPilotIds(pilotIds);
      }).catch(err => console.error('Error loading voted pilots:', err));
    } else {
      setVotedPilotIds(new Set());
    }
  }, [currentUser?.id]);

  // Load pilots
  useEffect(() => {
    const loadPilots = async () => {
      try {
        const pilots = await StorageManager.getPilotsForVoting();
        if (pilots && pilots.length > 0) {
          setAllPilots(pilots);
        } else {
          throw new Error('No pilots returned');
        }
      } catch (err) {
        console.error('Error loading pilots, using mock data:', err);
        // DEV: Mock pilots when Airtable is unavailable
        setAllPilots([
          { id: 'mock-1', pilotTitle: 'The Last Roommate', genre: 'Comedy', logline: 'Three strangers share an apartment and discover they all dated the same person.', playbackId: null, creatorName: 'Jordan Lee', creatorUserId: 'creator-1', stats: { totalVotes: 12, avgOverall: 4.2 }, createdAt: '2026-03-01' },
          { id: 'mock-2', pilotTitle: 'Midnight Frequency', genre: 'Drama', logline: 'A late-night radio host receives calls from listeners who seem to know the future.', playbackId: null, creatorName: 'Sam Rivera', creatorUserId: 'creator-2', stats: { totalVotes: 8, avgOverall: 3.9 }, createdAt: '2026-03-10' },
          { id: 'mock-3', pilotTitle: 'Flip the Script', genre: 'Reality TV', logline: 'Aspiring screenwriters pitch to real Hollywood execs with a twist — the execs have to act out the scenes.', playbackId: null, creatorName: 'Alex Chen', creatorUserId: 'creator-3', stats: { totalVotes: 5, avgOverall: 4.5 }, createdAt: '2026-03-15' },
        ]);
      }
      setLoading(false);
    };
    loadPilots();
  }, []);

  // Get next unviewed pilot in the season
  const getNextPilot = () => {
    const unviewed = allPilots.filter(p =>
      p.id !== selectedPilotModal?.id &&
      !viewedPilotsSession.has(p.id)
    );
    if (unviewed.length > 0) {
      return { pilot: unviewed[0], source: 'season' };
    }
    return { pilot: null, allViewed: true };
  };

  // Start the season — pick first unviewed pilot
  const startSeason = () => {
    const unviewed = allPilots.filter(p => !viewedPilotsSession.has(p.id));
    if (unviewed.length > 0) {
      setSelectedPilotModal(unviewed[0]);
      setViewedPilotsSession(prev => new Set([...prev, unviewed[0].id]));
      setSeasonStarted(true);
      setSeasonComplete(false);
    }
  };

  // Creator profile
  const openCreatorProfile = async (creatorUserId, e) => {
    if (e) e.stopPropagation();
    if (creatorsCache[creatorUserId]) {
      setSelectedCreatorProfile(creatorsCache[creatorUserId]);
      return;
    }
    try {
      const voters = await StorageManager.getVoters();
      const creator = voters.find(v => v.id === creatorUserId);
      if (creator) {
        const creatorPilots = allPilots.filter(p => p.creatorUserId === creatorUserId);
        const creatorData = { ...creator, pilots: creatorPilots };
        setCreatorsCache(prev => ({ ...prev, [creatorUserId]: creatorData }));
        setSelectedCreatorProfile(creatorData);
      }
    } catch (err) {
      console.error('Error loading creator profile:', err);
    }
  };

  // Creator Profile Modal
  const CreatorProfileModal = ({ creator, onClose }) => {
    if (!creator) return null;
    const displayName = creator.displayName || creator.username || creator.name;
    const joinDate = creator.createdAt ? new Date(creator.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';
    const getAboutMe = () => {
      if (creator.aboutMe) return creator.aboutMe;
      try {
        const app = typeof creator.creatorApplication === 'string' ? JSON.parse(creator.creatorApplication) : creator.creatorApplication;
        return app?.describes || '';
      } catch (e) { return ''; }
    };
    const aboutMe = getAboutMe();

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        onClick={onClose}>
        <div style={{ background: 'linear-gradient(145deg, rgba(18,18,18,0.95) 0%, rgba(12,12,12,0.95) 100%)', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ position: 'sticky', top: 0, background: 'rgba(12,12,12,0.95)', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Creator Profile</h2>
            <button onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem' }}>×</button>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>
                {(displayName || '?')[0].toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                  {displayName}
                  {getCreatorBadges(creator.id, allPilots).map(b => <CreatorBadgeIcon key={b.key} badge={b} />)}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>Member since {joinDate}</p>
              </div>
            </div>
            {aboutMe && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>About</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{aboutMe}</p>
              </div>
            )}
            {creator.pilots && creator.pilots.length > 0 && (
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Pilots</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {creator.pilots.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.playbackId ? (
                        <img src={`https://image.mux.com/${p.playbackId}/thumbnail.png?width=100`} style={{ width: '50px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} alt={p.pilotTitle} />
                      ) : (
                        <div style={{ width: '50px', height: '28px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#fff' }}>{p.pilotTitle}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{p.genre}</div>
                      </div>
                      {p.stats && p.stats.totalVotes > 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#feca57', fontWeight: 600 }}>★ {p.stats.avgOverall.toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const pilotsViewed = viewedPilotsSession.size;
  const totalPilots = allPilots.length;
  const pilotsRemaining = totalPilots - pilotsViewed;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', fontFamily: "'Outfit', sans-serif" }}>
        <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');` }} />
        <AnimatedFlameIcon size={64} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', fontFamily: "'Outfit', sans-serif", color: '#fff' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes subtlePulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
      ` }} />

      {/* Header */}
      <header style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }} onClick={() => onNavigate('browse')}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #4ecdc4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Pilot Light</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
          {currentUser ? (
            <span onClick={() => onNavigate('account')} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>{currentUser.name}</span>
          ) : (
            <span onClick={() => setLoginModalMode('login')} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>Login</span>
          )}
        </nav>
      </header>

      {/* Main content — Season view */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', marginTop: '-3rem' }}>

        {/* Flame icon */}
        <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.6s ease-out' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
            <defs>
              <linearGradient id="browseFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="50%" stopColor="#feca57" />
                <stop offset="100%" stopColor="#fff5cc" />
              </linearGradient>
            </defs>
            <path fill="none" stroke="url(#browseFlameGrad)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
              d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        </div>

        <div style={{ marginBottom: '2.5rem' }} />

        {/* Progress — show if season started */}
        {seasonStarted && pilotsViewed > 0 && (
          <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              {seasonComplete ? 'Season Complete' : `${pilotsViewed} of ${totalPilots} viewed`}
            </div>
            <div style={{ width: '200px', height: '2px', background: 'rgba(255,255,255,0.08)', borderRadius: '1px', margin: '0 auto', overflow: 'hidden' }}>
              <div style={{ width: `${(pilotsViewed / totalPilots) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #ff6b6b, #feca57)', borderRadius: '1px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* View Season button */}
        {!seasonComplete ? (
          <div style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
            <button
              onClick={startSeason}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', padding: '0.8rem 2.5rem',
                color: hoveredBtn === 'season' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                fontSize: '0.9rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif",
                cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.05em',
                borderColor: hoveredBtn === 'season' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'
              }}
              onMouseEnter={() => setHoveredBtn('season')}
              onMouseLeave={() => setHoveredBtn(null)}
            >{seasonStarted ? 'Continue Season' : 'View Season'}</button>
          </div>
        ) : (
          <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
            <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>You've watched every pilot this season.</div>
            <button
              onClick={() => { setViewedPilotsSession(new Set()); setSeasonComplete(false); setSeasonStarted(false); }}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', padding: '0.7rem 2rem',
                color: hoveredBtn === 'restart' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif",
                cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.03em',
                borderColor: hoveredBtn === 'restart' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'
              }}
              onMouseEnter={() => setHoveredBtn('restart')}
              onMouseLeave={() => setHoveredBtn(null)}
            >Rewatch Season</button>
          </div>
        )}
      </div>

      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />

      {/* Video Modal — cycles through season */}
      {selectedPilotModal && (
        <VideoModal
          pilot={selectedPilotModal}
          currentUser={currentUser}
          onClose={() => { setSelectedPilotModal(null); }}
          onLogin={onLogin}
          onNavigate={onNavigate}
          onWatchAnother={() => {
            const next = getNextPilot();
            if (next.pilot) {
              setSelectedPilotModal(next.pilot);
              setViewedPilotsSession(prev => new Set([...prev, next.pilot.id]));
            } else {
              setSeasonComplete(true);
              setSelectedPilotModal(null);
              return 'all_viewed';
            }
          }}
          onGoHome={() => { setSelectedPilotModal(null); }}
          onOpenCreatorProfile={(creatorUserId) => {
            setSelectedPilotModal(null);
            openCreatorProfile(creatorUserId);
          }}
          onVoteSubmit={(pilotId) => {
            setVotedPilotIds(prev => new Set([...prev, pilotId]));
          }}
        />
      )}

      {/* Creator Profile Modal */}
      {selectedCreatorProfile && (
        <CreatorProfileModal
          creator={selectedCreatorProfile}
          onClose={() => setSelectedCreatorProfile(null)}
        />
      )}

      {/* Login Modal */}
      {loginModalMode && (
        <LoginModal
          onClose={() => setLoginModalMode(null)}
          onLogin={(user) => { onLogin(user); setLoginModalMode(null); }}
          onForgotPassword={() => { setLoginModalMode(null); onNavigate('forgot-password'); }}
          initialMode={loginModalMode}
        />
      )}
    </div>
  );
}

export default BrowsePage;
