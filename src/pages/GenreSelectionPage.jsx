import React, { useState, useRef, useEffect } from 'react';
import { Film, Upload, BarChart3, Pencil, ChevronRight, Star, TrendingUp, Sparkles } from 'lucide-react';
import { FlameIcon, Icon } from '../components/Icons';
import PageFooter from '../components/PageFooter';

// Import icons for genre cards (ComedyIcon and DramaIcon should be custom components or from icons)
// These are placeholder - adjust based on your actual icon implementations
const ComedyIcon = ({ size }) => (
  <div style={{ fontSize: size, color: '#feca57' }}>😂</div>
);

const DramaIcon = ({ size }) => (
  <div style={{ fontSize: size, color: '#4ecdc4' }}>🎭</div>
);

const RealityTVIcon = ({ size }) => (
  <div style={{ fontSize: size, color: '#ff6b9d' }}>📺</div>
);

const StandUpIcon = ({ size }) => (
  <div style={{ fontSize: size, color: '#a29bfe' }}>🎤</div>
);

function GenreSelectionPage({ currentUser, onLogout, onSelectGenre, onPitchPilot, onLogin, onNavigate }) {
  const [showGenres, setShowGenres] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState(null); // null = closed, 'login' or 'signup'
  const genreRef = useRef(null);

  // Auto-scroll to genre section when it appears
  useEffect(() => {
    if (showGenres && genreRef.current) {
      setTimeout(() => {
        genreRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [showGenres]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header - Single Row */}
      <header style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FlameIcon size={24} />
          <span style={{ fontSize: '1.15rem', fontWeight: '700', background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pilot Light</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.95rem' }}>
          <span style={{ color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Home</span>
          <span onClick={() => onNavigate('browse')} style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Browse</span>
          {currentUser ? (
            <span onClick={() => onNavigate('account')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              {currentUser.name}
            </span>
          ) : (
            <span onClick={() => setLoginModalMode('login')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              Login
            </span>
          )}
        </nav>
      </header>

      {/* Main content */}
      <div style={{ flex: 1, padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)',
              padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.85rem',
              color: '#ff6b6b', fontWeight: '600', marginBottom: '1.5rem' }}>
              <Icon component={Film} style={{ width: '16px', height: '16px' }} />
              The New Pilot Season
            </div>
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

          {/* Choose Your Path */}
          <div style={{ marginBottom: '3rem' }}>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>Choose your adventure ↓</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
              {/* Creator Path - I Have a Show */}
              <button onClick={onPitchPilot}
                style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(254,202,87,0.15) 100%)',
                  border: '2px solid rgba(255,107,107,0.3)', borderRadius: '20px', padding: '2rem', cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'left' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(255,107,107,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Icon component={Upload} style={{ width: '28px', height: '28px' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.75rem 0', color: '#fff' }}>I Have a Show</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: '0 0 1rem 0' }}>Upload your pilot teaser and let real viewers tell you if you're onto something big.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.7rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>
                    <Icon component={Upload} style={{ width: '12px', height: '12px' }} /> Upload Teasers
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.7rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>
                    <Icon component={BarChart3} style={{ width: '12px', height: '12px' }} /> Get Analytics
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.7rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>
                    <Icon component={Pencil} style={{ width: '12px', height: '12px' }} /> Iterate
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff6b6b', fontWeight: '600' }}>
                  Enter Creator Portal <Icon component={ChevronRight} style={{ width: '20px', height: '20px' }} />
                </div>
              </button>

              {/* Voter Path - I Want to Watch */}
              <button onClick={() => onNavigate('browse')}
                style={{ background: 'linear-gradient(135deg, rgba(78,205,196,0.15) 0%, rgba(85,230,193,0.15) 100%)',
                  border: '2px solid rgba(78,205,196,0.3)', borderRadius: '20px', padding: '2rem', cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'left' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = '#4ecdc4'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(78,205,196,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'linear-gradient(135deg, #4ecdc4 0%, #55e6c1 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Icon component={Star} style={{ width: '28px', height: '28px' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.75rem 0', color: '#fff' }}>I Want to Watch</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: '0 0 1rem 0' }}>Discover fresh pilots before anyone else and help decide which ones deserve a season.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.7rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>
                    <Icon component={TrendingUp} style={{ width: '12px', height: '12px' }} /> Trending
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.7rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>
                    <Icon component={Star} style={{ width: '12px', height: '12px' }} /> Top Rated
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.7rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>
                    <Icon component={Sparkles} style={{ width: '12px', height: '12px' }} /> New Arrivals
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ecdc4', fontWeight: '600' }}>
                  Start Browsing <Icon component={ChevronRight} style={{ width: '20px', height: '20px' }} />
                </div>
              </button>
            </div>
          </div>

          {/* Genre Selection - Shows when "I Want to Watch" is clicked */}
          {showGenres && (
            <div ref={genreRef} style={{ marginBottom: '3rem' }}>
              <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', fontWeight: '600' }}>
                Pick a genre to start reviewing
              </p>
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {/* Comedy Card */}
                <div onClick={() => onSelectGenre('Comedy')}
                  style={{ width: '280px', background: 'linear-gradient(135deg, rgba(254,202,87,0.15) 0%, rgba(255,107,107,0.1) 100%)',
                    borderRadius: '20px', padding: '2rem', border: '2px solid rgba(254,202,87,0.3)',
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(254,202,87,0.3)'; e.currentTarget.style.borderColor = '#feca57'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(254,202,87,0.3)'; }}>
                  <div style={{ marginBottom: '1rem' }}><ComedyIcon size={70} /></div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#feca57' }}>Comedy</h2>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Hilarious pilots that brighten your day</p>
                </div>

                {/* Drama Card */}
                <div onClick={() => onSelectGenre('Drama')}
                  style={{ width: '280px', background: 'linear-gradient(135deg, rgba(78,205,196,0.15) 0%, rgba(107,137,255,0.1) 100%)',
                    borderRadius: '20px', padding: '2rem', border: '2px solid rgba(78,205,196,0.3)',
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(78,205,196,0.3)'; e.currentTarget.style.borderColor = '#4ecdc4'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.3)'; }}>
                  <div style={{ marginBottom: '1rem' }}><DramaIcon size={70} /></div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#4ecdc4' }}>Drama</h2>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Compelling stories that move and inspire</p>
                </div>

                {/* Reality TV Card */}
                <div onClick={() => onSelectGenre('Reality TV')}
                  style={{ width: '280px', background: 'linear-gradient(135deg, rgba(255,107,157,0.15) 0%, rgba(253,121,168,0.1) 100%)',
                    borderRadius: '20px', padding: '2rem', border: '2px solid rgba(255,107,157,0.3)',
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(255,107,157,0.3)'; e.currentTarget.style.borderColor = '#ff6b9d'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,107,157,0.3)'; }}>
                  <div style={{ marginBottom: '1rem' }}><RealityTVIcon size={70} /></div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#ff6b9d' }}>Reality TV</h2>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Unscripted concepts that capture real life</p>
                </div>

                {/* Stand Up Card */}
                <div onClick={() => onSelectGenre('Stand Up')}
                  style={{ width: '280px', background: 'linear-gradient(135deg, rgba(162,155,254,0.15) 0%, rgba(108,92,231,0.1) 100%)',
                    borderRadius: '20px', padding: '2rem', border: '2px solid rgba(162,155,254,0.3)',
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(162,155,254,0.3)'; e.currentTarget.style.borderColor = '#a29bfe'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(162,155,254,0.3)'; }}>
                  <div style={{ marginBottom: '1rem' }}><StandUpIcon size={70} /></div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#a29bfe' }}>Stand Up</h2>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Fresh comedy voices hitting the mic</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with navigation links */}
      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />

    </div>
  );
}

export default GenreSelectionPage;
