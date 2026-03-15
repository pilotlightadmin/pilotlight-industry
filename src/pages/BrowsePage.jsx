import React, { useState, useEffect, useRef } from 'react';
import { Film, Star, TrendingUp, Sparkles, Eye } from 'lucide-react';
import StorageManager from '../services/StorageManager';
import VideoModal from '../components/VideoModal';
import PageFooter from '../components/PageFooter';
import { getPilotBadges, getCreatorBadges, PilotBadgeTag, CreatorBadgeIcon, ResubmissionTag } from '../utils/badges';
import { FlameIcon, AnimatedFlameIcon, Icon } from '../components/Icons';
import LoginModal from './LoginModal';

const genreColorMap = {
  Comedy: { primary: '#feca57', bg: 'rgba(254,202,87,0.2)' },
  Drama: { primary: '#4ecdc4', bg: 'rgba(78,205,196,0.2)' },
  'Reality TV': { primary: '#ff6b9d', bg: 'rgba(255,107,157,0.2)' },
  'Stand Up': { primary: '#a29bfe', bg: 'rgba(162,155,254,0.2)' }
};
const getGenreColor = (genre) => (genreColorMap[genre] || genreColorMap.Comedy).primary;
const getGenreBg = (genre) => (genreColorMap[genre] || genreColorMap.Comedy).bg;

