import React, { useState, useEffect, useRef } from 'react';
import StorageManager from '../services/StorageManager';

function LandingPageWall({ onLoginSuccess, onNavigate }) {
  const [mode, setMode] = useState('main'); // 'main', 'login', 'waitlist-success'
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStep, setLoginStep] = useState(1); // 1 = username, 2 = password
  const [focusedInput, setFocusedInput] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const particlesRef = useRef(null);
  const iframeRef = useRef(null);

  // Generate particles on mount
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    container.innerHTML = '';

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

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);
    try {
      const result = await StorageManager.redeemInviteCode(inviteCode.trim());
      if (result && result.voter) {
        onLoginSuccess(result.voter);
      } else {
        setInviteError('Invalid invite code');
      }
    } catch (err) {
      setInviteError(err.message || 'Invalid invite code');
    }
    setInviteLoading(false);
  };

  const handleWaitlistSubmit = (e) => {
    setTimeout(() => setMode('waitlist-success'), 600);
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

  const keyframes = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
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
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes successPop {
      0% { transform: scale(0.85); opacity: 0; }
      60% { transform: scale(1.03); }
      100% { transform: scale(1); opacity: 1; }
    }
  `;

  const inputBase = {
    width: '100%', padding: '0.9rem 1rem', borderRadius: '12px',
    border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif", outline: 'none',
    transition: 'all 0.25s ease', boxSizing: 'border-box'
  };

  const getInputStyle = (name) => ({
    ...inputBase,
    borderColor: focusedInput === name ? 'rgba(78,205,196,0.5)' : 'rgba(255,255,255,0.1)',
    background: focusedInput === name ? 'rgba(78,205,196,0.05)' : 'rgba(255,255,255,0.04)',
    boxShadow: focusedInput === name ? '0 0 0 3px rgba(78,205,196,0.08)' : 'none'
  });

  const primaryBtnStyle = {
    padding: '0.9rem 2rem', border: 'none', borderRadius: '12px',
    background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', color: '#fff',
    fontSize: '1rem', fontWeight: '700', fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
    transition: 'all 0.25s ease', letterSpacing: '0.01em',
    boxShadow: hoveredBtn === 'primary' ? '0 10px 30px rgba(78,205,196,0.35)' : '0 4px 15px rgba(78,205,196,0.15)',
    transform: hoveredBtn === 'primary' ? 'translateY(-2px)' : 'translateY(0)'
  };

  const secondaryBtnStyle = {
    padding: '0.9rem 1.5rem', border: '1.5px solid rgba(255,255,255,0.15)',
    borderRadius: '12px', background: 'rgba(255,255,255,0.04)', color: '#fff',
    fontSize: '0.95rem', fontWeight: '600', fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
    transition: 'all 0.25s ease',
    borderColor: hoveredBtn === 'notify' ? 'rgba(78,205,196,0.3)' : 'rgba(255,255,255,0.15)',
    background: hoveredBtn === 'notify' ? 'rgba(78,205,196,0.06)' : 'rgba(255,255,255,0.04)'
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', fontFamily: "'Outfit', sans-serif", color: '#fff' }}>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(78,205,196,0.05) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 20% 80%, rgba(255,107,107,0.03) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 80% 70%, rgba(254,202,87,0.03) 0%, transparent 60%),
          #000000`
      }} />

      {/* Particles */}
      <div ref={particlesRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }} />

      {/* Top-left brand name */}
      <div style={{
        position: 'fixed', top: '1.25rem', left: '1.5rem', zIndex: 10,
        animation: 'fadeInUp 0.5s ease-out'
      }}>
        <span style={{
          fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #4ecdc4 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
        }}>Pilot Light</span>
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2.5rem 1.5rem'
      }}>

        {/* Centered flame icon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeInUp 0.6s ease-out' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: '-14px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254,202,87,0.15) 0%, transparent 70%)',
              animation: 'wallPulseGlow 3s ease-in-out infinite'
            }} />
            <svg width="56" height="56" viewBox="0 0 24 24" style={{ position: 'relative', zIndex: 1 }}>
              <defs>
                <linearGradient id="wallFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#ff6b6b"><animate attributeName="stop-color" values="#ff6b6b;#ff8a80;#ff6b6b" dur="1.5s" repeatCount="indefinite"/></stop>
                  <stop offset="50%" stopColor="#feca57"><animate attributeName="stop-color" values="#feca57;#ffe082;#feca57" dur="1.2s" repeatCount="indefinite"/></stop>
                  <stop offset="100%" stopColor="#fff5cc"><animate attributeName="stop-color" values="#fff5cc;#ffffff;#fff5cc" dur="0.8s" repeatCount="indefinite"/></stop>
                </linearGradient>
                <filter id="wallGlow"><feGaussianBlur stdDeviation="0.5" result="blur"/><feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 3 0" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <path fill="none" stroke="url(#wallFlameGrad)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#wallGlow)"
                d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>
        </div>

        {/* Main card — Member Credentials */}
        {mode === 'main' && (
          <div style={{
            width: '100%', maxWidth: '440px',
            animation: 'fadeInUp 0.6s ease-out 0.1s both'
          }}>
            <div style={{
              background: 'linear-gradient(145deg, rgba(18,18,18,0.92) 0%, rgba(12,12,12,0.92) 100%)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px',
              padding: '2.25rem 2rem',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 400, marginBottom: '0.3rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Credentials</div>
              </div>

              {/* Step 1: Username/email */}
              {loginStep === 1 && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (loginId.trim() && loginId.includes('@')) {
                    setLoginStep(2);
                    setLoginError('');
                  }
                }}>
                  <div style={{ marginBottom: '0.85rem' }}>
                    <input
                      type="text" placeholder="Username or email" required autoFocus
                      value={loginId} onChange={(e) => setLoginId(e.target.value)}
                      style={getInputStyle('loginId')}
                      onFocus={() => setFocusedInput('loginId')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>

                  {loginId.trim() && loginId.includes('@') && (
                    <button type="submit"
                      style={{
                        background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px', padding: '0.7rem 2rem', width: '100%',
                        color: hoveredBtn === 'continue' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                        fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif",
                        cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.03em',
                        borderColor: hoveredBtn === 'continue' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                        animation: 'fadeInUp 0.3s ease-out', marginBottom: '0.85rem'
                      }}
                      onMouseEnter={() => setHoveredBtn('continue')}
                      onMouseLeave={() => setHoveredBtn(null)}
                    >Continue</button>
                  )}

                  {/* Enter Code link */}
                  <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                    <button
                      onClick={() => setMode('invite')}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: hoveredBtn === 'enterCode' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.28)',
                        fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                        fontFamily: "'Outfit', sans-serif", transition: 'color 0.2s',
                        letterSpacing: '0.02em'
                      }}
                      onMouseEnter={() => setHoveredBtn('enterCode')}
                      onMouseLeave={() => setHoveredBtn(null)}
                    >Enter Code</button>
                  </div>
                </form>
              )}

              {/* Step 2: Password */}
              {loginStep === 2 && (
                <form onSubmit={handleLogin}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '0.85rem', padding: '0.6rem 0.85rem',
                    borderRadius: '10px', background: 'rgba(255,255,255,0.04)'
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loginId}</span>
                    <button type="button"
                      onClick={() => { setLoginStep(1); setLoginPassword(''); setLoginError(''); }}
                      style={{
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                        fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                        padding: '0.15rem 0.4rem', transition: 'color 0.2s', flexShrink: 0
                      }}
                      onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.3)'}
                    >Change</button>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <input
                      type="password" placeholder="Password" required autoFocus
                      value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                      style={getInputStyle('loginPass')}
                      onFocus={() => setFocusedInput('loginPass')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>

                  {loginError && (
                    <div style={{
                      color: '#ff6b6b', fontSize: '0.83rem', marginBottom: '0.85rem',
                      textAlign: 'center', padding: '0.5rem', borderRadius: '8px',
                      background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.12)'
                    }}>{loginError}</div>
                  )}

                  <button type="submit" disabled={loginLoading}
                    style={{
                      background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px', padding: '0.7rem 2rem', width: '100%',
                      color: hoveredBtn === 'signin' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                      fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif",
                      cursor: loginLoading ? 'not-allowed' : 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.03em',
                      borderColor: hoveredBtn === 'signin' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                      opacity: loginLoading ? 0.6 : 1
                    }}
                    onMouseEnter={() => { if (!loginLoading) setHoveredBtn('signin'); }}
                    onMouseLeave={() => setHoveredBtn(null)}
                  >{loginLoading ? 'Signing in...' : 'Sign in'}</button>
                </form>
              )}
            </div>

            {/* Subtle waitlist link */}
            <div style={{
              textAlign: 'center', marginTop: '1.5rem',
              animation: 'fadeInUp 0.6s ease-out 0.25s both'
            }}>
              <button
                onClick={() => setMode('waitlist')}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                  fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                  padding: 0, transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.55)'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.3)'}
              >Join the waitlist</button>
            </div>
          </div>
        )}

        {/* Invite code view */}
        {mode === 'invite' && (
          <div style={{
            width: '100%', maxWidth: '440px',
            animation: 'fadeInUp 0.4s ease-out'
          }}>
            <div style={{
              background: 'linear-gradient(145deg, rgba(18,18,18,0.92) 0%, rgba(12,12,12,0.92) 100%)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px',
              padding: '2.25rem 2rem',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 400, marginBottom: '0.3rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Enter Invite Code</div>
              </div>

              <form onSubmit={handleInviteSubmit}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <input
                    type="text"
                    placeholder="Invite code"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value); setInviteError(''); }}
                    style={getInputStyle('invite')}
                    onFocus={() => setFocusedInput('invite')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </div>
                {inviteError && (
                  <div style={{
                    color: '#ff6b6b', fontSize: '0.83rem', marginBottom: '0.75rem',
                    textAlign: 'center', padding: '0.5rem', borderRadius: '8px',
                    background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.12)'
                  }}>{inviteError}</div>
                )}
                <button
                  type="submit" disabled={inviteLoading}
                  style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px', padding: '0.7rem 2rem', width: '100%',
                    color: hoveredBtn === 'redeem' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                    fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif",
                    cursor: inviteLoading ? 'not-allowed' : 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.03em',
                    borderColor: hoveredBtn === 'redeem' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                    opacity: inviteLoading ? 0.6 : 1
                  }}
                  onMouseEnter={() => setHoveredBtn('redeem')}
                  onMouseLeave={() => setHoveredBtn(null)}
                >{inviteLoading ? 'Checking...' : 'Redeem'}</button>
              </form>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => setMode('main')}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem',
                  cursor: 'pointer', fontFamily: "'Outfit', sans-serif", padding: 0, transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.55)'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.35)'}
              >← Back to sign in</button>
            </div>
          </div>
        )}

        {/* Waitlist view */}
        {mode === 'waitlist' && (
          <div style={{
            width: '100%', maxWidth: '440px',
            animation: 'fadeInUp 0.4s ease-out'
          }}>
            <div style={{
              background: 'linear-gradient(145deg, rgba(18,18,18,0.92) 0%, rgba(12,12,12,0.92) 100%)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px',
              padding: '2.25rem 2rem',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 400, marginBottom: '0.3rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Join the Waitlist</div>
              </div>

              <form
                action="https://e8366561.sibforms.com/serve/MUIFAFMJ0latbMfAtv7r0K4Iz7o59SgHw_808trgump0LChSGl-YwcFtwvMwAl7ppoBf0ZjLiBlc1VMN9Dw994vQwldv44_7MUjhRMTGQ42MfMx7ut93n54ic18x3lwXqzgS5VwIFUFbW1v-w41Mey-FeKEbN_RpIK4TRv-Pewgp48DSjvj3GTnlefz73pqC2vqjcbY8GoR0IfbZ2g=="
                method="POST"
                target="brevo-frame"
                onSubmit={handleWaitlistSubmit}
              >
                <div style={{ marginBottom: '0.85rem' }}>
                  <input
                    type="email" name="EMAIL" placeholder="your@email.com" required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    style={getInputStyle('waitlist')}
                    onFocus={() => setFocusedInput('waitlist')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </div>
                <button type="submit"
                  style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px', padding: '0.7rem 2rem', width: '100%',
                    color: hoveredBtn === 'notify' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                    fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.03em',
                    borderColor: hoveredBtn === 'notify' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'
                  }}
                  onMouseEnter={() => setHoveredBtn('notify')}
                  onMouseLeave={() => setHoveredBtn(null)}
                >Notify me</button>
              </form>
              <iframe name="brevo-frame" ref={iframeRef} style={{ display: 'none' }} aria-hidden="true" />
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => setMode('main')}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem',
                  cursor: 'pointer', fontFamily: "'Outfit', sans-serif", padding: 0, transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.55)'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.35)'}
              >← Back to sign in</button>
            </div>
          </div>
        )}

        {/* Waitlist success view */}
        {mode === 'waitlist-success' && (
          <div style={{
            width: '100%', maxWidth: '440px',
            animation: 'successPop 0.5s ease-out'
          }}>
            <div style={{
              background: 'linear-gradient(145deg, rgba(18,18,18,0.92) 0%, rgba(12,12,12,0.92) 100%)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px',
              padding: '2.75rem 2rem',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 8px 25px rgba(78,205,196,0.25)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>You're on the list!</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto' }}>
                We'll send you an invite as soon as your spot opens up.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default LandingPageWall;
