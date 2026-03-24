import React, { useState, useEffect, useRef } from 'react';
import StorageManager from './services/StorageManager';

// Original public pages
import LandingPageWall from './pages/LandingPageWall';
import BrowsePage from './pages/BrowsePage';
import GenreLandingPage from './pages/GenreLandingPage';
import GenreSelectionPage from './pages/GenreSelectionPage';
import CreatorsLandingPage from './pages/CreatorsLandingPage';
import CreatorApplyPage from './pages/CreatorApplyPage';
import CreatorApplicationPendingPage from './pages/CreatorApplicationPendingPage';
import CreatorPortal from './pages/CreatorPortal';
import CreatorUploadNew from './pages/CreatorUploadNew';
import UploadSuccessPage from './pages/UploadSuccessPage';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PilotAnalytics from './pages/PilotAnalytics';

function PilotLightPlatform() {
  const [currentView, setCurrentView] = useState('landing');
  const [pilots, setPilots] = useState([]);
  const [selectedPilot, setSelectedPilot] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetToken, setResetToken] = useState(null);

  // === PASSWORD RESET TOKEN FROM URL ===
  const resetPasswordDetectedRef = useRef(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#reset-password')) {
      const queryPart = hash.split('?')[1];
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        const token = params.get('token');
        if (token) {
          resetPasswordDetectedRef.current = true;
          setResetToken(token);
          setCurrentView('reset-password');
        }
      }
    }
  }, []);

  // Track if we're handling a popstate event (to avoid pushing history)
  const isPopstateRef = useRef(false);
  const previousViewRef = useRef(currentView);

  // Push to history whenever currentView changes (except from popstate)
  useEffect(() => {
    if (loading) return;
    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      previousViewRef.current = currentView;
      return;
    }
    if (previousViewRef.current !== currentView) {
      const state = { view: currentView, pilotId: selectedPilot?.id, genre: selectedGenre };
      window.history.pushState(state, '', `#${currentView}`);
      previousViewRef.current = currentView;
    }
  }, [currentView, loading]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      isPopstateRef.current = true;
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        if (event.state.genre) setSelectedGenre(event.state.genre);
      } else {
        setCurrentView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);

    if (!window.history.state && !resetPasswordDetectedRef.current) {
      window.history.replaceState({ view: 'landing' }, '', '#landing');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save navigation state to localStorage whenever it changes
  useEffect(() => {
    if (!loading && currentView !== 'landing') {
      const navState = {
        view: currentView,
        pilotId: selectedPilot?.id || null,
        genre: selectedGenre || null
      };
      localStorage.setItem('pilotlight_nav', JSON.stringify(navState));
    }
  }, [currentView, selectedPilot, selectedGenre, loading]);

  useEffect(() => {
    const init = async () => {
      try {
        // If reset-password was detected from URL, skip normal init routing
        if (resetPasswordDetectedRef.current) {
          setLoading(false);
          return;
        }

        // Check for voter session (unified login)
        const cachedVoter = StorageManager.getCurrentVoter();
        const hasSessionToken = !!localStorage.getItem('pilotLightSessionToken');

        // If cached voter but no session token, clear stale pre-migration session
        if (cachedVoter && !hasSessionToken) {
          StorageManager.logoutVoter();
          setCurrentView('landing');
          setLoading(false);
          return;
        }

        if (cachedVoter) {
          // Refresh voter data
          let voter = cachedVoter;
          try {
            const allVoters = await StorageManager.getVoters();
            const freshVoter = allVoters.find(v => v.id === cachedVoter.id);
            if (freshVoter) {
              voter = { ...cachedVoter, ...freshVoter };
              StorageManager.setCurrentVoter(voter);
            }
          } catch (e) {
            console.warn('Could not refresh voter data:', e.message);
          }

          setCurrentUser(voter);
          const myPilots = await StorageManager.getMyPilots(voter.id);
          setPilots(myPilots || []);

          // Restore navigation state from localStorage
          const savedNav = localStorage.getItem('pilotlight_nav');
          if (savedNav) {
            try {
              const navState = JSON.parse(savedNav);
              const validViews = ['browse', 'genre-landing', 'genre-selection', 'creators-landing',
                'creator-apply', 'creator-application-pending', 'creator-portal', 'creator-upload',
                'upload-success', 'account', 'about', 'privacy', 'terms', 'pilot-analytics'];
              if (navState.genre) setSelectedGenre(navState.genre);
              if (validViews.includes(navState.view)) {
                setCurrentView(navState.view);
              } else {
                setCurrentView('browse');
              }
            } catch (e) {
              console.error('Error restoring nav state:', e);
              setCurrentView('browse');
            }
          } else {
            setCurrentView('browse');
          }
        } else {
          // No user logged in - go to landing
          setCurrentView('landing');
        }
      } catch (err) {
        console.error('Error initializing app:', err);
      }
      setLoading(false);
    };
    init();
  }, []);

  const refreshPilots = async () => {
    if (currentUser) {
      try {
        const myPilots = await StorageManager.getMyPilots(currentUser.id);
        setPilots(myPilots || []);
      } catch (err) {
        console.error('Error refreshing pilots:', err);
      }
    }
  };

  // Auto-scroll to top when navigating to a new page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleLogin = async (user) => {
    // Grant automatic creator access to admin account
    if (user.email === 'admin@pilotlighthq.com' && user.creatorStatus !== 'approved') {
      user.creatorStatus = 'approved';
      try {
        await StorageManager.approveCreatorApplication(user.id);
      } catch (e) {
        console.log('Admin auto-approval (local only):', e);
      }
    }

    // After login, go to browse (the main hub)
    setCurrentUser(user);
    setCurrentView('browse');
    StorageManager.setCurrentVoter(user);

    // Load pilots async
    try {
      const myPilots = await StorageManager.getMyPilots(user.id);
      setPilots(myPilots || []);
    } catch (err) {
      console.error('Error loading pilots after login:', err);
      setPilots([]);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      StorageManager.logoutVoter();
      localStorage.removeItem('pilotlight_nav');
      setCurrentUser(null);
      setPilots([]);
      setSelectedPilot(null);
      setSelectedGenre(null);
      setCurrentView('landing');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a2e',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', margin: '0 auto 1rem',
            background: 'radial-gradient(circle, #feca57 0%, #ff6b6b 50%, rgba(255,107,107,0.4) 100%)',
            animation: 'warmGlow 2s ease-in-out infinite',
            boxShadow: '0 0 40px rgba(254, 202, 87, 0.4)'
          }} />
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    // Auth guard: these routes require a logged-in user
    const authRequired = ['browse', 'genre-landing', 'genre-selection', 'creator-portal',
      'creator-upload', 'upload-success', 'account', 'pilot-analytics'].includes(currentView);
    if (authRequired && !currentUser) {
      return <LandingPageWall onLoginSuccess={(user) => handleLogin(user)} />;
    }

    switch(currentView) {
      case 'landing':
        return <LandingPageWall onLoginSuccess={(user) => handleLogin(user)} />;

      case 'forgot-password':
        return <ForgotPasswordPage
          onBack={() => setCurrentView('landing')}
          onResetSent={() => setCurrentView('reset-password')} />;

      case 'reset-password':
        return <ResetPasswordPage
          token={resetToken}
          onSuccess={() => { setResetToken(null); setCurrentView('landing'); }}
          onBack={() => { setResetToken(null); setCurrentView('landing'); }} />;

      case 'browse':
        return <BrowsePage
          currentUser={currentUser}
          onLogout={handleLogout}
          onSelectPilot={(pilot) => { setSelectedPilot(pilot); }}
          onLogin={(user) => handleLogin(user)}
          onNavigate={(view) => setCurrentView(view)} />;

      case 'genre-landing':
        return <GenreLandingPage
          genre={selectedGenre}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSelectPilot={(pilot) => { setSelectedPilot(pilot); }}
          onBack={() => setCurrentView('browse')}
          onPitchPilot={() => setCurrentView('creators-landing')}
          onLogin={(user) => handleLogin(user)}
          onNavigate={(view) => setCurrentView(view)}
          onSwitchGenre={(genre) => { setSelectedGenre(genre); }} />;

      case 'genre-selection':
        return <GenreSelectionPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onSelectGenre={(genre) => { setSelectedGenre(genre); setCurrentView('genre-landing'); }}
          onPitchPilot={() => setCurrentView('creators-landing')}
          onLogin={(user) => handleLogin(user)}
          onNavigate={(view) => setCurrentView(view)} />;

      case 'creators-landing':
        return <CreatorsLandingPage
          currentUser={currentUser}
          onBack={() => setCurrentView('browse')}
          onNavigate={(view) => setCurrentView(view)}
          onApply={() => setCurrentView('creator-apply')}
          onLogin={(user) => handleLogin(user)} />;

      case 'creator-apply':
        if (!currentUser) { setCurrentView('landing'); return null; }
        return <CreatorApplyPage
          currentUser={currentUser}
          onBack={() => setCurrentView('creators-landing')}
          onSubmit={() => setCurrentView('creator-application-pending')}
          onNavigate={(view) => setCurrentView(view)} />;

      case 'creator-application-pending':
        return <CreatorApplicationPendingPage
          onBrowse={() => setCurrentView('browse')}
          onNavigate={(view) => setCurrentView(view)} />;

      case 'creator-portal':
        if (!currentUser) { setCurrentView('landing'); return null; }
        if (currentUser.creatorStatus !== 'approved') {
          setCurrentView('browse');
          return null;
        }
        return <CreatorPortal
          currentUser={currentUser}
          pilots={pilots}
          onHome={() => setCurrentView('browse')}
          onUploadNew={() => setCurrentView('creator-upload')}
          onSelectPilot={(pilot) => { setSelectedPilot(pilot); }}
          onRefreshPilots={refreshPilots}
          onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
          onLogout={handleLogout} />;

      case 'creator-upload':
        if (!currentUser) { setCurrentView('landing'); return null; }
        if (currentUser.creatorStatus !== 'approved') {
          setCurrentView('browse');
          return null;
        }
        return <CreatorUploadNew
          currentUser={currentUser}
          onHome={() => setCurrentView('browse')}
          onBack={() => setCurrentView('creator-portal')}
          onSubmit={async () => { await refreshPilots(); setCurrentView('upload-success'); }} />;

      case 'upload-success':
        return <UploadSuccessPage
          onHome={() => setCurrentView('browse')}
          onCreatorPortal={() => setCurrentView('creator-portal')} />;

      case 'account':
        if (!currentUser) { setCurrentView('landing'); return null; }
        return <AccountPage
          currentUser={currentUser}
          onBack={() => setCurrentView('browse')}
          onNavigate={(view) => setCurrentView(view)}
          onLogout={handleLogout} />;

      case 'about':
        return <AboutPage
          currentUser={currentUser}
          onBack={() => setCurrentView('browse')}
          onNavigate={(view) => setCurrentView(view)} />;

      case 'privacy':
        return <PrivacyPage
          currentUser={currentUser}
          onBack={() => setCurrentView('browse')}
          onNavigate={(view) => setCurrentView(view)} />;

      case 'terms':
        return <TermsPage
          currentUser={currentUser}
          onBack={() => setCurrentView('browse')}
          onNavigate={(view) => setCurrentView(view)} />;

      case 'pilot-analytics':
        return <PilotAnalytics
          pilot={selectedPilot}
          onBack={() => setCurrentView('creator-portal')}
          onRefresh={refreshPilots} />;

      default:
        if (currentUser) {
          return <BrowsePage
            currentUser={currentUser}
            onLogout={handleLogout}
            onSelectPilot={(pilot) => { setSelectedPilot(pilot); }}
            onLogin={(user) => handleLogin(user)}
            onNavigate={(view) => setCurrentView(view)} />;
        } else {
          return <LandingPageWall onLoginSuccess={(user) => handleLogin(user)} />;
        }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif', color: '#fff' }}>
      {renderView()}
    </div>
  );
}

export default PilotLightPlatform;
