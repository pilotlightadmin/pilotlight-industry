import React, { useState, useEffect, useRef } from 'react';
import StorageManager from '../services/StorageManager';

function LandingPageWall({ onLoginSuccess }) {
  const [mode, setMode] = useState('signup'); // 'signup', 'login', 'success'
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const particlesRef = useRef(null);
  const iframeRef = useRef(null);

  // Generate particles on mount
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    container.innerHTML = '';

    // Ambient particles
    const ambientColors = ['#4ecdc4', '#fff5cc'];
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 2.5 + 0.5;
      Object.assign(p.style, {
        position: 'absolute', borderRadius: '50%', opacity: '0',
        width: size + 'px', height: size + 'px',
        left: (Math.random() * 100) + '%', top: (100 + Math.random() * 20) + '%',
        background: ambientColors[Math.floor(Math.random() * ambientColors.length)],
        animation: `wallFloatUp ${10 + Math.random() * 14}s linear ${Math.random() * 12}s infinite`
      });
      container.appendChild(p);
    }

    // Embers — spread across full page width
    const emberColors = ['#ff6b6b', '#ff8a65', '#feca57', '#ffb74d', '#fff5cc', '#ff7043'];
    for (let i = 0; i < 60; i++) {
      const e = document.createElement('div');
      const size = Math.random() * 3 + 0.8;
      const drift = (Math.random() - 0.5) * 180;
      Object.assign(e.style, {
        position: 'absolute', borderRadius: '50%', opacity: '0',
        width: size + 'px', height: size + 'px',
        left: (5 + Math.random() * 90) + '%', top: (80 + Math.random() * 30) + '%',
        background: emberColors[Math.floor(Math.random() * emberColors.length)],
        boxShadow: `0 0 ${size * 2}px ${emberColors[Math.floor(Math.random() * emberColors.length)]}`,
        '--drift': drift + 'px',
        animation: `wallEmberRise ${6 + Math.random() * 10}s ease-out ${Math.random() * 8}s infinite`
      });
      container.appendChild(e);
    }
  }, []);

  const handleSignup = (e) => {
    // Let form POST to Brevo via hidden iframe
    setTimeout(() => setMode('success'), 600);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const result = await StorageManager.loginWithPassword(loginId, loginPassword);
      if (result && result.voter) {
        onLoginSuccess(result.voter);
      } else {
        setLoginError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please try again.');
    }
    setLoginLoading(false);
  };

  // Inject keyframes for particles
  const wallKeyframes = `
    @keyframes wallFloatUp {
      0%   { transform: translateY(0) scale(1); opacity: 0; }
      10%  { opacity: 0.5; }
      90%  { opacity: 0.08; }
      100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
    }
    @keyframes wallEmberRise {
      0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
      8%   { opacity: 0.9; }
      30%  { opacity: 0.7; }
      60%  { opacity: 0.3; }
      100% { transform: translateY(-70vh) translateX(var(--drift)) scale(0.1); opacity: 0; }
    }
    @keyframes wallPulseGlow {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.15); opacity: 1; }
    }
  `;

  const inputStyle = {
    width: '100%', padding: '0.85rem 1rem', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s, background 0.2s', boxSizing: 'border-box'
  };

  const btnStyle = {
    width: '100%', padding: '0.9rem', border: 'none', borderRadius: '12px',
    background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', color: '#fff',
    fontSize: '1rem', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s', letterSpacing: '0.01em'
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: wallKeyframes }} />

      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(78,205,196,0.08) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 20% 80%, rgba(255,107,107,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 80% 70%, rgba(254,202,87,0.04) 0%, transparent 60%),
          linear-gradient(135deg, #0a0e27 0%, #1a1a2e 50%, #16213e 100%)`
      }} />

      {/* Particles */}
      <div ref={particlesRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }} />

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem'
      }}>
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>

          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: '-12px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(254,202,87,0.15) 0%, transparent 70%)',
                animation: 'wallPulseGlow 3s ease-in-out infinite'
              }} />
              <svg width="56" height="56" viewBox="0 0 24 24" style={{ position: 'relative', zIndex: 1 }}>
                <defs>
                  <linearGradient id="wallFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ff6b6b">
                      <animate attributeName="stop-color" values="#ff6b6b;#ff8a80;#ff6b6b" dur="1.5s" repeatCount="indefinite"/>
                    </stop>
                    <stop offset="50%" stopColor="#feca57">
                      <animate attributeName="stop-color" values="#feca57;#ffe082;#feca57" dur="1.2s" repeatCount="indefinite"/>
                    </stop>
                    <stop offset="100%" stopColor="#fff5cc">
                      <animate attributeName="stop-color" values="#fff5cc;#ffffff;#fff5cc" dur="0.8s" repeatCount="indefinite"/>
                    </stop>
                  </linearGradient>
                  <filter id="wallGlow">
                    <feGaussianBlur stdDeviation="0.5" result="blur"/>
                    <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 3 0" result="glow"/>
                    <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <path fill="url(#wallFlameGrad)" stroke="none" filter="url(#wallGlow)"
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

          {/* Auth Card */}
          <div style={{
            width: '100%', background: 'linear-gradient(135deg, rgba(26,26,46,0.9) 0%, rgba(22,33,62,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem 1.75rem',
            backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>

            {/* Signup View */}
            {mode === 'signup' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Join the community</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Be among the first to shape what gets made</div>
                </div>
                <form
                  action="https://e8366561.sibforms.com/serve/MUIFAFMJ0latbMfAtv7r0K4Iz7o59SgHw_808trgump0LChSGl-YwcFtwvMwAl7ppoBf0ZjLiBlc1VMN9Dw994vQwldv44_7MUjhRMTGQ42MfMx7ut93n54ic18x3lwXqzgS5VwIFUFbW1v-w41Mey-FeKEbN_RpIK4TRv-Pewgp48DSjvj3GTnlefz73pqC2vqjcbY8GoR0IfbZ2g=="
                  method="POST"
                  target="brevo-frame"
                  onSubmit={handleSignup}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <input type="text" name="FIRSTNAME" placeholder="First name" required style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <input type="email" name="EMAIL" placeholder="Email address" required style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <select name="ROLE" required style={{
                      ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center'
                    }}>
                      <option value="" disabled selected style={{ background: '#1a1a2e' }}>Tell us about yourself</option>
                      <option value="industry" style={{ background: '#1a1a2e' }}>I am an industry professional</option>
                      <option value="creator" style={{ background: '#1a1a2e' }}>I am a content creator</option>
                      <option value="fan" style={{ background: '#1a1a2e' }}>I am a fan / regular viewer</option>
                      <option value="curious" style={{ background: '#1a1a2e' }}>I am just curious</option>
                    </select>
                  </div>
                  <button type="submit" style={btnStyle}
                    onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 25px rgba(78,205,196,0.3)'; }}
                    onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                  >Get early access</button>
                </form>
                <iframe name="brevo-frame" ref={iframeRef} style={{ display: 'none' }} aria-hidden="true" />
                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Already have an account? </span>
                  <button onClick={() => { setMode('login'); setLoginError(''); }} style={{
                    background: 'none', border: 'none', color: '#4ecdc4', fontSize: '0.9rem',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginLeft: '0.3rem'
                  }}>Sign in</button>
                </div>
              </div>
            )}

            {/* Login View */}
            {mode === 'login' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Welcome back</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Sign in to see what's new</div>
                </div>
                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '1rem' }}>
                    <input type="text" placeholder="Username or email" required value={loginId}
                      onChange={(e) => setLoginId(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <input type="password" placeholder="Password" required value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)} style={inputStyle} />
                  </div>
                  {loginError && (
                    <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{loginError}</div>
                  )}
                  <button type="submit" disabled={loginLoading} style={{
                    ...btnStyle, opacity: loginLoading ? 0.6 : 1, cursor: loginLoading ? 'not-allowed' : 'pointer'
                  }}
                    onMouseOver={(e) => { if (!loginLoading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 25px rgba(78,205,196,0.3)'; } }}
                    onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                  >{loginLoading ? 'Signing in...' : 'Sign in'}</button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Don't have an account? </span>
                  <button onClick={() => setMode('signup')} style={{
                    background: 'none', border: 'none', color: '#4ecdc4', fontSize: '0.9rem',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginLeft: '0.3rem'
                  }}>Sign up</button>
                </div>
              </div>
            )}

            {/* Success View */}
            {mode === 'success' && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>You're on the list</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>We'll be in touch soon with your early access.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', lineHeight: 1.5, maxWidth: '300px' }}>
            By signing up you agree to hear from us occasionally.<br/>
            No spam, just signal.
          </p>

        </div>
      </div>
    </div>
  );
}

export default LandingPageWall;
