import React, { useState, useRef } from 'react';
import StorageManager from '../services/StorageManager';

function InviteOnlyWall({ onInviteAccepted, getInviteType, onLoginSuccess }) {
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const iframeRef = useRef(null);

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    if (!loginId || !loginPassword) { setLoginError('Please enter your email and password.'); return; }
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await StorageManager.loginWithPassword(loginId, loginPassword);
      if (result.success) {
        onLoginSuccess(result.voter);
      } else {
        setLoginError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setLoginError('Something went wrong. Please try again.');
    }
    setLoginLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '0.85rem 1rem', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s, background 0.2s', boxSizing: 'border-box'
  };

  const handleInviteSubmit = (e) => {
    if (e) e.preventDefault();
    console.log('Invite submit triggered, code:', inviteCode);
    const trimmed = inviteCode.trim();
    const type = getInviteType(trimmed);
    console.log('Code type:', type, 'trimmed:', trimmed);
    if (type) {
      localStorage.setItem('pilotlight_invite_code', trimmed.toUpperCase());
      localStorage.setItem('pilotlight_invite_type', type);
      setInviteError('');
      window.location.reload();
    } else {
      setInviteError('Invalid invite code. Check with whoever sent you the link.');
    }
  };

  const handleWaitlist = (e) => {
    // Post to Brevo via hidden iframe
    setTimeout(() => setWaitlistSubmitted(true), 600);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1a2e 50%, #16213e 100%)' }}>

      <div style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem'
      }}>
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>

          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" style={{ position: 'relative', zIndex: 1 }}>
                <defs>
                  <linearGradient id="inviteFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ff6b6b" />
                    <stop offset="50%" stopColor="#feca57" />
                    <stop offset="100%" stopColor="#fff5cc" />
                  </linearGradient>
                </defs>
                <path fill="url(#inviteFlameGrad)" stroke="none"
                  d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
            </div>
            <div style={{
              fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Pilot Light</div>
          </div>

          {/* Tagline */}
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', lineHeight: 1.6, fontWeight: 400, maxWidth: '340px' }}>
            Where audiences shape<br/>the <span style={{ color: '#4ecdc4', fontWeight: 500 }}>next big hit</span>.
          </p>

          {/* Card */}
          <div style={{
            width: '100%', background: 'linear-gradient(135deg, rgba(26,26,46,0.9) 0%, rgba(22,33,62,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem 1.75rem',
            backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Early Access</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Pilot Light is currently invite-only</div>
            </div>

            {/* Invite Code Entry */}
            <form onSubmit={handleInviteSubmit}>
              <div style={{ marginBottom: '0.75rem' }}>
                <input type="text" placeholder="Enter invite code" value={inviteCode}
                  onChange={(e) => { setInviteCode(e.target.value); setInviteError(''); }}
                  style={inputStyle} />
              </div>
              {inviteError && (
                <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '0.75rem', textAlign: 'center' }}>{inviteError}</div>
              )}
              <button type="submit" style={{
                width: '100%', padding: '0.9rem', border: 'none', borderRadius: '12px',
                background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', color: '#fff',
                fontSize: '1rem', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s', marginBottom: '1.25rem'
              }}
                onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 25px rgba(78,205,196,0.3)'; }}
                onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
              >Enter</button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Waitlist */}
            {!waitlistSubmitted ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Join the waitlist for public access</div>
                </div>
                <form
                  action="https://e8366561.sibforms.com/serve/MUIFAFMJ0latbMfAtv7r0K4Iz7o59SgHw_808trgump0LChSGl-YwcFtwvMwAl7ppoBf0ZjLiBlc1VMN9Dw994vQwldv44_7MUjhRMTGQ42MfMx7ut93n54ic18x3lwXqzgS5VwIFUFbW1v-w41Mey-FeKEbN_RpIK4TRv-Pewgp48DSjvj3GTnlefz73pqC2vqjcbY8GoR0IfbZ2g=="
                  method="POST" target="waitlist-frame" onSubmit={handleWaitlist}
                >
                  <input type="hidden" name="FIRSTNAME" value="Waitlist" />
                  <input type="hidden" name="ROLE" value="waitlist" />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="email" name="EMAIL" placeholder="your@email.com" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }} />
                    <button type="submit" style={{
                      padding: '0.85rem 1.25rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.9rem',
                      fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>Notify me</button>
                  </div>
                </form>
                <iframe name="waitlist-frame" ref={iframeRef} style={{ display: 'none' }} aria-hidden="true" />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <p style={{ color: '#4ecdc4', fontSize: '0.9rem', fontWeight: 600 }}>You're on the list! We'll be in touch.</p>
              </div>
            )}
          </div>

          {/* Sign In Link / Form */}
          <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
            {!showSignIn ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                Already have an account?{' '}
                <span onClick={() => setShowSignIn(true)} style={{ color: '#4ecdc4', cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
              </p>
            ) : (
              <div style={{
                width: '100%', maxWidth: '420px', background: 'linear-gradient(135deg, rgba(26,26,46,0.9) 0%, rgba(22,33,62,0.9) 100%)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem',
                backdropFilter: 'blur(20px)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>Sign In</div>
                  <span onClick={() => { setShowSignIn(false); setLoginError(''); }} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</span>
                </div>
                <form onSubmit={handleSignIn}>
                  <input type="text" placeholder="Email or username" value={loginId}
                    onChange={(e) => { setLoginId(e.target.value); setLoginError(''); }}
                    style={{ ...inputStyle, marginBottom: '0.6rem' }} />
                  <input type="password" placeholder="Password" value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                    style={{ ...inputStyle, marginBottom: '0.75rem' }} />
                  {loginError && (
                    <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '0.75rem', textAlign: 'center' }}>{loginError}</div>
                  )}
                  <button type="submit" disabled={loginLoading} style={{
                    width: '100%', padding: '0.85rem', border: 'none', borderRadius: '12px',
                    background: loginLoading ? 'rgba(78,205,196,0.5)' : 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                    color: '#fff', fontSize: '0.95rem', fontWeight: '700', fontFamily: 'inherit',
                    cursor: loginLoading ? 'not-allowed' : 'pointer'
                  }}>{loginLoading ? 'Signing in...' : 'Sign In'}</button>
                </form>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', lineHeight: 1.5, maxWidth: '300px' }}>
            We're in early access while we build something special.<br/>
            Invites going out soon.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InviteOnlyWall;
