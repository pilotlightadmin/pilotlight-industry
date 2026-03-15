import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icons';
import { Users, TrendingUp, Sparkles, Star, Film } from 'lucide-react';
import StorageManager from '../services/StorageManager';
import LoginModal from '../pages/LoginModal';
import { ResubmissionTag, getPilotBadges, PilotBadgeTag } from '../utils/badges';
import { FlameIcon, AnimatedFlameIcon } from '../components/Icons';
import PageFooter from '../components/PageFooter';

function GenreLandingPage({ genre, currentUser, onLogout, onSelectPilot, onBack, onPitchPilot, onLogin, onNavigate, onSwitchGenre }) {
  const [featuredPilots, setFeaturedPilots] = useState({ popular: null, trending: null, new: null });
  const [otherPilots, setOtherPilots] = useState([]);
  const [allPilots, setAllPilots] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loginModalMode, setLoginModalMode] = useState(null); // null = closed, 'login' or 'signup'

  const genreColors = {
    Comedy: { primary: '#feca57', secondary: '#ff6b6b', gradient: 'linear-gradient(135deg, rgba(254,202,87,0.2) 0%, rgba(255,107,107,0.1) 100%)' },
    Drama: { primary: '#4ecdc4', secondary: '#6b89ff', gradient: 'linear-gradient(135deg, rgba(78,205,196,0.2) 0%, rgba(107,137,255,0.1) 100%)' },
    'Reality TV': { primary: '#ff6b9d', secondary: '#fd79a8', gradient: 'linear-gradient(135deg, rgba(255,107,157,0.2) 0%, rgba(253,121,168,0.1) 100%)' },
    'Stand Up': { primary: '#a29bfe', secondary: '#6c5ce7', gradient: 'linear-gradient(135deg, rgba(162,155,254,0.2) 0%, rgba(108,92,231,0.1) 100%)' }
  };
  const colors = genreColors[genre] || genreColors.Comedy;

  useEffect(() => {
    // Reset state when genre changes
    setLoading(true);
    setFeaturedPilots({ popular: null, trending: null, new: null });
    setOtherPilots([]);
    setCarouselIndex(0);

    const loadPilots = async () => {
      try {
        // Stats are now included from Airtable rollups - no separate fetch needed
        const fetchedPilots = await StorageManager.getPilotsForVoting();
        setAllPilots(fetchedPilots);
        // Filter by genre
        const genrePilots = fetchedPilots.filter(p => p.genre === genre);

        if (genrePilots.length > 0) {
          const withVotes = genrePilots.filter(p => p.stats && p.stats.totalVotes > 0);

          // Sort by different criteria
          const byVoteCount = [...withVotes].sort((a, b) => (b.stats.totalVotes || 0) - (a.stats.totalVotes || 0));
          const byRating = [...withVotes].sort((a, b) => parseFloat(b.stats.avgOverall || 0) - parseFloat(a.stats.avgOverall || 0));
          const byDate = [...genrePilots].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // Assign featured slots, avoiding duplicates
          const usedIds = new Set();
          let popular = null, trending = null, newest = null;

          // Popular = most reviews (votes)
          if (byVoteCount.length > 0) {
            popular = byVoteCount[0];
            usedIds.add(popular.id);
          }

          // Trending = highest rating (different from popular)
          for (const p of byRating) {
            if (!usedIds.has(p.id)) {
              trending = p;
              usedIds.add(p.id);
              break;
            }
          }

          // New = most recently uploaded (different from popular and trending)
          for (const p of byDate) {
            if (!usedIds.has(p.id)) {
              newest = p;
              usedIds.add(p.id);
              break;
            }
          }

          // If not enough pilots with votes, fill from newest
          if (!popular && byDate.length >= 1) {
            popular = byDate[0];
            usedIds.add(popular.id);
          }
          if (!trending && byDate.length >= 2) {
            for (const p of byDate) {
              if (!usedIds.has(p.id)) {
                trending = p;
                usedIds.add(p.id);
                break;
              }
            }
          }
          if (!newest) {
            for (const p of byDate) {
              if (!usedIds.has(p.id)) {
                newest = p;
                usedIds.add(p.id);
                break;
              }
            }
          }

          setFeaturedPilots({ popular, trending, new: newest });

          // Other pilots = all except featured
          const featuredIds = [popular?.id, trending?.id, newest?.id].filter(Boolean);
          setOtherPilots(genrePilots.filter(p => !featuredIds.includes(p.id)));
        }
      } catch (err) {
        console.error('Error loading pilots:', err);
      }
      setLoading(false);
    };
    loadPilots();
  }, [genre]);

  const visibleCarousel = otherPilots.slice(carouselIndex, carouselIndex + 4);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedFlameIcon size={64} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }} onClick={onBack}>
          <FlameIcon size={24} />
          <span style={{ fontSize: '1.15rem', fontWeight: '700', background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pilot Light</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.95rem' }}>
          <span onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </span>
          <span onClick={onBack} style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Browse</span>
          {['Comedy', 'Drama', 'Reality TV', 'Stand Up'].map(g => (
            <span key={g} onClick={() => onSwitchGenre(g)} style={{ color: genre === g ? '#fff' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: genre === g ? '600' : '400', whiteSpace: 'nowrap' }}>{g}</span>
          ))}
          {currentUser ? (
            <span onClick={() => onNavigate('account')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              {currentUser.name}
            </span>
          ) : (
            <span onClick={() => setLoginModalMode('login')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              Login
            </span>
          )}
        </nav>
      </header>

      {/* Login Modal */}
      {loginModalMode && (
        <LoginModal
          onClose={() => setLoginModalMode(null)}
          onLogin={(user) => { onLogin(user); setLoginModalMode(null); }}
          onForgotPassword={() => { setLoginModalMode(null); onNavigate('forgot-password'); }}
          initialMode={loginModalMode}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Genre Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <div style={{ width: '60px', height: '4px', background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, borderRadius: '2px', margin: '0 auto' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '800', margin: '0 0 0.75rem',
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {genre} Pilots
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.6)', maxWidth: '500px', margin: '0 auto' }}>
              {genre === 'Comedy' ? 'Discover the funniest new shows before they hit the screen' : genre === 'Drama' ? 'Explore compelling dramatic stories waiting to be told' : genre === 'Reality TV' ? 'Unscripted concepts that capture real life' : genre === 'Stand Up' ? 'Fresh comedy voices hitting the mic' : 'Discover new pilots before they hit the screen'}
            </p>
          </div>

          {/* Featured Section */}
          {(featuredPilots.popular || featuredPilots.trending || featuredPilots.new) && (
            <div style={{ marginBottom: '4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                <FlameIcon size={24} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: colors.primary }}>Featured {genre}</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {[
                  { pilot: featuredPilots.popular, label: 'POPULAR', icon: Users, color: '#ff6b6b', description: 'Most Reviewed' },
                  { pilot: featuredPilots.trending, label: 'TRENDING', icon: TrendingUp, color: colors.primary, description: 'Highest Rated' },
                  { pilot: featuredPilots.new, label: 'NEW', icon: Sparkles, color: '#4ecdc4', description: 'Just Added' }
                ].filter(item => item.pilot).map(({ pilot, label, icon, color, description }) => (
                  <div key={pilot.id} onClick={() => onSelectPilot(pilot)}
                    style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1.25rem',
                      border: `1px solid ${color}40`, cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${color}30`; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ position: 'absolute', top: '-8px', left: '16px', background: color, borderRadius: '20px',
                      padding: '0.25rem 0.75rem', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#000' }}>
                      <Icon component={icon} style={{ width: '12px', height: '12px' }} /> {label}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      {pilot.playbackId ? (
                        <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=400`}
                          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '10px', marginBottom: '1rem' }}
                          alt={pilot.pilotTitle} />
                      ) : (
                        <div style={{ width: '100%', aspectRatio: '16/9', background: colors.gradient,
                          borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon component={Film} style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.3)' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0', color: '#fff' }}>{pilot.pilotTitle}</h3>
                        <ResubmissionTag version={pilot.version} />
                        {getPilotBadges(pilot, allPilots).map(b => <PilotBadgeTag key={b.key} badge={b} />)}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.5rem', lineHeight: '1.4',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pilot.logline}</p>
                      {pilot.stats && pilot.stats.totalVotes > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                          <Icon component={Star} style={{ width: '14px', height: '14px', color: '#feca57' }} />
                          <span style={{ fontSize: '0.85rem', color: '#feca57', fontWeight: '600' }}>
                            {pilot.stats.avgOverall.toFixed(2)}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                            ({pilot.stats.totalVotes} {pilot.stats.totalVotes === 1 ? 'Review' : 'Reviews'})
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Be the first to review!</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* More Pilots Reel - Horizontal Scroll */}
          {otherPilots.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 1.5rem', color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                More {genre} Pilots
              </h2>
              <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                {otherPilots.map(pilot => (
                  <div key={pilot.id} onClick={() => onSelectPilot(pilot)}
                    style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '1rem',
                      border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.3s',
                      minWidth: '260px', maxWidth: '260px', flexShrink: 0, scrollSnapAlign: 'start' }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${colors.primary}50`; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                    {pilot.playbackId ? (
                      <img src={`https://image.mux.com/${pilot.playbackId}/thumbnail.png?width=300`}
                        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem' }}
                        alt={pilot.pilotTitle} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '16/9', background: colors.gradient,
                        borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon component={Film} style={{ width: '36px', height: '36px', color: 'rgba(255,255,255,0.25)' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0', color: '#fff' }}>{pilot.pilotTitle}</h3>
                      <ResubmissionTag version={pilot.version} />
                      {getPilotBadges(pilot, allPilots).map(b => <PilotBadgeTag key={b.key} badge={b} />)}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.4rem', lineHeight: '1.4',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pilot.logline}</p>
                    {pilot.stats && pilot.stats.totalVotes > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                        <Icon component={Star} style={{ width: '12px', height: '12px', color: '#feca57' }} />
                        <span style={{ fontSize: '0.75rem', color: '#feca57', fontWeight: '600' }}>
                          {pilot.stats.avgOverall.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                          ({pilot.stats.totalVotes})
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No pilots message */}
          {!featuredPilots.popular && !featuredPilots.trending && !featuredPilots.new && otherPilots.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px' }}>
              <Icon component={Film} style={{ width: '64px', height: '64px', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }} />
              <h3 style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>No {genre.toLowerCase()} pilots yet</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Be the first to pitch a {genre.toLowerCase()} pilot!</p>
            </div>
          )}
        </div>
      </div>
      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />
    </div>
  );
}

export default GenreLandingPage;