function BrowsePage({ currentUser, onLogout, onSelectPilot, onLogin, onNavigate }) {
  // Initialize genre filter from localStorage
  const [genreFilter, setGenreFilter] = useState(() => {
    const saved = localStorage.getItem('pilotlight_browse_filter');
    return saved || 'all';
  }); // 'all', 'Comedy', 'Drama', 'directory'
  const [directorySearch, setDirectorySearch] = useState('');
  const [allPilots, setAllPilots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginModalMode, setLoginModalMode] = useState(null); // null = closed, 'login' or 'signup'
  const [selectedPilotModal, setSelectedPilotModal] = useState(null); // Pilot to show in modal overlay
  const [pilotSelectionSource, setPilotSelectionSource] = useState(null); // 'random' for Pick for me, or genre name for category browsing
  const [viewedPilotsSession, setViewedPilotsSession] = useState(new Set()); // Track viewed pilots in this session
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [topRatedCount, setTopRatedCount] = useState(3); // 3, 5, or 10
  const [selectedCreatorProfile, setSelectedCreatorProfile] = useState(null); // Creator to show in profile modal
  const [creatorsCache, setCreatorsCache] = useState({}); // Cache of loaded creator data
  const [showVoterGuide, setShowVoterGuide] = useState(false); // Voter guide modal
  const [showNdaModal, setShowNdaModal] = useState(false); // NDA modal
  const [showMemberAgreement, setShowMemberAgreement] = useState(false); // Member agreement modal
  const [votedPilotIds, setVotedPilotIds] = useState(new Set()); // Track which pilots user has voted on
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile hamburger menu

  // Load user's voted pilots
  useEffect(() => {
    if (currentUser?.id) {
      StorageManager.getVoterVotes(currentUser.id).then(votes => {
        const pilotIds = new Set(votes.map(v => {
          // Handle pilotId as linked field (array) or plain string
          return Array.isArray(v.pilotId) ? v.pilotId[0] : v.pilotId;
        }));
        setVotedPilotIds(pilotIds);
      }).catch(err => console.error('Error loading voted pilots:', err));
    } else {
      setVotedPilotIds(new Set());
    }
  }, [currentUser?.id]);

  // Helper to select a pilot and track it
  const selectPilot = (pilot, source) => {
    if (pilot) {
      setSelectedPilotModal(pilot);
      setPilotSelectionSource(source);
      setViewedPilotsSession(prev => new Set([...prev, pilot.id]));
    }
  };

  // Get next pilot for "Watch Another" based on selection source
  // Prioritizes pilots the user hasn't voted on yet
  const getNextPilot = () => {
    // Helper to check if user has NOT voted on a pilot
    const hasNotVotedOn = (pilotId) => !votedPilotIds.has(pilotId);

    // If started from "Pick for me", continue random selection (unvoted pilots only)
    if (pilotSelectionSource === 'random') {
      const unvotedPilots = allPilots.filter(p =>
        p.id !== selectedPilotModal?.id &&
        hasNotVotedOn(p.id)
      );
      if (unvotedPilots.length > 0) {
        return { pilot: unvotedPilots[Math.floor(Math.random() * unvotedPilots.length)], source: 'random' };
      }
      return { pilot: null, allViewed: true };
    }

    // Category-based cycling
    const currentGenre = pilotSelectionSource || selectedPilotModal?.genre;
    const genres = ['Comedy', 'Drama', 'Reality TV', 'Stand Up']; // Available genres

    // First, try to find unvoted pilots in the current genre
    if (currentGenre && currentGenre !== 'all') {
      const genrePilots = allPilots.filter(p =>
        p.genre === currentGenre &&
        p.id !== selectedPilotModal?.id &&
        hasNotVotedOn(p.id)
      );
      if (genrePilots.length > 0) {
        return { pilot: genrePilots[0], source: currentGenre };
      }
    }

    // If current genre exhausted, find unvoted pilots from other genres
    for (const genre of genres) {
      if (genre !== currentGenre) {
        const genrePilots = allPilots.filter(p =>
          p.genre === genre &&
          hasNotVotedOn(p.id)
        );
        if (genrePilots.length > 0) {
          return { pilot: genrePilots[0], source: genre };
        }
      }
    }

    // Check any remaining unvoted pilots regardless of genre
    const anyUnvoted = allPilots.filter(p =>
      p.id !== selectedPilotModal?.id &&
      hasNotVotedOn(p.id)
    );
    if (anyUnvoted.length > 0) {
      return { pilot: anyUnvoted[0], source: anyUnvoted[0].genre };
    }

    // All pilots have been voted on
    return { pilot: null, allViewed: true };
  };

  // Save genre filter to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pilotlight_browse_filter', genreFilter);
  }, [genreFilter]);

  // Refs for scrollable sections
  const trendingRef = useRef(null);
  const topRatedRef = useRef(null);
  const newArrivalsRef = useRef(null);

  // Track which sections have overflow
  const [hasOverflow, setHasOverflow] = useState({ trending: false, topRated: false, newArrivals: false });

  // Generic scroll function
  const scrollSection = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 480; // ~2 cards worth
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Check if sections have overflow
  const checkOverflow = () => {
    setHasOverflow({
      trending: trendingRef.current ? trendingRef.current.scrollWidth > trendingRef.current.clientWidth : false,
      topRated: topRatedRef.current ? topRatedRef.current.scrollWidth > topRatedRef.current.clientWidth : false,
      newArrivals: newArrivalsRef.current ? newArrivalsRef.current.scrollWidth > newArrivalsRef.current.clientWidth : false
    });
  };

  // Check overflow on mount, resize, and when pilots change
  useEffect(() => {
    // Small delay to ensure DOM has rendered
    const timer = setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [allPilots, genreFilter, loading]);

  // Reusable arrow buttons component
  const ScrollArrows = ({ onLeft, onRight }) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button onClick={onLeft}
        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(78,205,196,0.2)'; e.currentTarget.style.borderColor = '#4ecdc4'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button onClick={onRight}
        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(78,205,196,0.2)'; e.currentTarget.style.borderColor = '#4ecdc4'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  );

  useEffect(() => {
    const loadPilots = async () => {
      try {
        // Stats are now included from Airtable rollups - no separate fetch needed
        const pilots = await StorageManager.getPilotsForVoting();
        setAllPilots(pilots);
      } catch (err) {
        console.error('Error loading pilots:', err);
      }
      setLoading(false);
    };
    loadPilots();
  }, []);

  // Filter pilots by genre (directory shows all)
  const filteredPilots = genreFilter === 'all' || genreFilter === 'directory'
    ? allPilots
    : allPilots.filter(p => p.genre === genreFilter);

  // Filtered pilots with votes (all categories now respect genre filter)
  const withVotes = filteredPilots.filter(p => p.stats && p.stats.totalVotes > 0);

  // Top Rated: pilots with at least 1 vote, sorted by overall rating (respects genre filter)
  const topRatedPilots = [...withVotes]
    .filter(p => (p.stats.totalVotes || 0) >= 1)
    .sort((a, b) => parseFloat(b.stats.avgOverall || 0) - parseFloat(a.stats.avgOverall || 0))
    .slice(0, 10);

  // Trending: most votes in recent period (respects genre filter)
  const trending = [...withVotes]
    .sort((a, b) => (b.stats.totalVotes || 0) - (a.stats.totalVotes || 0))
    .slice(0, 6);

  // New Arrivals: most recent (respects genre filter)
  const newArrivals = [...filteredPilots]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  // Hidden Gems: high-rated pilots (<20 votes) - quality content that hasn't been discovered yet
  // Backfills with next-best rated pilots if not enough qualify (respects genre filter)
  const hiddenGemsTarget = 5;
  const hiddenGemsCandidates = [...withVotes]
    .filter(p => parseFloat(p.stats.avgOverall || 0) >= 3.0 && (p.stats.totalVotes || 0) < 20)
    .sort((a, b) => {
      // Sort by rating, but favor those with fewer votes (more "hidden")
      const ratingDiff = parseFloat(b.stats.avgOverall || 0) - parseFloat(a.stats.avgOverall || 0);
      if (Math.abs(ratingDiff) < 0.3) {
        // If ratings are close, prefer fewer votes (more hidden)
        return (a.stats.totalVotes || 0) - (b.stats.totalVotes || 0);
      }
      return ratingDiff;
    });

  // Backfill if not enough hidden gems: add next highest rated pilots not already included
  let hiddenGems = hiddenGemsCandidates.slice(0, hiddenGemsTarget);
  if (hiddenGems.length < hiddenGemsTarget) {
    const hiddenGemIds = new Set(hiddenGems.map(p => p.id));
    const backfill = [...withVotes]
      .filter(p => !hiddenGemIds.has(p.id) && parseFloat(p.stats.avgOverall || 0) >= 3.0)
      .sort((a, b) => parseFloat(b.stats.avgOverall || 0) - parseFloat(a.stats.avgOverall || 0))
      .slice(0, hiddenGemsTarget - hiddenGems.length);
    hiddenGems = [...hiddenGems, ...backfill];
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedFlameIcon size={64} />
      </div>
    );
  }

  const filterTabStyle = (isActive, genre) => ({
    padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.6rem, 3vw, 1.5rem)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: isActive ? '600' : '500',
    transition: 'all 0.2s',
    color: isActive ? '#1a1a2e' : 'rgba(255,255,255,0.7)',
    border: 'none',
    background: isActive
      ? (genre === 'Comedy' ? 'linear-gradient(135deg, #feca57 0%, #ff6b6b 100%)'
         : genre === 'Drama' ? 'linear-gradient(135deg, #4ecdc4 0%, #6b89ff 100%)'
         : genre === 'Reality TV' ? 'linear-gradient(135deg, #ff6b9d 0%, #fd79a8 100%)'
         : genre === 'Stand Up' ? 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)'
         : genre === 'directory' ? 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)'
         : 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)')
      : 'transparent',
    fontSize: 'clamp(0.75rem, 2.5vw, 0.95rem)',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(0.2rem, 1vw, 0.4rem)',
    whiteSpace: 'nowrap'
  });

  // Function to open creator profile
  const openCreatorProfile = async (creatorUserId, e) => {
    if (e) e.stopPropagation(); // Prevent card click

    // Check cache first
    if (creatorsCache[creatorUserId]) {
      setSelectedCreatorProfile(creatorsCache[creatorUserId]);
      return;
    }

    try {
      const voters = await StorageManager.getVoters();
      const creator = voters.find(v => v.id === creatorUserId);
      if (creator) {
        // Get creator's pilots with stats
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

    // Parse aboutMe from application if not set
    const getAboutMe = () => {
      if (creator.aboutMe) return creator.aboutMe;
      try {
        const app = typeof creator.creatorApplication === 'string'
          ? JSON.parse(creator.creatorApplication)
          : creator.creatorApplication;
        return app?.describes || '';
      } catch (e) {
        return '';
      }
    };
    const aboutMe = getAboutMe();

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        onClick={onClose}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={(e) => e.stopPropagation()}>

          {/* Header with close button */}
          <div style={{ position: 'sticky', top: 0, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Creator Profile</h2>
            <button onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Profile Picture and Name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
              {creator.profilePicture ? (
                <img src={creator.profilePicture} alt={displayName}
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,107,107,0.5)', marginBottom: '1rem' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,107,107,0.2), rgba(254,202,87,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,107,107,0.5)', marginBottom: '1rem' }}>
                  <FlameIcon size={48} />
                </div>
              )}
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>{displayName}</h3>
              {creator.creatorType && (
                <span style={{ display: 'inline-block', padding: '0.3rem 0.75rem', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(255,107,107,0.2), rgba(254,202,87,0.2))', border: '1px solid rgba(255,107,107,0.4)', color: '#feca57', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {creator.creatorType}
                </span>
              )}
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Joined {joinDate}</p>

              {/* Creator Badges */}
              {(() => {
                const badges = getCreatorBadges(creator.id, allPilots);
                return badges.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '1rem' }}>
                    {badges.map(b => (
                      <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
                        background: b.bg, border: `1px solid ${b.border}`, borderRadius: '10px' }}>
                        <span style={{ fontSize: '1.1rem' }}>{b.icon}</span>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: b.color }}>{b.label}</span>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.3' }}>{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>

            {/* About Me */}
            {aboutMe && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>About</h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px' }}>{aboutMe}</p>
              </div>
            )}

            {/* Pilots */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pilots ({creator.pilots?.length || 0})
              </h4>
              {creator.pilots && creator.pilots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {creator.pilots.map(pilot => (
                    <div key={pilot.id}
                      onClick={() => { onClose(); selectPilot(pilot, pilot.genre); }}
                      style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(78,205,196,0.1)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.3)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                      {/* Thumbnail */}
                      <div style={{ width: '80px', height: '45px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                        {pilot.playbackId ? (
                          <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=160`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt={pilot.pilotTitle} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(107,137,255,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon component={Film} style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.3)' }} />
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pilot.pilotTitle}</h5>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{pilot.genre}</span>
                          {pilot.stats && pilot.stats.totalVotes > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Icon component={Star} style={{ width: '12px', height: '12px', color: '#feca57' }} />
                              <span style={{ color: '#feca57', fontWeight: '600' }}>{pilot.stats.avgOverall.toFixed(2)}</span>
                              <span style={{ color: 'rgba(255,255,255,0.4)' }}>({pilot.stats.totalVotes} reviews)</span>
                            </div>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>No reviews yet</span>
                          )}
                          {pilot.stats && pilot.stats.totalViews > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Icon component={Eye} style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.4)' }} />
                              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{pilot.stats.totalViews}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No pilots yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pilot card component for reuse
  const PilotCard = ({ pilot, featured = false }) => (
    <div
      onClick={() => selectPilot(pilot, genreFilter === 'all' || genreFilter === 'directory' ? pilot.genre : genreFilter)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: featured ? '16px' : '14px',
        padding: featured ? '1.25rem' : '1rem',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        transition: 'all 0.3s',
        ...(featured && { gridColumn: 'span 2' })
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(78,205,196,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {featured ? (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : '1.5fr 1fr', gap: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
          <div style={{ aspectRatio: '16/10', borderRadius: '10px', overflow: 'hidden' }}>
            {pilot.playbackId ? (
              <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=500`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt={pilot.pilotTitle} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(107,137,255,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon component={Film} style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.3)' }} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, color: '#fff' }}>{pilot.pilotTitle}</h3>
              {genreFilter === 'all' && (
                <span style={{
                  padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                  background: getGenreBg(pilot.genre),
                  color: getGenreColor(pilot.genre)
                }}>{pilot.genre}</span>
              )}
              <ResubmissionTag version={pilot.version} />
              {getPilotBadges(pilot, allPilots).map(b => <PilotBadgeTag key={b.key} badge={b} />)}
            </div>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.75rem', lineHeight: '1.5',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pilot.logline}</p>
            {pilot.stats && pilot.stats.totalVotes > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icon component={Star} style={{ width: '16px', height: '16px', color: '#feca57' }} />
                <span style={{ fontSize: '0.95rem', color: '#feca57', fontWeight: '600' }}>{pilot.stats.avgOverall.toFixed(2)}</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>({pilot.stats.totalVotes} Reviews)</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Be the first to review!</span>
            )}
            {pilot.creatorName && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                by <span onClick={(e) => openCreatorProfile(pilot.creatorUserId, e)}
                  style={{ color: '#4ecdc4', cursor: 'pointer', textDecoration: 'none' }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>{pilot.creatorName}</span>
                {getCreatorBadges(pilot.creatorUserId, allPilots).map(b => <CreatorBadgeIcon key={b.key} badge={b} />)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ aspectRatio: '16/9', borderRadius: '10px', marginBottom: '1rem', overflow: 'hidden' }}>
            {pilot.playbackId ? (
              <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=400`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt={pilot.pilotTitle} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(107,137,255,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon component={Film} style={{ width: '36px', height: '36px', color: 'rgba(255,255,255,0.3)' }} />
              </div>
            )}
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '600', margin: '0 0 0.4rem', color: '#fff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pilot.pilotTitle}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {genreFilter === 'all' && (
              <span style={{
                padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase',
                background: getGenreBg(pilot.genre),
                color: getGenreColor(pilot.genre)
              }}>{pilot.genre}</span>
            )}
            <ResubmissionTag version={pilot.version} />
            {getPilotBadges(pilot, allPilots).map(b => <PilotBadgeTag key={b.key} badge={b} />)}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.5rem', lineHeight: '1.4',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pilot.logline}</p>
          {pilot.stats && pilot.stats.totalVotes > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon component={Star} style={{ width: '14px', height: '14px', color: '#feca57' }} />
              <span style={{ fontSize: '0.85rem', color: '#feca57', fontWeight: '600' }}>{pilot.stats.avgOverall.toFixed(2)}</span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>({pilot.stats.totalVotes})</span>
            </div>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Be the first to review!</span>
          )}
          {pilot.creatorName && (
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '0.4rem 0 0', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              by <span onClick={(e) => openCreatorProfile(pilot.creatorUserId, e)}
                style={{ color: '#4ecdc4', cursor: 'pointer', textDecoration: 'none' }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>{pilot.creatorName}</span>
              {getCreatorBadges(pilot.creatorUserId, allPilots).map(b => <CreatorBadgeIcon key={b.key} badge={b} />)}
            </p>
          )}
        </>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header - Single Row */}
      <header style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 3vw, 1.5rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }} onClick={() => onNavigate('browse')}>
          <FlameIcon size={22} />
          <span style={{ fontSize: 'clamp(0.95rem, 3vw, 1.15rem)', fontWeight: '700', background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pilot Light</span>
        </div>
        <nav className="main-header-nav" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 2vw, 1rem)', fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)' }}>
          {/* Search - compact icon on mobile, input on desktop */}
          <div className="nav-search-container" style={{ position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg style={{ position: 'absolute', left: '8px', width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                onFocus={() => setShowSearchModal(true)}
                onBlur={() => setTimeout(() => setShowSearchModal(false), 200)}
                style={{ width: 'clamp(100px, 15vw, 180px)', padding: '0.4rem 0.5rem 0.4rem 1.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
              />
            </div>
            {/* Dropdown results */}
            {showSearchModal && navSearch.length >= 2 && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 1000, maxHeight: '300px', overflowY: 'auto', minWidth: '280px', width: 'max(280px, 100%)' }}>
                {(() => {
                  const searchResults = allPilots.filter(p => (p.pilotTitle || '').toLowerCase().includes(navSearch.toLowerCase())).slice(0, 8);
                  if (searchResults.length === 0) {
                    return <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1rem', fontSize: '0.85rem', margin: 0 }}>No pilots found</p>;
                  }
                  return searchResults.map(pilot => (
                    <div key={pilot.id}
                      onClick={() => { selectPilot(pilot, pilot.genre); setShowSearchModal(false); setNavSearch(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: '50px', height: '28px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                        {pilot.playbackId ? (
                          <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=100`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={pilot.pilotTitle} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'rgba(78,205,196,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon component={Film} style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.3)' }} />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pilot.pilotTitle}</div>
                        <div style={{ fontSize: '0.7rem', color: getGenreColor(pilot.genre) }}>{pilot.genre}</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Desktop nav links - hidden on mobile */}
          <span className="nav-link nav-desktop-only" onClick={() => setShowVoterGuide(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#4ecdc4'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
            <svg style={{ width: 'clamp(14px, 3vw, 16px)', height: 'clamp(14px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Guide
          </span>
          <span className="nav-link nav-desktop-only" onClick={() => setShowMemberAgreement(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#feca57'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
            <svg style={{ width: 'clamp(14px, 3vw, 16px)', height: 'clamp(14px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Agreement
          </span>
          {currentUser?.creatorStatus === 'approved' ? (
            <span className="nav-link nav-desktop-only" onClick={() => onNavigate('creator-portal')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ff6b6b'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
              <svg style={{ width: 'clamp(14px, 3vw, 16px)', height: 'clamp(14px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              Creator Portal
            </span>
          ) : (
            <span className="nav-link nav-desktop-only" onClick={() => onNavigate('creators-landing')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ff6b6b'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
              <svg style={{ width: 'clamp(14px, 3vw, 16px)', height: 'clamp(14px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Creators
            </span>
          )}
          {/* Desktop: full account/login links */}
          {currentUser ? (
            <span className="nav-link nav-desktop-only" onClick={() => onNavigate('account')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
              <svg style={{ width: 'clamp(14px, 3vw, 16px)', height: 'clamp(14px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              {currentUser.name}
            </span>
          ) : (
            <>
              <span className="nav-link nav-desktop-only" onClick={() => setLoginModalMode('login')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                Login
              </span>
              <span className="nav-link nav-desktop-only" onClick={() => setLoginModalMode('signup')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#4ecdc4', cursor: 'pointer', fontWeight: '600' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#4ecdc4'}>
                Sign Up
              </span>
            </>
          )}

          {/* Mobile: profile icon or login button — always visible next to hamburger */}
          {currentUser ? (
            <button className="nav-mobile-profile" onClick={() => onNavigate('account')}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </button>
          ) : (
            <button className="nav-mobile-profile" onClick={() => setLoginModalMode('login')}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          )}

          {/* Mobile hamburger button */}
          <button className="nav-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              ) : (
                <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}>
            <div onClick={(e) => e.stopPropagation()}
              style={{ position: 'absolute', top: '56px', right: 0, left: 0, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <button onClick={() => { setShowVoterGuide(true); setMobileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Voter Guide
              </button>
              <button onClick={() => { setShowMemberAgreement(true); setMobileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Member Agreement
              </button>
              {currentUser?.creatorStatus === 'approved' ? (
                <button onClick={() => { onNavigate('creator-portal'); setMobileMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  Creator Portal
                </button>
              ) : (
                <button onClick={() => { onNavigate('creators-landing'); setMobileMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  Become a Creator
                </button>
              )}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.25rem', paddingTop: '0.5rem' }}>
                {currentUser ? (
                  <button onClick={() => { onNavigate('account'); setMobileMenuOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit', width: '100%' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    {currentUser.name}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { setLoginModalMode('login'); setMobileMenuOpen(false); }}
                      style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Login
                    </button>
                    <button onClick={() => { setLoginModalMode('signup'); setMobileMenuOpen(false); }}
                      style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Voter Guide Modal */}
      {showVoterGuide && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setShowVoterGuide(false)}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Voter Guide</h2>
              <button onClick={() => setShowVoterGuide(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Your votes help creators understand what works. Here's what each rating means:
            </p>

            {/* Curiosity */}
            <div style={{ background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <h3 style={{ color: '#4ecdc4', margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Curiosity Rating</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.5' }}>
                How eager are you to see what happens next? Rate how much this pilot made you want to keep watching and discover where the story goes.
              </p>
            </div>

            {/* Season Potential */}
            <div style={{ background: 'rgba(254,202,87,0.1)', border: '1px solid rgba(254,202,87,0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <h3 style={{ color: '#feca57', margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Season Potential Rating</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.5' }}>
                Would you watch a full season of this? Rate whether you'd commit to following this show week after week if it got picked up.
              </p>
            </div>

            {/* Pull Factors */}
            <div style={{ background: 'rgba(253,121,168,0.1)', border: '1px solid rgba(253,121,168,0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fd79a8', margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Pull IN / Pull BACK Factors</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 0.75rem', lineHeight: '1.5' }}>
                What drew you in? What held you back? Select the elements that worked for you (Pull IN) and the ones that didn't land (Pull BACK):
              </p>
              <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.9rem', paddingLeft: '0.5rem' }}>
                <div><span style={{ color: '#fd79a8', fontWeight: '500' }}>World/Premise</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>— The setting and central concept</span></div>
                <div><span style={{ color: '#fd79a8', fontWeight: '500' }}>Humor/Entertainment</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>— How fun or engaging it is to watch</span></div>
                <div><span style={{ color: '#fd79a8', fontWeight: '500' }}>Characters</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>— The people driving the story</span></div>
                <div><span style={{ color: '#fd79a8', fontWeight: '500' }}>Tone/Voice</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>— The unique style and feel</span></div>
                <div><span style={{ color: '#fd79a8', fontWeight: '500' }}>Story Potential</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>— Where the narrative could go</span></div>
              </div>
            </div>

            {/* Overall Rating */}
            <div style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(254,202,87,0.1))', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '0.5rem' }}>
              <h3 style={{ color: '#ff6b6b', margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Overall Rating</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.5' }}>
                Your gut reaction. Taking everything into account—the concept, execution, and your personal taste—how would you rate this pilot overall?
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Member Agreement Modal */}
      {showMemberAgreement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setShowMemberAgreement(false)}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, background: 'linear-gradient(135deg, #feca57 0%, #ff6b6b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Member Agreement</h2>
              <button onClick={() => setShowMemberAgreement(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ background: 'rgba(254,202,87,0.1)', border: '1px solid rgba(254,202,87,0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.6', fontSize: '0.95rem' }}>
                By creating an account and becoming a member of Pilot Light, you implicitly agree to the following terms. These exist to protect the creators who trust this community with their work.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🔒</span>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: '600' }}>Confidentiality</h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.6', fontSize: '0.9rem' }}>
                  All content on Pilot Light is confidential. You agree not to share, reproduce, distribute, or publicly discuss any pilot videos, concepts, or creative materials you view on the platform.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🚫</span>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: '600' }}>No Appropriation</h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.6', fontSize: '0.9rem' }}>
                  You will not use, copy, adapt, or appropriate any ideas, concepts, storylines, characters, or creative elements from the pilots you view for your own projects or any other purpose.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>©</span>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: '600' }}>Creator Ownership</h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.6', fontSize: '0.9rem' }}>
                  All content belongs to the respective creators and is protected by intellectual property rights. Pilot Light does not claim ownership of any creator's work.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>💬</span>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: '600' }}>Constructive Feedback</h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.6', fontSize: '0.9rem' }}>
                  Your feedback should be honest and constructive, solely for the purpose of helping creators improve their work. Do not attempt to identify or contact creators outside of the platform.
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '12px', padding: '1.25rem', marginTop: '1.25rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.6', fontSize: '0.9rem' }}>
                <strong style={{ color: '#ff6b6b' }}>Enforcement:</strong> Violation of these terms may result in immediate removal from the platform and potential legal action.
              </p>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.4)', margin: '1.25rem 0 0.5rem', lineHeight: '1.6', fontSize: '0.8rem', textAlign: 'center' }}>
              By using Pilot Light, you acknowledge and accept these terms.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, padding: 'clamp(1rem, 3vw, 2rem)', overflowX: 'hidden' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', overflowX: 'hidden' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800', margin: '0 0 1.5rem 0', lineHeight: '1.1' }}>
              <span style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 20%, #4ecdc4 80%, #ff6b6b 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textDecoration: 'underline', textDecorationColor: 'rgba(78,205,196,0.4)', textDecorationThickness: '2px', textUnderlineOffset: '8px' }}>
                The Future of TV Starts Here
              </span>
            </h1>
            <p style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 0.75rem', fontWeight: '600' }}>
              Watch. Vote. <span style={{ color: '#feca57' }}>Decide what gets made next.</span>
            </p>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', maxWidth: '550px', margin: '0 auto' }}>
              Real creators. Real feedback. Real viewers shaping the next big hit.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="browse-filter-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(0.75rem, 2vw, 1rem)', padding: '0 0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
            <div className="browse-filter-tabs" style={{ display: 'flex', gap: 'clamp(0.15rem, 1vw, 0.5rem)', background: 'rgba(255,255,255,0.05)', padding: 'clamp(0.2rem, 1vw, 0.4rem)', borderRadius: '10px', flexShrink: 0 }}>
              <button onClick={() => setGenreFilter('all')} style={filterTabStyle(genreFilter === 'all', 'all')}>
                <svg style={{ width: 'clamp(12px, 3vw, 16px)', height: 'clamp(12px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                  <polyline points="17 2 12 7 7 2"/>
                </svg>
                Discover
              </button>
              <button onClick={() => setGenreFilter('Comedy')} style={filterTabStyle(genreFilter === 'Comedy', 'Comedy')}>
                <svg style={{ width: 'clamp(12px, 3vw, 16px)', height: 'clamp(12px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                Comedy
              </button>
              <button onClick={() => setGenreFilter('Drama')} style={filterTabStyle(genreFilter === 'Drama', 'Drama')}>
                <svg style={{ width: 'clamp(12px, 3vw, 16px)', height: 'clamp(12px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                Drama
              </button>
              <button onClick={() => setGenreFilter('Reality TV')} style={filterTabStyle(genreFilter === 'Reality TV', 'Reality TV')}>
                <svg style={{ width: 'clamp(12px, 3vw, 16px)', height: 'clamp(12px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                  <polyline points="17 2 12 7 7 2"/>
                </svg>
                Reality TV
              </button>
              <button onClick={() => setGenreFilter('Stand Up')} style={filterTabStyle(genreFilter === 'Stand Up', 'Stand Up')}>
                <svg style={{ width: 'clamp(12px, 3vw, 16px)', height: 'clamp(12px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Stand Up
              </button>
              <button onClick={() => setGenreFilter('directory')} style={filterTabStyle(genreFilter === 'directory', 'directory')}>
                <svg style={{ width: 'clamp(12px, 3vw, 16px)', height: 'clamp(12px, 3vw, 16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                All
              </button>
            </div>
          </div>

          {/* Pick for me - Random pilot selector */}
          {genreFilter !== 'directory' && filteredPilots.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 'clamp(1rem, 3vw, 1.5rem)', padding: '0 clamp(0.5rem, 2vw, 1rem)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: 'rgba(255,255,255,0.5)' }}>Don't know where to start?</span>
                <button
                  onClick={() => {
                    const randomPilot = filteredPilots[Math.floor(Math.random() * filteredPilots.length)];
                    if (randomPilot) selectPilot(randomPilot, 'random');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '20px', color: '#fff', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(78,205,196,0.15)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8"/>
                    <line x1="4" y1="20" x2="21" y2="3"/>
                    <polyline points="21 16 21 21 16 21"/>
                    <line x1="15" y1="15" x2="21" y2="21"/>
                    <line x1="4" y1="4" x2="9" y2="9"/>
                  </svg>
                  Pick for me
                </button>
              </div>
            </div>
          )}

          {/* DIRECTORY VIEW - All pilots sorted alphabetically */}
          {genreFilter === 'directory' && (
            <section style={{ marginBottom: '3.5rem' }}>
              {(() => {
                // Filter by search, then sort and group
                const searchFiltered = directorySearch
                  ? allPilots.filter(p => (p.pilotTitle || '').toLowerCase().includes(directorySearch.toLowerCase()))
                  : allPilots;
                const sortedPilots = [...searchFiltered].sort((a, b) =>
                  (a.pilotTitle || '').localeCompare(b.pilotTitle || '')
                );
                const grouped = sortedPilots.reduce((acc, pilot) => {
                  const firstLetter = (pilot.pilotTitle || '?')[0].toUpperCase();
                  if (!acc[firstLetter]) acc[firstLetter] = [];
                  acc[firstLetter].push(pilot);
                  return acc;
                }, {});
                const letters = Object.keys(grouped).sort();
                const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

                return (
                  <>
                    {/* Search bar and letter index */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem', alignItems: 'center' }}>
                      {/* Search bar */}
                      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                          width: '18px', height: '18px', color: 'rgba(255,255,255,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input
                          type="text"
                          placeholder="Search pilots..."
                          value={directorySearch}
                          onChange={(e) => setDirectorySearch(e.target.value)}
                          style={{
                            width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none'
                          }}
                        />
                        {directorySearch && (
                          <button onClick={() => setDirectorySearch('')}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.2rem' }}>
                            ×
                          </button>
                        )}
                      </div>
                      {/* Letter index */}
                      <div style={{ display: 'flex', gap: 'clamp(0.1rem, 0.5vw, 0.25rem)', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
                        {allLetters.map(letter => {
                          const hasLetter = letters.includes(letter);
                          return (
                            <button key={letter}
                              onClick={() => hasLetter && document.getElementById(`directory-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                              style={{
                                width: 'clamp(22px, 6vw, 26px)', height: 'clamp(22px, 6vw, 26px)', padding: 0,
                                background: hasLetter ? 'rgba(162,155,254,0.15)' : 'transparent',
                                border: 'none', borderRadius: '4px',
                                color: hasLetter ? '#a29bfe' : 'rgba(255,255,255,0.2)',
                                fontSize: '0.75rem', fontWeight: '600',
                                cursor: hasLetter ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => hasLetter && (e.currentTarget.style.background = 'rgba(162,155,254,0.3)')}
                              onMouseOut={(e) => hasLetter && (e.currentTarget.style.background = 'rgba(162,155,254,0.15)')}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Results count */}
                    {directorySearch && (
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        {sortedPilots.length} result{sortedPilots.length !== 1 ? 's' : ''} for "{directorySearch}"
                      </p>
                    )}

                    {/* Pilot list grouped by letter */}
                    {letters.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
                        No pilots found{directorySearch ? ` matching "${directorySearch}"` : ''}
                      </div>
                    ) : (
                      letters.map(letter => (
                        <div key={letter} id={`directory-${letter}`} style={{ marginBottom: '1.5rem', scrollMarginTop: '1rem' }}>
                          <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1.5rem)', alignItems: 'flex-start' }}>
                            {/* Letter heading */}
                            <div style={{
                              width: 'clamp(24px, 6vw, 32px)', flexShrink: 0,
                              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', fontWeight: '600',
                              color: 'rgba(255,255,255,0.3)',
                              paddingTop: '0.85rem'
                            }}>
                              {letter}
                            </div>
                            {/* Pilots for this letter */}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {grouped[letter].map(pilot => (
                                <div key={pilot.id} onClick={() => selectPilot(pilot, genreFilter === 'all' || genreFilter === 'directory' ? pilot.genre : genreFilter)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 2vw, 0.75rem)',
                                    padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.5rem, 2vw, 1rem)', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                                    border: '1px solid rgba(255,255,255,0.06)', minWidth: 0
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(162,155,254,0.3)'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                                  {/* Thumbnail */}
                                  <div style={{ width: 'clamp(44px, 12vw, 60px)', height: 'clamp(25px, 7vw, 34px)', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                                    {pilot.playbackId ? (
                                      <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=120`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={pilot.pilotTitle} />
                                    ) : (
                                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(162,155,254,0.2), rgba(108,92,231,0.1))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon component={Film} style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.25)' }} />
                                      </div>
                                    )}
                                  </div>
                                  {/* Info */}
                                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <h3 style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)', fontWeight: '600', color: '#fff', margin: 0,
                                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pilot.pilotTitle}</h3>
                                    <span style={{ fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', color: getGenreColor(pilot.genre) }}>{pilot.genre}</span>
                                  </div>
                                  {/* Rating if available */}
                                  {pilot.stats && pilot.stats.totalVotes > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                                      <Icon component={Star} style={{ width: '14px', height: '14px', color: '#feca57' }} />
                                      <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', fontWeight: '600', color: '#feca57' }}>{pilot.stats.avgOverall.toFixed(2)}</span>
                                      <span style={{ fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)', color: 'rgba(255,255,255,0.5)', display: window.innerWidth <= 360 ? 'none' : 'inline' }}>({pilot.stats.totalVotes})</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                );
              })()}
            </section>
          )}

          {/* TOP RATED */}
          {genreFilter !== 'directory' && topRatedPilots.length > 0 && (
            <section style={{ marginBottom: '3.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '8px', background: 'linear-gradient(135deg, #feca57, #f39c12)' }}>
                    <Icon component={Star} style={{ width: '16px', height: '16px', color: '#1a1a2e' }} />
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0, color: '#fff' }}>Top Rated</h2>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {topRatedPilots.slice(0, topRatedCount).map((pilot, idx) => (
                  <div key={pilot.id} onClick={() => selectPilot(pilot, genreFilter === 'all' || genreFilter === 'directory' ? pilot.genre : genreFilter)}
                    style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 2vw, 1rem)', padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1.25rem)',
                      background: idx === 0 ? 'linear-gradient(135deg, rgba(254,202,87,0.15), rgba(243,156,18,0.08))' :
                                 idx === 1 ? 'linear-gradient(135deg, rgba(192,192,192,0.1), rgba(169,169,169,0.05))' :
                                 idx === 2 ? 'linear-gradient(135deg, rgba(205,127,50,0.1), rgba(184,115,51,0.05))' :
                                 'rgba(255,255,255,0.03)',
                      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                      border: idx < 3 ? `1px solid ${idx === 0 ? 'rgba(254,202,87,0.3)' : idx === 1 ? 'rgba(192,192,192,0.2)' : 'rgba(205,127,50,0.2)'}` : '1px solid rgba(255,255,255,0.06)' }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.background = idx < 3 ? e.currentTarget.style.background : 'rgba(255,255,255,0.06)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.background = idx === 0 ? 'linear-gradient(135deg, rgba(254,202,87,0.15), rgba(243,156,18,0.08))' : idx === 1 ? 'linear-gradient(135deg, rgba(192,192,192,0.1), rgba(169,169,169,0.05))' : idx === 2 ? 'linear-gradient(135deg, rgba(205,127,50,0.1), rgba(184,115,51,0.05))' : 'rgba(255,255,255,0.03)'; }}>
                    {/* Rank */}
                    <div style={{ width: 'clamp(28px, 6vw, 36px)', height: 'clamp(28px, 6vw, 36px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: idx === 0 ? 'linear-gradient(135deg, #feca57, #f39c12)' :
                                 idx === 1 ? 'linear-gradient(135deg, #c0c0c0, #a9a9a9)' :
                                 idx === 2 ? 'linear-gradient(135deg, #cd7f32, #b8860b)' :
                                 'rgba(255,255,255,0.1)',
                      color: idx < 3 ? '#1a1a2e' : '#fff', fontWeight: '700', fontSize: idx < 3 ? 'clamp(0.85rem, 2vw, 1rem)' : 'clamp(0.8rem, 2vw, 0.9rem)', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    {/* Thumbnail */}
                    <div style={{ width: 'clamp(50px, 12vw, 80px)', height: 'clamp(28px, 7vw, 45px)', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                      {pilot.playbackId ? (
                        <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=160`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={pilot.pilotTitle} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(107,137,255,0.1))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon component={Film} style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.25)' }} />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', fontWeight: '600', color: '#fff', margin: 0,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pilot.pilotTitle}</h3>
                        {genreFilter === 'all' && (
                          <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '600', textTransform: 'uppercase', flexShrink: 0,
                            background: getGenreBg(pilot.genre),
                            color: getGenreColor(pilot.genre) }}>{pilot.genre}</span>
                        )}
                      </div>
                      {pilot.logline && (
                        <p style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: '1.4',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>{pilot.logline}</p>
                      )}
                    </div>
                    {/* Rating & Votes */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, minWidth: '50px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Icon component={Star} style={{ width: 'clamp(14px, 3vw, 18px)', height: 'clamp(14px, 3vw, 18px)', color: '#feca57' }} />
                        <span style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: '700', color: '#feca57' }}>{parseFloat(pilot.stats.avgOverall).toFixed(2)}</span>
                      </div>
                      <span style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'rgba(255,255,255,0.5)' }}>{pilot.stats.totalVotes} vote{pilot.stats.totalVotes !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
                {topRatedPilots.length > 3 && (
                  <button onClick={() => setTopRatedCount(topRatedCount === 3 ? 5 : 3)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                      color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.5rem' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>
                    {topRatedCount === 3 ? (
                      <>
                        <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                        Show Top 5
                      </>
                    ) : (
                      <>
                        <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                        Show Less
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* TRENDING THIS WEEK */}
          {genreFilter !== 'directory' && trending.length > 0 && (
            <section style={{ marginBottom: '3.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '8px', background: 'linear-gradient(135deg, #ff6b6b, #feca57)' }}>
                    <Icon component={TrendingUp} style={{ width: '16px', height: '16px', color: '#1a1a2e' }} />
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0, color: '#fff' }}>Trending This Week</h2>
                </div>
                {hasOverflow.trending && (
                  <ScrollArrows onLeft={() => scrollSection(trendingRef, 'left')} onRight={() => scrollSection(trendingRef, 'right')} />
                )}
              </div>
              <div ref={trendingRef} style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                {trending.map((pilot, idx) => (
                  <div key={pilot.id} style={{ flex: '0 0 min(280px, 80vw)', scrollSnapAlign: 'start' }}>
                    <PilotCard pilot={pilot} featured={false} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* NEW ARRIVALS */}
          {genreFilter !== 'directory' && newArrivals.length > 0 && (
            <section style={{ marginBottom: '3.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '8px', background: 'linear-gradient(135deg, #4ecdc4, #44a08d)' }}>
                    <Icon component={Sparkles} style={{ width: '16px', height: '16px', color: '#1a1a2e' }} />
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0, color: '#fff' }}>New Arrivals</h2>
                </div>
                {hasOverflow.newArrivals && (
                  <ScrollArrows onLeft={() => scrollSection(newArrivalsRef, 'left')} onRight={() => scrollSection(newArrivalsRef, 'right')} />
                )}
              </div>
              <div ref={newArrivalsRef} style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                {newArrivals.map((pilot, idx) => {
                  const createdTime = pilot.createdAt ? new Date(pilot.createdAt).getTime() : null;
                  const isNew = createdTime && !isNaN(createdTime) ? (Date.now() - createdTime) < 48 * 60 * 60 * 1000 : true; // 48 hours, default to new if no date
                  const timeAgo = (() => {
                    if (!pilot.createdAt) return 'recently';
                    const created = new Date(pilot.createdAt).getTime();
                    if (isNaN(created)) return 'recently';
                    const diff = Date.now() - created;
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    if (hours < 1) return 'just now';
                    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                    const days = Math.floor(hours / 24);
                    if (days === 0) return 'today';
                    if (days === 1) return 'yesterday';
                    return `${days} days ago`;
                  })();
                  return (
                    <div key={pilot.id} onClick={() => selectPilot(pilot, genreFilter === 'all' || genreFilter === 'directory' ? pilot.genre : genreFilter)}
                      style={{ flex: '0 0 min(280px, 80vw)', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.3s', scrollSnapAlign: 'start' }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                      <div style={{ aspectRatio: '16/9', borderRadius: '8px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                        {pilot.playbackId ? (
                          <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=300`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={pilot.pilotTitle} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(107,137,255,0.1))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon component={Film} style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.25)' }} />
                          </div>
                        )}
                      </div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff', margin: '0 0 0.25rem',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pilot.pilotTitle}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        {isNew && (
                          <span style={{ background: 'linear-gradient(135deg, #4ecdc4, #44a08d)', color: '#1a1a2e',
                            fontSize: '0.55rem', fontWeight: '700', padding: '0.1rem 0.35rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                            New
                          </span>
                        )}
                        <ResubmissionTag version={pilot.version} />
                        {getPilotBadges(pilot, allPilots).map(b => <PilotBadgeTag key={b.key} badge={b} />)}
                      </div>
                      {genreFilter === 'all' && (
                        <span style={{
                          display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase',
                          background: getGenreBg(pilot.genre),
                          color: getGenreColor(pilot.genre), marginBottom: '0.25rem'
                        }}>{pilot.genre}</span>
                      )}
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Added {timeAgo}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* HIDDEN GEMS */}
          {genreFilter !== 'directory' && hiddenGems.length > 0 && (
            <section style={{ marginBottom: '3.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '8px', background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a1a2e">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0, color: '#fff' }}>Hidden Gems</h2>
                </div>
                {hasOverflow.topRated && (
                  <ScrollArrows onLeft={() => scrollSection(topRatedRef, 'left')} onRight={() => scrollSection(topRatedRef, 'right')} />
                )}
              </div>
              <div ref={topRatedRef} style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                {hiddenGems.map((pilot, idx) => (
                  <div key={pilot.id} onClick={() => selectPilot(pilot, genreFilter === 'all' || genreFilter === 'directory' ? pilot.genre : genreFilter)}
                    style={{ flex: '0 0 min(280px, 80vw)', background: 'rgba(108,92,231,0.08)', borderRadius: '12px', padding: '0.75rem',
                      border: '1px solid rgba(162,155,254,0.2)', cursor: 'pointer', transition: 'all 0.3s', position: 'relative', scrollSnapAlign: 'start' }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(162,155,254,0.5)'; e.currentTarget.style.background = 'rgba(108,92,231,0.15)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(162,155,254,0.2)'; e.currentTarget.style.background = 'rgba(108,92,231,0.08)'; }}>
                    <div style={{ aspectRatio: '16/9', borderRadius: '8px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                      {pilot.playbackId ? (
                        <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=300`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={pilot.pilotTitle} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(162,155,254,0.2), rgba(108,92,231,0.1))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon component={Film} style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.25)' }} />
                        </div>
                      )}
                    </div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff', margin: '0 0 0.35rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pilot.pilotTitle}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: '#a29bfe', fontWeight: '600' }}>★ {pilot.stats.avgOverall.toFixed(2)}</span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>({pilot.stats.totalVotes} vote{pilot.stats.totalVotes !== 1 ? 's' : ''})</span>
                      <ResubmissionTag version={pilot.version} />
                      {getPilotBadges(pilot, allPilots).map(b => <PilotBadgeTag key={b.key} badge={b} />)}
                      {genreFilter === 'all' && (
                        <span style={{
                          padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.55rem', fontWeight: '700', textTransform: 'uppercase',
                          background: getGenreBg(pilot.genre),
                          color: getGenreColor(pilot.genre)
                        }}>{pilot.genre}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No pilots message */}
          {genreFilter !== 'directory' && filteredPilots.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px' }}>
              <Icon component={Film} style={{ width: '64px', height: '64px', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }} />
              <h3 style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                No {genreFilter !== 'all' ? genreFilter.toLowerCase() + ' ' : ''}pilots yet
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Check back soon for new content!</p>
            </div>
          )}
        </div>
      </div>
      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />

      {/* Video Modal (Window-in-Window) */}
      {selectedPilotModal && (
        <VideoModal
          pilot={selectedPilotModal}
          currentUser={currentUser}
          onClose={() => { setSelectedPilotModal(null); setPilotSelectionSource(null); }}
          onLogin={onLogin}
          onNavigate={onNavigate}
          onWatchAnother={() => {
            const next = getNextPilot();
            if (next.pilot) {
              selectPilot(next.pilot, next.source);
            } else if (next.allViewed) {
              // All pilots viewed - this will be handled by the modal
              return 'all_viewed';
            }
          }}
          onGoHome={() => { setSelectedPilotModal(null); setPilotSelectionSource(null); }}
          onOpenCreatorProfile={(creatorUserId) => {
            setSelectedPilotModal(null); // Close pilot modal first
            openCreatorProfile(creatorUserId);
          }}
          onVoteSubmit={(pilotId) => {
            // Add to voted pilots set so getNextPilot skips it
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
