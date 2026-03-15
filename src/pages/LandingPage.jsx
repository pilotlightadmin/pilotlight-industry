import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import StorageManager from '../services/StorageManager';
import VoterNdaModal from '../components/VoterNdaModal';
import { saveGlobalNdaAcceptance } from '../utils/helpers';
import '../styles/LandingPage.css';

const LandingPage = ({ onLogin, onForgotPassword }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [showConfirmPasswordSignup, setShowConfirmPasswordSignup] = useState(false);
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState('');

  // Form state
  const [loginForm, setLoginForm] = useState({
    emailOrUsername: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    location: '',
  });

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const location = data.city && data.country_name
        ? `${data.city}, ${data.country_name}`
        : data.country_name || '';
      setUserLocation(location);
      setSignupForm(prev => ({ ...prev, location }));
    } catch (err) {
      console.error('Location detection failed:', err);
      setSignupForm(prev => ({ ...prev, location: '' }));
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await StorageManager.loginWithPassword(
        loginForm.emailOrUsername,
        loginForm.password
      );

      if (result && result.success && result.voter) {
        onLogin(result.voter);
      } else {
        setError(result.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!signupForm.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!signupForm.email.trim()) {
      setError('Email is required');
      return;
    }
    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await StorageManager.registerWithPassword(
        signupForm.username,
        signupForm.email,
        signupForm.password,
        {
          gender: signupForm.gender || null,
          location: signupForm.location || null,
        }
      );

      if (result && result.success && result.voter) {
        // Store pending user and show NDA modal
        setPendingUser(result.voter);
        setShowNdaModal(true);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNdaAccept = async () => {
    try {
      // Save NDA acceptance
      await saveGlobalNdaAcceptance(pendingUser.id);
      setShowNdaModal(false);

      // Call onLogin callback
      onLogin(pendingUser);
    } catch (err) {
      setError('Failed to accept NDA. Please try again.');
    }
  };

  const handleNdaDecline = () => {
    setShowNdaModal(false);
    setPendingUser(null);
  };

  if (showNdaModal && pendingUser) {
    return (
      <VoterNdaModal
        userName={pendingUser.username}
        onAccept={handleNdaAccept}
        onDecline={handleNdaDecline}
      />
    );
  }

  return (
    <div className="landing-page">
      {/* Animated Flame SVG */}
      <div className="flame-container">
        <svg
          className="flame-svg"
          viewBox="0 0 100 120"
          width="80"
          height="96"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="flameGradient" cx="50%" cy="60%">
              <stop offset="0%" style={{ stopColor: '#e8c49a', stopOpacity: 1 }} />
              <stop offset="40%" style={{ stopColor: '#d4a574', stopOpacity: 0.9 }} />
              <stop offset="70%" style={{ stopColor: '#c77f3f', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: '#8b4513', stopOpacity: 0 }} />
            </radialGradient>
            <filter id="flameSoftGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Flame path with flicker animation */}
          <path
            className="flame-path"
            d="M 50 100 Q 35 80 35 60 Q 35 30 50 10 Q 65 30 65 60 Q 65 80 50 100 Z"
            fill="url(#flameGradient)"
            filter="url(#flameSoftGlow)"
            style={{ transformOrigin: '50% 60%' }}
          />

          {/* Inner glow layer */}
          <path
            className="flame-inner"
            d="M 50 95 Q 40 80 40 65 Q 40 40 50 20 Q 60 40 60 65 Q 60 80 50 95 Z"
            fill="#f5deb3"
            opacity="0.4"
            filter="url(#flameSoftGlow)"
            style={{ transformOrigin: '50% 60%' }}
          />
        </svg>

        {/* Ambient glow effect behind flame */}
        <div className="flame-glow"></div>
      </div>

      {/* Pilot Light Heading */}
      <h1 className="pilot-light-heading">Pilot Light</h1>

      {/* Tagline */}
      <p className="tagline">An Exclusive Screening Experience</p>

      {/* Main Content */}
      {!showNdaModal && (
        <div className="landing-content">
          {/* Initial state - just the Enter button */}
          {!isLoginMode && !showPasswordLogin && !showPasswordSignup && (
            <button
              className="enter-button"
              onClick={() => setShowPasswordLogin(true)}
            >
              Enter
            </button>
          )}

          {/* Login/Signup Toggle */}
          {(showPasswordLogin || showPasswordSignup) && (
            <div className="auth-form-container">
              {/* Toggle between login and signup */}
              <div className="auth-mode-toggle">
                <button
                  className={`toggle-btn ${showPasswordLogin ? 'active' : ''}`}
                  onClick={() => {
                    setShowPasswordLogin(true);
                    setShowPasswordSignup(false);
                    setError('');
                  }}
                >
                  Login
                </button>
                <button
                  className={`toggle-btn ${showPasswordSignup ? 'active' : ''}`}
                  onClick={() => {
                    setShowPasswordSignup(true);
                    setShowPasswordLogin(false);
                    setError('');
                  }}
                >
                  Signup
                </button>
              </div>

              {/* Error Message */}
              {error && <div className="error-message">{error}</div>}

              {/* Login Form */}
              {showPasswordLogin && !showPasswordSignup && (
                <form className="auth-form" onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <label htmlFor="emailOrUsername">Email or Username</label>
                    <input
                      type="text"
                      id="emailOrUsername"
                      name="emailOrUsername"
                      value={loginForm.emailOrUsername}
                      onChange={handleLoginChange}
                      placeholder="your@email.com or username"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswordLogin ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        placeholder="••••••••"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                      >
                        {showPasswordLogin ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="submit-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>

                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => onForgotPassword?.()}
                  >
                    Forgot Password?
                  </button>
                </form>
              )}

              {/* Signup Form */}
              {showPasswordSignup && !showPasswordLogin && (
                <form className="auth-form" onSubmit={handleSignupSubmit}>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={signupForm.username}
                      onChange={handleSignupChange}
                      placeholder="choose a username"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      placeholder="your@email.com"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswordSignup ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={signupForm.password}
                        onChange={handleSignupChange}
                        placeholder="••••••••"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPasswordSignup(!showPasswordSignup)}
                      >
                        {showPasswordSignup ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPasswordSignup ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={signupForm.confirmPassword}
                        onChange={handleSignupChange}
                        placeholder="••••••••"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPasswordSignup(!showConfirmPasswordSignup)}
                      >
                        {showConfirmPasswordSignup ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Gender (Optional)</label>
                    <select
                      id="gender"
                      name="gender"
                      value={signupForm.gender}
                      onChange={handleSignupChange}
                      disabled={isLoading}
                    >
                      <option value="">Select an option</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={signupForm.location}
                      onChange={handleSignupChange}
                      placeholder="Auto-detected or enter manually"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="submit-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>
              )}

              {/* Back button */}
              <button
                className="back-button"
                onClick={() => {
                  setShowPasswordLogin(false);
                  setShowPasswordSignup(false);
                  setError('');
                }}
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LandingPage;
