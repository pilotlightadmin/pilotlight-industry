import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FlameIcon, Icon } from '../components/Icons';
import StorageManager from '../services/StorageManager';
import VoterNdaModal from '../components/VoterNdaModal';
import { saveGlobalNdaAcceptance } from '../utils/helpers';

function LoginModal({ onClose, onLogin, onForgotPassword, message, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNdaAfterSignup, setShowNdaAfterSignup] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  // Auto-detect location when in signup mode
  useEffect(() => {
    if (mode === 'signup' && !location) {
      setLocationLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
              );
              const data = await response.json();
              const city = data.address?.city || data.address?.town || data.address?.village || '';
              const state = data.address?.state || '';
              const country = data.address?.country || '';
              const locationParts = [city, state, country].filter(Boolean);
              setLocation(locationParts.join(', '));
            } catch (err) {
              setLocation('Location unavailable');
            }
            setLocationLoading(false);
          },
          () => {
            setLocation('Location unavailable');
            setLocationLoading(false);
          },
          { timeout: 5000, enableHighAccuracy: false, maximumAge: 300000 }
        );
      } else {
        setLocation('Location unavailable');
        setLocationLoading(false);
      }
    }
  }, [mode]);

  const inputStyle = {
    width: '100%', padding: '0.9rem', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff',
    fontSize: '0.95rem', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box'
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (mode === 'login') {
      // Login
      try {
        const result = await StorageManager.loginWithPassword(usernameOrEmail, password);
        if (result.success) onLogin(result.voter);
        else setError(result.message);
      } catch (err) {
        setError('Something went wrong. Please try again.');
      }
    } else {
      // Signup - create account, then show NDA agreement
      if (password !== confirmPassword) { setError('Passwords do not match.'); setSubmitting(false); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); setSubmitting(false); return; }
      if (!gender) { setError('Please select your gender.'); setSubmitting(false); return; }
      try {
        // Normalize location spelling/formatting before saving
        const normalizedLocation = await normalizeLocation(location);
        const result = await StorageManager.registerWithPassword(name, email, password, gender, normalizedLocation);
        if (result.success) {
          // Add contact to Brevo list via hidden iframe form (same method as landing wall)
          try {
            const iframe = document.createElement('iframe');
            iframe.name = 'brevo-signup-frame-2';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'https://e8366561.sibforms.com/serve/MUIFAFMJ0latbMfAtv7r0K4Iz7o59SgHw_808trgump0LChSGl-YwcFtwvMwAl7ppoBf0ZjLiBlc1VMN9Dw994vQwldv44_7MUjhRMTGQ42MfMx7ut93n54ic18x3lwXqzgS5VwIFUFbW1v-w41Mey-FeKEbN_RpIK4TRv-Pewgp48DSjvj3GTnlefz73pqC2vqjcbY8GoR0IfbZ2g==';
            form.target = 'brevo-signup-frame-2';
            const nameField = document.createElement('input');
            nameField.type = 'hidden'; nameField.name = 'FIRSTNAME'; nameField.value = name;
            const emailField = document.createElement('input');
            emailField.type = 'hidden'; emailField.name = 'EMAIL'; emailField.value = email;
            const roleField = document.createElement('input');
            roleField.type = 'hidden'; roleField.name = 'ROLE'; roleField.value = 'fan';
            form.appendChild(nameField);
            form.appendChild(emailField);
            form.appendChild(roleField);
            document.body.appendChild(form);
            form.submit();
            setTimeout(() => { iframe.remove(); form.remove(); }, 5000);
          } catch (e) { console.error('Brevo sync error:', e); }
          // Show NDA modal before completing signup
          setPendingUser(result.voter);
          setShowNdaAfterSignup(true);
        } else setError(result.message);
      } catch (err) {
        setError('Something went wrong. Please try again.');
      }
    }
    setSubmitting(false);
  };

  // Helper function to normalize location
  const normalizeLocation = async (loc) => {
    // Could add more sophisticated normalization here
    return loc;
  };

  // NDA acceptance handler after signup
  const handleNdaAccept = async () => {
    if (pendingUser) {
      await saveGlobalNdaAcceptance(pendingUser.id, pendingUser);
      onLogin(pendingUser);
    }
  };

  // Show NDA modal after signup
  if (showNdaAfterSignup && pendingUser) {
    return <VoterNdaModal mandatory={true} onAccept={handleNdaAccept} onClose={() => {}} />;
  }

  // Form View (Login or Signup)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px',
        padding: 'clamp(1.25rem, 4vw, 2rem)', maxWidth: '420px', width: '100%', border: '1px solid rgba(78,205,196,0.3)', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <FlameIcon size={36} style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: '700', color: '#fff', margin: '0 0 0.5rem' }}>
            {mode === 'login' ? 'Welcome Back' : 'Join Pilot Light'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', margin: 0 }}>
            {message || (mode === 'login' ? 'Sign in to continue' : 'Create a free account to vote')}
          </p>
        </div>

        <form onSubmit={handleFormSubmit}>
          {error && <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: '8px', padding: '0.6rem', marginBottom: '0.75rem', color: '#ff6b6b', fontSize: 'clamp(0.8rem, 2.5vw, 0.85rem)' }}>{error}</div>}

          {mode === 'login' ? (
            <>
              <input type="text" required placeholder="Username or Email" value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)} style={inputStyle} />
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} required placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '0.9rem', background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>
                  <Icon component={showPassword ? EyeOff : Eye} style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </>
          ) : (
            <>
              <input type="text" required placeholder="Username" value={name}
                onChange={(e) => setName(e.target.value)} style={inputStyle} />
              <input type="email" required placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} required placeholder="Password (min 8 chars)" value={password}
                  onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '0.9rem', background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>
                  <Icon component={showPassword ? EyeOff : Eye} style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
              <input type="password" required placeholder="Confirm Password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />

              {/* Gender */}
              <select value={gender} onChange={(e) => setGender(e.target.value)} required
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.5)\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}>
                <option value="" style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.5)' }}>Select Gender *</option>
                <option value="Male" style={{ background: '#1a1a2e', color: '#fff' }}>Male</option>
                <option value="Female" style={{ background: '#1a1a2e', color: '#fff' }}>Female</option>
                <option value="Non-Binary" style={{ background: '#1a1a2e', color: '#fff' }}>Non-Binary</option>
                <option value="Prefer Not to Say" style={{ background: '#1a1a2e', color: '#fff' }}>Prefer Not to Say</option>
              </select>

              {/* Location (auto-detected or manual input) */}
              <div style={{ position: 'relative' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', zIndex: 1 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <input type="text"
                  placeholder={locationLoading ? 'Detecting location...' : 'Enter location (City, State, Country)'}
                  value={location === 'Location unavailable' ? '' : (location || '')}
                  onChange={(e) => setLocation(e.target.value)}
                  readOnly={locationLoading}
                  style={{ ...inputStyle, paddingLeft: '2.25rem', marginBottom: 0, fontSize: '0.85rem', cursor: locationLoading ? 'default' : 'text' }} />
              </div>
            </>
          )}

          <button type="submit" disabled={submitting}
            style={{ width: '100%', padding: 'clamp(0.8rem, 2.5vw, 0.9rem)', background: submitting ? 'rgba(255,255,255,0.2)' :
              'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)', border: 'none', borderRadius: '10px',
              color: '#fff', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}>
            {submitting ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {mode === 'login' && onForgotPassword && (
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <button onClick={onForgotPassword}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
              Forgot your password?
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#4ecdc4', cursor: 'pointer', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)' }}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <button onClick={onClose}
          style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
      </div>
    </div>
  );
}

export default LoginModal;
