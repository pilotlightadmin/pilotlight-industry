import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import StorageManager from '../services/StorageManager';
import { FlameIcon } from '../components/Icons';
import '../styles/LandingPage.css';

const LandingPage = ({ onLogin }) => {
  const [view, setView] = useState('enter'); // 'enter', 'email', 'memberCode', 'createPassword', 'password'
  const [animClass, setAnimClass] = useState('');
  const [email, setEmail] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1); // 1 = enter password, 2 = confirm password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const timeoutRef = useRef(null);

  const transitionTo = (nextView) => {
    setError('');
    setAnimClass('roll-out');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setView(nextView);
      setAnimClass('roll-in');
    }, 300);
  };

  // Step 1: Check email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await StorageManager.checkEmail(email.trim());
      if (!result.success) {
        setError(result.message || 'Failed to check email.');
      } else if (!result.found) {
        setError('No account found with that email.');
      } else if (result.hasPassword) {
        transitionTo('password');
      } else {
        transitionTo('memberCode');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Validate member code
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!memberCode.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await StorageManager.validateMemberCode(email, memberCode.trim());
      if (result.success && result.codeValid) {
        transitionTo('createPassword');
      } else {
        setError(result.message || 'Invalid member code.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Create password (two sub-steps)
  const handleCreatePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordStep === 1) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setPasswordStep(2);
      setAnimClass('roll-out');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setAnimClass('roll-in');
      }, 300);
      return;
    }
    // Step 2: confirm
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await StorageManager.activateAccount(email, memberCode, password);
      if (result.success && result.voter) {
        onLogin(result.voter);
      } else {
        setError(result.message || 'Failed to activate account.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Returning user: password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await StorageManager.loginWithPassword(email, password);
      if (result && result.success && result.voter) {
        onLogin(result.voter);
      } else {
        setError(result?.message || 'Incorrect password.');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setPasswordStep(1);
    if (view === 'email') {
      transitionTo('enter');
      setEmail('');
    } else if (view === 'memberCode') {
      transitionTo('email');
      setMemberCode('');
    } else if (view === 'createPassword') {
      transitionTo('memberCode');
    } else if (view === 'password') {
      transitionTo('email');
    }
  };

  return (
    <div className="landing-page">
      {/* Top-left wordmark */}
      <div className="pilot-light-wordmark">Pilot Light</div>

      {/* Centered content */}
      <div className="landing-center">
        {/* Flame Icon */}
        <div className="flame-container">
          <div className="flame-icon-wrapper">
            <FlameIcon size={48} />
          </div>
          <div className="flame-glow"></div>
        </div>

        {/* Auth flow — rolls downward, flame stays put */}
        <div className="landing-content">
          <div className={`auth-stage ${animClass}`}>
            {/* Members button */}
            {view === 'enter' && (
              <button className="enter-button" onClick={() => transitionTo('email')}>
                Members
              </button>
            )}

            {/* Email input */}
            {view === 'email' && (
              <form className="auth-form" onSubmit={handleEmailSubmit}>
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="Email address"
                    disabled={isLoading}
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Checking...' : 'Continue'}
                </button>
                <button type="button" className="back-button" onClick={handleBack}>Back</button>
              </form>
            )}

            {/* Member code input */}
            {view === 'memberCode' && (
              <form className="auth-form" onSubmit={handleCodeSubmit}>
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <input
                    type="text"
                    value={memberCode}
                    onChange={e => { setMemberCode(e.target.value); setError(''); }}
                    placeholder="Member code"
                    disabled={isLoading}
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Validating...' : 'Submit'}
                </button>
                <button type="button" className="back-button" onClick={handleBack}>Back</button>
              </form>
            )}

            {/* Create password (new user) */}
            {view === 'createPassword' && (
              <form className="auth-form" onSubmit={handleCreatePasswordSubmit}>
                {error && <div className="error-message">{error}</div>}
                {passwordStep === 1 && (
                  <div className="form-group">
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="Create a password"
                        disabled={isLoading}
                        autoFocus
                        required
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                {passwordStep === 2 && (
                  <div className="form-group">
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="Confirm password"
                        disabled={isLoading}
                        autoFocus
                        required
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Setting up...' : passwordStep === 1 ? 'Continue' : 'Set Password'}
                </button>
                <button type="button" className="back-button" onClick={handleBack}>Back</button>
              </form>
            )}

            {/* Password login (returning user) */}
            {view === 'password' && (
              <form className="auth-form" onSubmit={handlePasswordLogin}>
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Password"
                      disabled={isLoading}
                      autoFocus
                      required
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Entering...' : 'Enter'}
                </button>
                <button type="button" className="back-button" onClick={handleBack}>Back</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
