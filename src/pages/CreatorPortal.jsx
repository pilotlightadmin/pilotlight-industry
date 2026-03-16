import React, { useState, useEffect } from 'react';
import StorageManager from '../services/StorageManager';
import { StarIcon, FlameIcon } from '../components/Icons';
import { Loader2 } from 'lucide-react';

function CreatorPortal({ currentUser, pilots, onHome, onUploadNew, onSelectPilot, onRefreshPilots, onUserUpdate }) {
  const [myPilots, setMyPilots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [comments, setComments] = useState({});
  const [activeTab, setActiveTab] = useState('pilots'); // 'pilots' | 'inbox'
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Get default aboutMe from creator application if not yet set
  const getDefaultAboutMe = () => {
    if (currentUser.aboutMe) return currentUser.aboutMe;
    try {
      const app = typeof currentUser.creatorApplication === 'string'
        ? JSON.parse(currentUser.creatorApplication)
        : currentUser.creatorApplication;
      return app?.describes || '';
    } catch (e) {
      return '';
    }
  };

  const [profileData, setProfileData] = useState({
    profilePicture: currentUser.profilePicture || '',
    displayName: currentUser.displayName || '',
    aboutMe: getDefaultAboutMe()
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  const loadPilots = async () => {
    try {
      const p = await StorageManager.getMyPilots(currentUser.id);
      setMyPilots(p || []);
    } catch (err) {
      console.error('Error loading pilots:', err);
    }
    setLoading(false);
  };

  const loadMessages = async () => {
    setMessagesLoading(true);
    try {
      const msgs = await StorageManager.getMessagesForCreator(currentUser.id);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    }
    setMessagesLoading(false);
  };

  useEffect(() => {
    loadPilots();
  }, [currentUser.id]);

  useEffect(() => {
    if (activeTab === 'inbox') {
      loadMessages();
    }
  }, [activeTab]);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);
    const result = await StorageManager.updateCreatorProfile(currentUser.id, profileData);
    if (result.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      if (onUserUpdate) {
        const updatedUser = StorageManager.getCurrentVoter();
        if (updatedUser) onUserUpdate(updatedUser);
      }
    } else {
      setProfileError(result.message || 'Failed to save profile');
    }
    setProfileSaving(false);
  };

  const handleMarkRead = async (messageId) => {
    try {
      await StorageManager.markMessageRead(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
    } catch (err) {
      console.error('Error marking message read:', err);
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  // Group messages by pilot
  const messagesByPilot = messages.reduce((acc, msg) => {
    const key = msg.pilotTitle || msg.pilotId || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const toggleComments = async (pilotId) => {
    if (expandedComments[pilotId]) {
      setExpandedComments(prev => ({ ...prev, [pilotId]: false }));
    } else {
      setExpandedComments(prev => ({ ...prev, [pilotId]: true }));
      if (!comments[pilotId]) {
        setCommentLoading(prev => ({ ...prev, [pilotId]: true }));
        try {
          const pilotComments = await StorageManager.getCommentsForPilot(pilotId);
          setComments(prev => ({ ...prev, [pilotId]: pilotComments || [] }));
        } catch (err) {
          console.error('Error loading comments:', err);
          setComments(prev => ({ ...prev, [pilotId]: [] }));
        }
        setCommentLoading(prev => ({ ...prev, [pilotId]: false }));
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem clamp(1rem, 4vw, 3rem)', color: '#f5f0eb' }}>
      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setShowProfileModal(false)}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,165,116,0.15)', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontFamily: '"Playfair Display", serif', fontWeight: 400, letterSpacing: '0.06em', marginBottom: '1.5rem', color: '#f5f0eb', fontStyle: 'italic' }}>Edit Profile</h2>

            {profileError && <div style={{ padding: '1rem', background: 'rgba(255,99,72,0.15)', borderRadius: '10px', color: '#ff7675', marginBottom: '1rem', fontSize: '0.85rem' }}>{profileError}</div>}
            {profileSuccess && <div style={{ padding: '1rem', background: 'rgba(0,184,148,0.15)', borderRadius: '10px', color: '#00b894', marginBottom: '1rem', fontSize: '0.85rem' }}>Profile updated successfully!</div>}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 300, color: 'rgba(245,240,235,0.8)', fontSize: '0.9rem', fontFamily: 'DM Sans' }}>Display Name</label>
              <input type="text" value={profileData.displayName} onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,165,116,0.15)', borderRadius: '8px', color: '#f5f0eb', fontSize: '0.95rem', fontFamily: 'DM Sans', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 300, color: 'rgba(245,240,235,0.8)', fontSize: '0.9rem', fontFamily: 'DM Sans' }}>About Me</label>
              <textarea value={profileData.aboutMe} onChange={(e) => setProfileData({ ...profileData, aboutMe: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,165,116,0.15)', borderRadius: '8px', color: '#f5f0eb', fontSize: '0.95rem', minHeight: '120px', fontFamily: 'DM Sans', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowProfileModal(false)} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,165,116,0.15)', borderRadius: '6px', color: '#f5f0eb', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '0.9rem' }}>
                Cancel
              </button>
              <button onClick={handleProfileSave} disabled={profileSaving} style={{ padding: '0.75rem 1.5rem', background: '#d4a574', border: 'none', borderRadius: '6px', color: '#0a0a0a', fontWeight: 600, cursor: profileSaving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans', fontSize: '0.9rem' }}>
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FlameIcon size={32} style={{ color: '#d4a574' }} />
          <h1 style={{ fontSize: '2.5rem', fontFamily: '"Playfair Display", serif', fontWeight: 400, letterSpacing: '0.06em', margin: 0, color: '#f5f0eb', fontStyle: 'italic' }}>Creator Portal</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowProfileModal(true)} style={{ padding: '0.75rem 1.5rem', background: 'rgba(212,165,116,0.1)', border: '1px solid rgba(212,165,116,0.3)', borderRadius: '6px', color: '#d4a574', fontWeight: 400, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '0.9rem' }}>
            Edit Profile
          </button>
          <button onClick={onHome} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,165,116,0.15)', borderRadius: '6px', color: '#f5f0eb', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '0.9rem' }}>
            Back to Viewing Room
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid rgba(212,165,116,0.1)', paddingBottom: '0' }}>
        <button
          onClick={() => setActiveTab('pilots')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 400,
            letterSpacing: '0.04em', fontStyle: 'italic',
            color: activeTab === 'pilots' ? '#f5f0eb' : 'rgba(245,240,235,0.4)',
            paddingBottom: '1rem', position: 'relative',
            borderBottom: activeTab === 'pilots' ? '2px solid #d4a574' : '2px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          My Pilots
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 400,
            letterSpacing: '0.04em', fontStyle: 'italic',
            color: activeTab === 'inbox' ? '#f5f0eb' : 'rgba(245,240,235,0.4)',
            paddingBottom: '1rem', position: 'relative',
            borderBottom: activeTab === 'inbox' ? '2px solid #d4a574' : '2px solid transparent',
            transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          Inbox
          {unreadCount > 0 && (
            <span style={{
              background: '#d4a574', color: '#0a0a0a', borderRadius: '50%',
              width: '20px', height: '20px', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontFamily: '"DM Sans", sans-serif', fontWeight: 600
            }}>{unreadCount}</span>
          )}
        </button>
      </div>

      {/* INBOX TAB */}
      {activeTab === 'inbox' && (
        <div>
          {messagesLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <Loader2 size={48} style={{ color: '#d4a574', animation: 'spin 1s linear infinite', margin: '0 auto', display: 'block' }} />
              <p style={{ color: 'rgba(245,240,235,0.6)', marginTop: '1rem', fontFamily: 'DM Sans' }}>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(212,165,116,0.15)' }}>
              <p style={{ color: 'rgba(245,240,235,0.5)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem' }}>No messages yet.</p>
            </div>
          ) : (
            <div style={{ maxWidth: '700px' }}>
              {Object.entries(messagesByPilot).map(([pilotTitle, msgs]) => (
                <div key={pilotTitle} style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 400,
                    letterSpacing: '0.04em', fontStyle: 'italic', color: '#d4a574',
                    margin: '0 0 1rem 0', paddingBottom: '0.5rem',
                    borderBottom: '1px solid rgba(212,165,116,0.15)'
                  }}>{pilotTitle}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {msgs.map(msg => (
                      <div
                        key={msg.id}
                        onClick={() => !msg.isRead && handleMarkRead(msg.id)}
                        style={{
                          padding: '1rem 1.25rem',
                          background: msg.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(212,165,116,0.06)',
                          border: '1px solid ' + (msg.isRead ? 'rgba(212,165,116,0.1)' : 'rgba(212,165,116,0.25)'),
                          borderRadius: '8px', cursor: msg.isRead ? 'default' : 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{
                            fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem',
                            fontWeight: msg.isRead ? 300 : 500,
                            color: msg.isRead ? 'rgba(245,240,235,0.4)' : '#d4a574'
                          }}>
                            {msg.senderName || 'Anonymous'}
                            {!msg.isRead && (
                              <span style={{
                                display: 'inline-block', width: '6px', height: '6px',
                                borderRadius: '50%', background: '#4ecdc4', marginLeft: '8px',
                                verticalAlign: 'middle'
                              }} />
                            )}
                          </span>
                          <span style={{
                            fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                            color: 'rgba(245,240,235,0.3)'
                          }}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </span>
                        </div>
                        <p style={{
                          margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem',
                          fontWeight: 300, color: 'rgba(245,240,235,0.8)', lineHeight: 1.6
                        }}>{msg.messageText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PILOTS TAB */}
      {activeTab === 'pilots' && (
        <>
          {/* Upload New Button */}
          <div style={{ marginBottom: '2rem' }}>
            <button onClick={onUploadNew} style={{ padding: '1rem 2rem', background: '#d4a574', border: 'none', borderRadius: '8px', color: '#0a0a0a', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: 'DM Sans' }}>
              + Upload New Pilot
            </button>
          </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 size={48} style={{ color: '#d4a574', animation: 'spin 1s linear infinite', margin: '0 auto', display: 'block' }} />
          <p style={{ color: 'rgba(245,240,235,0.6)', marginTop: '1rem', fontFamily: 'DM Sans' }}>Loading your pilots...</p>
        </div>
      ) : myPilots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(212,165,116,0.15)' }}>
          <p style={{ color: 'rgba(245,240,235,0.7)', marginBottom: '1.5rem', fontFamily: 'DM Sans' }}>You haven't uploaded any pilots yet.</p>
          <button onClick={onUploadNew} style={{ padding: '0.75rem 1.5rem', background: 'rgba(212,165,116,0.15)', border: '1px solid rgba(212,165,116,0.3)', borderRadius: '6px', color: '#d4a574', cursor: 'pointer', fontFamily: 'DM Sans' }}>
            Create Your First Pilot
          </button>
        </div>
      ) : (
        <>
          {/* My Pilots Section */}
          <h2 style={{ fontSize: '1.8rem', fontFamily: '"Playfair Display", serif', fontWeight: 400, letterSpacing: '0.06em', marginBottom: '2rem', color: '#f5f0eb', fontStyle: 'italic' }}>My Pilots</h2>

          {/* Pilots Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {myPilots.map(pilot => {
              const pilotComments = comments[pilot.id] || [];
              const avgRating = pilotComments.length > 0
                ? (pilotComments.reduce((sum, c) => sum + (c.rating || 0), 0) / pilotComments.length).toFixed(1)
                : null;

              return (
                <div key={pilot.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,165,116,0.15)', borderRadius: '12px', overflow: 'hidden', transition: 'all 0.3s' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(212,165,116,0.4)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(212,165,116,0.15)'; }}>

                  {/* Thumbnail */}
                  <div style={{ position: 'relative', paddingBottom: '56.25%', background: pilot.playbackId ? `url(https://image.mux.com/${pilot.playbackId}/thumbnail.png) center/cover` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', cursor: 'pointer' }}
                    onClick={() => onSelectPilot(pilot)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontFamily: 'DM Sans', fontWeight: 600, margin: '0 0 0.5rem', color: '#f5f0eb' }}>{pilot.pilotTitle}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(245,240,235,0.6)', margin: '0 0 1.25rem', lineHeight: '1.5', fontFamily: 'DM Sans' }}>
                      {pilot.genre || 'Drama'}
                    </p>

                    {/* Rating and Vote Count */}
                    {avgRating !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '1rem', background: 'rgba(212,165,116,0.08)', borderRadius: '8px', border: '1px solid rgba(212,165,116,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <StarIcon size={18} style={{ color: '#d4a574' }} />
                          <span style={{ fontWeight: 600, color: '#d4a574', fontFamily: 'DM Sans', fontSize: '0.95rem' }}>{avgRating}</span>
                        </div>
                        <span style={{ color: 'rgba(245,240,235,0.6)', fontSize: '0.85rem', fontFamily: 'DM Sans' }}>({pilotComments.length} {pilotComments.length === 1 ? 'rating' : 'ratings'})</span>
                      </div>
                    )}

                    {/* View Feedback Button */}
                    <button
                      onClick={() => toggleComments(pilot.id)}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        background: expandedComments[pilot.id] ? 'rgba(212,165,116,0.15)' : 'rgba(212,165,116,0.08)',
                        border: '1px solid rgba(212,165,116,0.25)',
                        borderRadius: '6px',
                        color: '#d4a574',
                        cursor: 'pointer',
                        fontFamily: 'DM Sans',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(212,165,116,0.15)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = expandedComments[pilot.id] ? 'rgba(212,165,116,0.15)' : 'rgba(212,165,116,0.08)'; }}
                    >
                      {expandedComments[pilot.id] ? 'Hide Feedback' : 'View Feedback'}
                    </button>

                    {/* Comments Section */}
                    {expandedComments[pilot.id] && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(212,165,116,0.15)' }}>
                        {commentLoading[pilot.id] ? (
                          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(245,240,235,0.6)', fontFamily: 'DM Sans' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem', display: 'block' }} />
                            Loading feedback...
                          </div>
                        ) : pilotComments.length === 0 ? (
                          <p style={{ textAlign: 'center', color: 'rgba(245,240,235,0.5)', fontFamily: 'DM Sans', fontSize: '0.9rem', margin: 0 }}>No feedback yet</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {pilotComments.map((comment, idx) => (
                              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,165,116,0.1)', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                  <StarIcon size={16} style={{ color: '#d4a574', fill: '#d4a574' }} />
                                  <span style={{ color: '#d4a574', fontWeight: 600, fontFamily: 'DM Sans', fontSize: '0.85rem' }}>
                                    {comment.rating || 0}/10
                                  </span>
                                </div>
                                <p style={{ margin: 0, color: 'rgba(245,240,235,0.8)', fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'DM Sans' }}>
                                  {comment.commentText || comment.text || 'No comment'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}

export default CreatorPortal;
