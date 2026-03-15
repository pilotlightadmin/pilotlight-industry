import React, { useState, useEffect, useRef } from 'react';
import StorageManager from './services/StorageManager';
import { AnimatedFlameIcon } from './components/Icons';

// Pages
import LandingPage from './pages/LandingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ViewingRoom from './pages/ViewingRoom';
import SeasonView from './pages/SeasonView';
import AllPilotsView from './pages/AllPilotsView';
import VideoPage from './pages/VideoPage';
import CreatorPortalNew from './pages/CreatorPortal';
import CreatorUploadNew from './pages/CreatorUploadNew';
import UploadSuccessPage from './pages/UploadSuccessPage';
import AccountPage from './pages/AccountPage';

function PilotLightPlatform() {
  const [currentView, setCurrentView] = useState('landing');
  const [pilots, setPilots] = useState([]);
  const [selectedPilot, setSelectedPilot] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetToken, setResetToken] = useState(null);
  const [pilotsRemaining, setPilotsRemaining] = useState(0);

  // === PASSWORD RESET TOKEN FROM URL ===
  // Detect #reset-password?token=xxx on page load (from email link)
  // This ref ensures init() and history setup respect the reset-password view
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

  // Store browse scroll position for "Continue Browsing" functionality
  const browseScrollRef = useRef(0);

  // Browser history support - navigate with history tracking
  const navigateTo = (view, options = {}) => {
    const { replace = false } = options;
    setCurrentView(view);
  };

  // Push to history whenever currentView changes (except from popstate)
  useEffect(() => {
    if (loading) return;
    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      previousViewRef.current = currentView;
      return;
    }
    // Only push if view actually changed
    if (previousViewRef.current !== currentView) {
      const state = { view: currentView, pilotId: selectedPilot?.id };
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
      } else {
        // Fallback to landing if no state
        setCurrentView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Set initial history state on mount (but don't overwrite reset-password URL)
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
        pilotId: selectedPilot?.id || null
      };
      localStorage.setItem('pilotlight_nav', JSON.stringify(navState));
    }
  }, [currentView, selectedPilot, loading]);

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
          // Refresh voter data — use getVoters if we have a valid token
          let voter = cachedVoter;
          try {
            const allVoters = await StorageManager.getVoters();
            const freshVoter = allVoters.find(v => v.id === cachedVoter.id);
            if (freshVoter) {
              voter = { ...cachedVoter, ...freshVoter };
              StorageManager.setCurrentVoter(voter);
            }
          } catch (e) {
            // If refresh fails (e.g. expired token), use cached data
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

              // Restore selected pilot if needed
              if (navState.pilotId && navState.view === 'video') {
                const allPilots = await StorageManager.getPilotsForVoting();
                const pilot = allPilots.find(p => p.id === navState.pilotId);
                if (pilot) {
                  setSelectedPilot(pilot);
                  setCurrentView(navState.view);
                } else {
                  // Pilot not found, go to viewing-room
                  setCurrentView('viewing-room');
                }
              } else if (['viewing-room', 'season', 'all-pilots', 'creator-portal', 'creator-upload', 'upload-success', 'account'].includes(navState.view)) {
                setCurrentView(navState.view);
              } else {
                setCurrentView(navState.view || 'viewing-room');
              }
            } catch (e) {
              console.error('Error restoring nav state:', e);
              setCurrentView('viewing-room');
            }
          } else {
            setCurrentView('viewing-room');
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
      // Update in Airtable as well
      try {
        await StorageManager.approveCreatorApplication(user.id);
      } catch (e) {
        console.log('Admin auto-approval (local only):', e);
      }
    }

    // Determine target view BEFORE setting state to avoid race conditions
    let targetView = 'viewing-room';
    if (currentView === 'video') {
      targetView = 'video'; // Stay on video page
    }

    // Set user AND view together before any async operations
    setCurrentUser(user);
    setCurrentView(targetView);
    StorageManager.setCurrentVoter(user);

    // Load pilots async (won't affect navigation)
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
      setPilotsRemaining(0);
      setCurrentView('landing');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5f0eb' }}>
        <div style={{ textAlign: 'center' }}>
          <AnimatedFlameIcon size={72} style={{ marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.2rem', color: 'rgba(245,240,235,0.8)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    // Auth guard: if a route requires auth and user is not logged in, redirect to landing
    const authRequired = ['viewing-room', 'season', 'all-pilots', 'video', 'creator-portal', 'creator-upload', 'upload-success', 'account'].includes(currentView);
    if (authRequired && !currentUser) {
      return <LandingPage
        onLogin={(user) => handleLogin(user)}
        onForgotPassword={() => setCurrentView('forgot-password')} />;
    }

    switch(currentView) {
      case 'landing':
        return <LandingPage
          onLogin={(user) => handleLogin(user)}
          onForgotPassword={() => setCurrentView('forgot-password')} />;
      case 'forgot-password':
        return <ForgotPasswordPage
          onBack={() => setCurrentView('landing')}
          onResetSent={() => setCurrentView('reset-password')} />;
      case 'reset-password':
        return <ResetPasswordPage
          token={resetToken}
          onSuccess={() => { setResetToken(null); setCurrentView('landing'); }}
          onBack={() => { setResetToken(null); setCurrentView('landing'); }} />;
      case 'viewing-room':
        if (!currentUser) { setCurrentView('landing'); return null; }
        return <ViewingRoom
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={(view) => setCurrentView(view)}
          onSelectPilot={(pilot) => { setSelectedPilot(pilot); setCurrentView('video'); }} />;
      case 'season':
        if (!currentUser) { setCurrentView('landing'); return null; }
        return <SeasonView
          currentUser={currentUser}
          onLogout={handleLogout}
          onBack={() => setCurrentView('viewing-room')}
          onSelectPilot={(pilot) => { setSelectedPilot(pilot); setCurrentView('video'); }}
          onNavigate={(view) => setCurrentView(view)} />;
      case 'all-pilots':
        if (!currentUser) { setCurrentView('landing'); return null; }
        return <AllPilotsView
          currentUser={currentUser}
          onLogout={handleLogout}
          onBack={() => setCurrentView('viewing-room')}
          onSelectPilot={(pilot) => { setSelectedPilot(pilot); setCurrentView('video'); }}
          onNavigate={(view) => setCurrentView(view)} />;
      case 'video':
        return <VideoPage
          pilot={selectedPilot}
          currentUser={currentUser}
          pilotsRemaining={pilotsRemaining}
          onContinueBrowsing={() => {
            if (currentUser) {
              setCurrentView('viewing-room');
            } else {
              setCurrentView('landing');
            }
          }}
          onLogin={(user) => handleLogin(user)}
          onNavigate={(view) => setCurrentView(view)}
          onReviewAnother={async () => {
            if (!currentUser) {
              setCurrentView('landing');
              return;
            }
            const allPilots = await StorageManager.getPilotsForVoting();
            const votedIds = await StorageManager.getVoterVotedPilots(currentUser.id);
            const unvoted = allPilots.filter(p => !votedIds.includes(p.id) && p.id !== selectedPilot?.id);
            if (unvoted.length > 0) {
              const randomPilot = unvoted[Math.floor(Math.random() * unvoted.length)];
              setSelectedPilot(randomPilot);
              setPilotsRemaining(unvoted.length - 1);
            } else {
              setPilotsRemaining(0);
              setCurrentView('viewing-room');
            }
          }} />;
      case 'creator-portal':
        if (!currentUser) { setCurrentView('landing'); return null; }
        // Only approved creators can access the portal
        if (currentUser.creatorStatus !== 'approved') {
          setCurrentView('viewing-room');
          return null;
        }
        return <CreatorPortalNew
          currentUser={currentUser}
          pilots={pilots}
          onHome={() => setCurrentView('viewing-room')}
          onUploadNew={() => setCurrentView('creator-upload')}
          onSelectPilot={(pilot) => { setSelectedPilot(pilot); setCurrentView('video'); }}
          onRefreshPilots={refreshPilots}
          onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
          onLogout={handleLogout} />;
      case 'creator-upload':
        if (!currentUser) { setCurrentView('landing'); return null; }
        // Only approved creators can upload
        if (currentUser.creatorStatus !== 'approved') {
          setCurrentView('viewing-room');
          return null;
        }
        return <CreatorUploadNew
          currentUser={currentUser}
          onHome={() => setCurrentView('viewing-room')}
          onBack={() => setCurrentView('creator-portal')}
          onSubmit={async () => { await refreshPilots(); setCurrentView('upload-success'); }} />;
      case 'upload-success':
        return <UploadSuccessPage
          onHome={() => setCurrentView('viewing-room')}
          onCreatorPortal={() => setCurrentView('creator-portal')} />;
      case 'account':
        if (!currentUser) { setCurrentView('landing'); return null; }
        return <AccountPage
          currentUser={currentUser}
          onBack={() => setCurrentView('viewing-room')}
          onNavigate={(view) => setCurrentView(view)}
          onLogout={handleLogout} />;
      default:
        // Default routing based on auth state
        if (currentUser) {
          return <ViewingRoom
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigate={(view) => setCurrentView(view)}
            onSelectPilot={(pilot) => { setSelectedPilot(pilot); setCurrentView('video'); }} />;
        } else {
          return <LandingPage
            onLogin={(user) => handleLogin(user)}
            onForgotPassword={() => setCurrentView('forgot-password')} />;
        }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif', color: '#f5f0eb' }}>
      {renderView()}
    </div>
  );
}

export default PilotLightPlatform;
