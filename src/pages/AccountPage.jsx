import React, { useState, useEffect } from 'react';
import { FlameIcon } from '../components/Icons';
import StorageManager from '../services/StorageManager';
import PageFooter from '../components/PageFooter';

function AccountPage({ currentUser, onBack, onNavigate, onLogout }) {
  const creatorStatus = currentUser?.creatorStatus || 'none';
  const [votingHistory, setVotingHistory] = useState([]);
  const [stats, setStats] = useState({ pilotsVoted: 0, genresExplored: 0, monthsActive: 1 });
  const [notifications, setNotifications] = useState({ newPilots: true, weeklyDigest: false, creatorUpdates: true });
  const [formData, setFormData] = useState({ name: currentUser?.name || '', email: currentUser?.email || '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        try {
          // Load voting history - use getPilots() to include hidden/superseded pilots
          const votes = await StorageManager.getVoterVotes(currentUser.id);
          const allPilots = await StorageManager.getPilots();
          const history = votes.slice(0, 3).map(v => {
            // Handle pilotId as linked field (array) or plain string
            const pid = Array.isArray(v.pilotId) ? v.pilotId[0] : v.pilotId;
            const pilot = allPilots.find(p => p.id === pid);
            return { ...v, pilot };
          }).filter(v => v.pilot);
          setVotingHistory(history);

          // Calculate stats
          const genres = new Set(votes.map(v => {
            // Handle pilotId as linked field (array) or plain string
            const pid = Array.isArray(v.pilotId) ? v.pilotId[0] : v.pilotId;
            const pilot = allPilots.find(p => p.id === pid);
            return pilot?.genre;
          }).filter(Boolean));
          const memberSince = currentUser.createdAt ? new Date(currentUser.createdAt) : new Date();
          const monthsActive = Math.max(1, Math.ceil((new Date() - memberSince) / (1000 * 60 * 60 * 24 * 30)));
          setStats({ pilotsVoted: votes.length, genresExplored: genres.size || 1, monthsActive });
        } catch (e) { console.error('Error loading account data:', e); }
      }
    };
    loadData();
  }, [currentUser]);

  const sectionStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' };
  const btnSecondary = { padding: '0.625rem 1.25rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontWeight: '500', cursor: 'pointer', fontSize: '0.9rem' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 3vw, 1.5rem)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }} onClick={() => onNavigate('browse')}>
          <FlameIcon size={22} />
          <span style={{ fontSize: 'clamp(0.95rem, 3vw, 1.15rem)', fontWeight: '700', background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pilot Light</span>
        </div>
        <nav className="main-header-nav" style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1.5rem)', alignItems: 'center', fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)' }}>
          {/* Desktop links */}
          <span className="nav-link nav-desktop-only" onClick={() => onNavigate('browse')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </span>
          {creatorStatus === 'approved' ? (
            <span className="nav-link nav-desktop-only" onClick={() => onNavigate('creator-portal')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ff6b6b'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              Creator Portal
            </span>
          ) : (
            <span className="nav-link nav-desktop-only" onClick={() => onNavigate('creators-landing')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ff6b6b'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Creators
            </span>
          )}
          <span className="nav-link nav-desktop-only" style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>Account</span>

          {/* Mobile: Account label + hamburger */}
          <span className="nav-mobile-label" style={{ display: 'none', color: '#fff', fontWeight: '600', fontSize: '0.85rem' }}>Account</span>
          <button className="nav-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              ) : (
                <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}>
            <div onClick={(e) => e.stopPropagation()}
              style={{ position: 'absolute', top: '56px', right: 0, left: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <button onClick={() => { onNavigate('browse'); setMobileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Home
              </button>
              {creatorStatus === 'approved' ? (
                <button onClick={() => { onNavigate('creator-portal'); setMobileMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  Creator Portal
                </button>
              ) : (
                <button onClick={() => { onNavigate('creators-landing'); setMobileMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  Become a Creator
                </button>
              )}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.25rem', paddingTop: '0.5rem' }}>
                <button onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,107,107,0.8)', fontSize: '0.9rem', padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit', width: '100%' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <div style={{ flex: 1, padding: '2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>Account</h1>

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #4ecdc4, #e17055)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>👤</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{currentUser?.name || 'User'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{currentUser?.email}</p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {currentUser?.gender && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {currentUser.gender}
                </p>
              )}
              {currentUser?.location && currentUser.location !== 'Location unavailable' && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {currentUser.location}
                </p>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>Member since {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2026'}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { number: stats.pilotsVoted, label: 'Pilots Voted' },
            { number: stats.genresExplored, label: 'Genres Explored' },
            { number: stats.monthsActive, label: 'Months Active' }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4ecdc4', marginBottom: '0.25rem' }}>{stat.number}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Creator Status */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Creator Status</h3>
          {creatorStatus === 'approved' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '10px', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(78,205,196,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                <div>
                  <strong>Creator Access Approved</strong>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>You can upload pilots and track their performance.</p>
                </div>
              </div>
              <button onClick={() => onNavigate('creator-portal')} style={{ padding: '0.625rem 1.25rem', background: 'linear-gradient(135deg, #4ecdc4, #44a08d)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '500', cursor: 'pointer' }}>Upload Pilot</button>
            </div>
          ) : creatorStatus === 'pending' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(254,202,87,0.1)', border: '1px solid rgba(254,202,87,0.3)', borderRadius: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(254,202,87,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</div>
              <div>
                <strong>Application Under Review</strong>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>We'll email you within 48 hours.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎬</div>
                <div>
                  <strong>Want to share your pilot?</strong>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>Apply for creator access to upload and get feedback.</p>
                </div>
              </div>
              <button onClick={() => onNavigate('creators-landing')} style={btnSecondary}>Learn More</button>
            </div>
          )}
        </div>

        {/* Recent Voting Activity */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Voting Activity</h3>
          </div>
          {votingHistory.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {votingHistory.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', padding: '1rem 0', borderBottom: i < votingHistory.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ width: '60px', height: '40px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', marginRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>🎬</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{item.pilot?.pilotTitle || 'Unknown Pilot'}</h4>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{item.pilot?.genre} · Voted {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}</span>
                  </div>
                  <span style={{ color: '#feca57', fontWeight: '600' }}>★ {item.overallScore || '—'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '1rem' }}>No voting history yet. Start watching pilots!</p>
          )}
        </div>

        {/* Notifications */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Notifications</h3>
          {[
            { key: 'newPilots', title: 'New pilot alerts', desc: 'Get notified when new pilots are added' },
            { key: 'weeklyDigest', title: 'Weekly digest', desc: 'Receive a weekly summary of top pilots' },
            { key: 'creatorUpdates', title: 'Creator updates', desc: "Updates on your pilot's performance (creators only)" }
          ].map((item, i) => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{item.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>{item.desc}</p>
              </div>
              <div onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                style={{ width: '48px', height: '26px', background: notifications[item.key] ? '#4ecdc4' : 'rgba(255,255,255,0.2)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', width: '22px', height: '22px', background: '#fff', borderRadius: '50%', top: '2px', left: notifications[item.key] ? '24px' : '2px', transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Account Settings */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Account Settings</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>Display Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>
          <button style={btnSecondary}>Save Changes</button>
        </div>

        {/* Session */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#fff' }}>Session</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong>Log Out</strong>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>Sign out of your account on this device.</p>
            </div>
            <button onClick={onLogout} style={{ padding: '0.625rem 1.25rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontWeight: '500', cursor: 'pointer' }}>Log Out</button>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ ...sectionStyle, borderColor: 'rgba(255,107,107,0.3)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ff6b6b' }}>Danger Zone</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong>Delete Account</strong>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>Permanently delete your account and all associated data. This cannot be undone.</p>
            </div>
            <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '0.625rem 1.25rem', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '8px', color: '#ff6b6b', fontWeight: '500', cursor: 'pointer' }}>Delete Account</button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0a0a0a', borderRadius: '16px', padding: '2rem', maxWidth: '450px', width: '100%', border: '1px solid rgba(255,107,107,0.3)' }}>
            <h3 style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '1.25rem' }}>Delete Account?</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              This action is <strong style={{ color: '#ff6b6b' }}>permanent and irreversible</strong>. All your data, voting history, and any uploaded pilots will be permanently deleted.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Type <strong style={{ color: '#fff' }}>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', marginBottom: '1.5rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontWeight: '500', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmText === 'DELETE' && currentUser?.id) {
                    const result = await StorageManager.softDeleteAccount(currentUser.id);
                    if (result.success) {
                      alert('Your account has been deleted. We retain your data for record-keeping purposes but your account is no longer accessible.');
                      onLogout();
                    } else {
                      alert(result.message || 'Failed to delete account. Please try again.');
                    }
                  }
                }}
                disabled={deleteConfirmText !== 'DELETE'}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: deleteConfirmText === 'DELETE' ? '#ff6b6b' : 'rgba(255,107,107,0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: deleteConfirmText === 'DELETE' ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: '600',
                  cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed'
                }}>
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />
    </div>
  );
}

export default AccountPage;
