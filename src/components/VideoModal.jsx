import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Loader2, CheckCircle2 } from 'lucide-react';
import StorageManager from '../services/StorageManager';
import VideoPlayer from './VideoPlayer';
import { StarIcon, Icon } from './Icons';
import { ResubmissionTag } from '../utils/badges';
import LoginModal from '../pages/LoginModal';

function VideoModal({ pilot, currentUser, onClose, onLogin, onNavigate, onWatchAnother, onGoHome, onOpenCreatorProfile, onVoteSubmit }) {
  const videoRef = useRef(null);
  const modalRef = useRef(null);
  // Center the modal on screen (700px width, estimate ~500px height)
  const [position, setPosition] = useState(() => ({
    x: Math.max(20, (window.innerWidth - 700) / 2),
    y: 40
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [videoEnded, setVideoEnded] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState(null);
  const [voteData, setVoteData] = useState({
    overallScore: 0, comment: ''
  });
  const [existingVote, setExistingVote] = useState(null);
  const [loadingVote, setLoadingVote] = useState(true);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingArchivedId, setViewingArchivedId] = useState(null);
  const [archivedPilot, setArchivedPilot] = useState(null);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [pilotStats, setPilotStats] = useState(null);
  const [showVoteForm, setShowVoteForm] = useState(false); // For returning voters - show form or Community Pulse
  const [allPilotsViewed, setAllPilotsViewed] = useState(false); // All pilots have been viewed
  const [videoAspect, setVideoAspect] = useState('landscape'); // 'landscape' or 'portrait'

  // The pilot to display (either current or archived)
  const displayPilot = viewingArchivedId && archivedPilot ? archivedPilot : pilot;
  const isViewingArchived = !!viewingArchivedId;

  // Load archived pilot when viewingArchivedId changes
  useEffect(() => {
    if (viewingArchivedId) {
      setLoadingArchived(true);
      StorageManager.getPilots().then(allPilots => {
        const found = allPilots.find(p => p.id === viewingArchivedId);
        setArchivedPilot(found || null);
        setLoadingArchived(false);
      });
    } else {
      setArchivedPilot(null);
    }
  }, [viewingArchivedId]);

  // Reset state and check for existing vote when pilot changes
  useEffect(() => {
    // Reset all state first
    setVoteData({ overallScore: 0, comment: '' });
    setExistingVote(null);
    setVoteSubmitted(false);
    setVideoEnded(false);
    setPilotStats(null);
    setShowVoteForm(false);
    setLoadingVote(true);
    setViewingArchivedId(null);
    setArchivedPilot(null);

    // Then check for existing vote
    const checkExistingVote = async () => {
      if (pilot?.id && currentUser?.id) {
        try {
          const vote = await StorageManager.getVoterVoteForPilot(currentUser.id, pilot.id);
          if (vote) {
            setExistingVote(vote);
            setVoteData({
              overallScore: vote.overallScore || 0,
              comment: vote.comment || ''
            });
            // Fetch stats for returning voters to show Community Pulse
            const stats = await StorageManager.getPilotStats(pilot.id);
            setPilotStats(stats);
            setShowVoteForm(false); // Start with Community Pulse view
          }
        } catch (err) {
          console.error('Error checking existing vote:', err);
        }
      }
      setLoadingVote(false);
    };
    checkExistingVote();
  }, [pilot?.id, currentUser?.id]);

  // Initialize HLS video
  useEffect(() => {
    if (pilot?.playbackId && videoRef.current && currentUser) {
      const video = videoRef.current;
      const hlsUrl = `https://stream.mux.com/${pilot.playbackId}.m3u8`;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
      } else if (window.Hls && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
      }
    }
  }, [pilot?.playbackId, currentUser]);

  // Dragging handlers
  const handleHeaderMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleVideoEnd = () => setVideoEnded(true);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) { setLoginModalMode('signup'); return; }
    setSubmitting(true);
    try {
      const votePayload = {
        pilotId: pilot.id, pilotTitle: pilot.pilotTitle, voterId: currentUser.id,
        voterLocation: currentUser.location || '',
        voterGender: currentUser.gender || '',
        overallScore: voteData.overallScore,
        comment: voteData.comment
      };
      const result = await StorageManager.saveOrUpdateVote(votePayload);
      if (result.success) {
        setVoteSubmitted(true);
        // Notify parent that vote was submitted (for tracking voted pilots)
        if (onVoteSubmit) onVoteSubmit(pilot.id);
        // Fetch updated pilot stats to show comparison
        const stats = await StorageManager.getPilotStats(pilot.id);
        setPilotStats(stats);
      }
      else { alert('Error submitting vote. Please try again.'); }
    } catch (err) { console.error('Vote error:', err); alert('Error submitting vote.'); }
    setSubmitting(false);
  };


  if (!pilot) return null;

  // Window-in-window view
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');` }} />
      {/* Backdrop — blocks scroll and clicks to background */}
      <div onClick={onClose} onWheel={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9998, overscrollBehavior: 'contain' }} />

      {/* Modal Window */}
      <div
        ref={modalRef}
        className="video-modal-window"
        style={{
          position: 'fixed', left: position.x, top: position.y,
          width: 'min(700px, calc(100vw - 40px))', height: 'calc(100vh - 80px)',
          background: 'linear-gradient(145deg, rgba(18,18,18,0.92) 0%, rgba(12,12,12,0.92) 100%)',
          borderRadius: '24px', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)', zIndex: 9999,
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Outfit', sans-serif", backdropFilter: 'blur(24px)'
        }}
      >
        {/* Header - Draggable */}
        <div
          onMouseDown={handleHeaderMouseDown}
          style={{
          padding: '10px 12px', background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: isDragging ? 'grabbing' : 'grab', gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            {isViewingArchived && (
              <button onClick={() => setViewingArchivedId(null)} title="Back to current version"
                style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none',
                  background: 'rgba(78,205,196,0.2)', color: '#4ecdc4', cursor: 'pointer', fontSize: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
            )}
            <span style={{
              padding: '2px 6px', borderRadius: '6px', fontSize: 'clamp(0.55rem, 2vw, 0.65rem)', fontWeight: '500',
              background: displayPilot.genre === 'Comedy' ? 'rgba(254,202,87,0.12)' : 'rgba(78,205,196,0.12)',
              color: displayPilot.genre === 'Comedy' ? '#feca57' : '#4ecdc4', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0
            }}>{displayPilot.genre}</span>
            <h3 style={{ margin: 0, fontSize: 'clamp(0.8rem, 3vw, 0.95rem)', fontWeight: '500', color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{displayPilot.pilotTitle}</h3>
            {isViewingArchived ? (
              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: 'clamp(0.5rem, 2vw, 0.6rem)', fontWeight: '700',
                background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                V{displayPilot.version || 1}
              </span>
            ) : (
              <ResubmissionTag version={displayPilot.version} />
            )}
          </div>
          <button onClick={onClose} title="Close"
            style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '14px', flexShrink: 0,
              transition: 'all 0.25s ease' }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>×</button>
        </div>

        {/* Content - Scrollable */}
        <div className="video-modal-content" style={{ flex: 1, overflowY: 'auto', padding: '16px', overscrollBehavior: 'contain' }}>
          {/* Loading state for archived */}
          {loadingArchived ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Icon component={Loader2} style={{ width: '32px', height: '32px', color: '#4ecdc4', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '12px' }}>Loading archived version...</p>
            </div>
          ) : (
            <>
              {/* Video Player */}
              {!currentUser ? (
                <div className="video-modal-signin-block" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{
                    width: '100%', aspectRatio: '16/9', minHeight: '160px',
                    background: displayPilot.playbackId
                      ? `url(https://image.mux.com/${displayPilot.playbackId}/thumbnail.png) center/cover`
                      : 'linear-gradient(135deg, #0a0a0a 0%, #111111 100%)',
                    filter: 'blur(15px) brightness(0.4)', transform: 'scale(1.1)'
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', textAlign: 'center', padding: '1rem'
                  }}>
                    <Icon component={Play} style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px', color: 'rgba(255,255,255,0.9)' }}>Sign in to Watch</h4>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '16px', fontSize: '0.85rem' }}>Create a free account to vote</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setLoginModalMode('signup')}
                        style={{ padding: '0.7rem 1.5rem', background: 'none',
                          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.02em' }}
                        onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>Sign Up</button>
                      <button onClick={() => setLoginModalMode('login')}
                        style={{ padding: '0.7rem 1.5rem', background: 'none',
                          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.45)',
                          fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.02em' }}
                        onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>Log In</button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Logged in — play video directly (NDA removed) */
                <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  <video ref={videoRef} controls onEnded={handleVideoEnd} key={displayPilot.id}
                    poster={displayPilot.playbackId ? `https://image.mux.com/${displayPilot.playbackId}/thumbnail.png` : undefined}
                    className="video-modal-player"
                    style={{ width: '100%', maxHeight: '60vh', display: 'block', objectFit: 'contain', background: '#000' }} />
                </div>
              )}

              {/* Logline - only show if NDA accepted */}
              {(
                <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '300' }}>{displayPilot.logline}</p>
              )}

              {/* Creator Name - clickable */}
              {displayPilot.creatorName && (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginBottom: '16px' }}>
                  by <span
                    onClick={() => onOpenCreatorProfile && onOpenCreatorProfile(displayPilot.creatorUserId)}
                    style={{ color: '#4ecdc4', cursor: 'pointer', textDecoration: 'none' }}
                    onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>{displayPilot.creatorName}</span>
                </p>
              )}

              {/* Version navigation - only show if NDA accepted */}
              {(
                <>
                  {isViewingArchived ? (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <button
                        onClick={() => setViewingArchivedId(null)}
                        style={{ background: 'none', border: 'none', color: '#4ecdc4', fontSize: '0.85rem',
                          cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Current Version (V{pilot.version})
                      </button>
                      {displayPilot.previousVersionId && (
                        <button
                          onClick={() => setViewingArchivedId(displayPilot.previousVersionId)}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem',
                            cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          View Older (V{(displayPilot.version || 2) - 1})
                        </button>
                      )}
                    </div>
                  ) : pilot.previousVersionId && (
                    <button
                      onClick={() => setViewingArchivedId(pilot.previousVersionId)}
                      style={{ background: 'none', border: 'none', color: '#4ecdc4', fontSize: '0.85rem',
                        cursor: 'pointer', padding: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      View Previous Version{pilot.version > 2 ? 's' : ''} (V{(pilot.version || 2) - 1})
                    </button>
                  )}
                </>
              )}

          {/* Community Pulse for returning voters */}
          {currentUser &&!voteSubmitted && !loadingVote && !isViewingArchived && existingVote && !showVoteForm && pilotStats && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Community Pulse</div>
                <span style={{ fontSize: 'clamp(0.6rem, 2vw, 0.68rem)', background: 'rgba(78,205,196,0.08)', padding: '3px 8px', borderRadius: '8px', color: 'rgba(78,205,196,0.7)', letterSpacing: '0.04em' }}>You've voted</span>
              </div>
              {/* Stats */}
              <div style={{ padding: '12px' }}>
                {/* Overall Rating */}
                <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Overall Rating</div>
                  <div style={{ fontSize: 'clamp(1.8rem, 6vw, 2.4rem)', fontWeight: '800', background: 'linear-gradient(135deg, #d4a574, #feca57)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                    {pilotStats.avgOverall ? parseFloat(pilotStats.avgOverall).toFixed(2) : '—'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '6px 0' }}>
                    {[1,2,3,4,5].map(n => (
                      <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= Math.round(parseFloat(pilotStats.avgOverall) || 0) ? '#feca57' : 'rgba(255,255,255,0.2)'}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                    {pilotStats.totalVotes || 0} review{(pilotStats.totalVotes || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                </div>
                {/* Your Vote */}
                <div style={{ padding: '8px', background: 'rgba(78,205,196,0.15)', borderRadius: '8px', border: '1px solid rgba(78,205,196,0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Your Vote</div>
                  <div style={{ fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', fontWeight: '700', color: '#4ecdc4' }}>★ {existingVote.overallScore}</div>
                </div>
              </div>
              {/* Action buttons */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowVoteForm(true)}
                  style={{ flex: 1, padding: '0.7rem', background: 'none',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'rgba(255,255,255,0.45)',
                    fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.02em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
                  Update Vote
                </button>
                {onWatchAnother && !allPilotsViewed && (
                  <button onClick={() => { const result = onWatchAnother(); if (result === 'all_viewed') setAllPilotsViewed(true); }}
                    style={{ flex: 1, padding: '0.7rem', background: 'none',
                      border: '1px solid rgba(78,205,196,0.2)', borderRadius: '10px', color: 'rgba(78,205,196,0.6)',
                      fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.02em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.9)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.6)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.2)'; }}>
                    Watch Another
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Voting Section - for new voters OR returning voters who clicked Update Vote */}
          {currentUser &&!voteSubmitted && !loadingVote && !isViewingArchived && (!existingVote || showVoteForm) && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '2rem 1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
              {showVoteForm && existingVote && (
                <button onClick={() => setShowVoteForm(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem',
                    cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px',
                    transition: 'color 0.2s', padding: 0 }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Back to Community Pulse
                </button>
              )}

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(212,165,116,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {existingVote ? 'Update Your Rating' : 'Rate This Pilot'}
                </div>
              </div>
              <form onSubmit={handleVoteSubmit}>
                {/* Overall Rating */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setVoteData(prev => ({...prev, overallScore: n}))}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, transition: 'transform 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                        <StarIcon size={36} filled={voteData.overallScore >= n} color="#d4a574" />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Notes */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Notes</div>
                  <textarea
                    value={voteData.comment}
                    onChange={(e) => setVoteData(prev => ({...prev, comment: e.target.value}))}
                    placeholder="Share anonymous notes with the creator..."
                    rows={3}
                    style={{ width: '100%', padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.04)',
                      border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff',
                      fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif", resize: 'vertical',
                      outline: 'none', lineHeight: '1.6', boxSizing: 'border-box', transition: 'all 0.25s ease' }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(78,205,196,0.5)'; e.target.style.background = 'rgba(78,205,196,0.05)'; e.target.style.boxShadow = '0 0 0 3px rgba(78,205,196,0.08)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <button type="submit" disabled={submitting || !voteData.overallScore}
                  style={{ width: '100%', padding: '0.7rem 2rem', background: 'none',
                    border: '1px solid ' + ((!voteData.overallScore || submitting) ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'),
                    borderRadius: '10px', color: (!voteData.overallScore || submitting) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)',
                    fontSize: '0.85rem', fontWeight: '500', letterSpacing: '0.03em',
                    cursor: (!voteData.overallScore || submitting) ? 'not-allowed' : 'pointer', transition: 'all 0.25s ease' }}
                  onMouseOver={(e) => { if (voteData.overallScore && !submitting) { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}}
                  onMouseOut={(e) => { e.currentTarget.style.color = (!voteData.overallScore || submitting) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = (!voteData.overallScore || submitting) ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'; }}>
                  {submitting ? 'Submitting...' : existingVote ? 'Update' : 'Submit'}
                </button>
              </form>
            </div>
          )}

          {/* Vote Submitted - show comparison cards */}
          {currentUser &&voteSubmitted && !isViewingArchived && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Icon component={CheckCircle2} style={{ width: '36px', height: '36px', color: 'rgba(78,205,196,0.7)', marginBottom: '8px' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {existingVote ? 'Vote Updated' : 'Vote Submitted'}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', margin: '4px 0 0' }}>Here's how you compare to the community</p>
              </div>

              {/* Comparison Cards */}
              {pilotStats && (
                <div style={{ padding: '16px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    {/* Overall */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Community Average</div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#d4a574' }}>
                        {pilotStats.avgOverall ? parseFloat(pilotStats.avgOverall).toFixed(2) : '—'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '6px 0' }}>
                        {[1,2,3,4,5].map(n => (
                          <svg key={n} width="16" height="16" viewBox="0 0 24 24" fill={n <= Math.round(parseFloat(pilotStats.avgOverall) || 0) ? '#feca57' : 'rgba(255,255,255,0.2)'}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                        {pilotStats.totalVotes || 1} review{(pilotStats.totalVotes || 1) !== 1 ? 's' : ''}
                      </div>
                      {(() => {
                        const diff = voteData.overallScore - (parseFloat(pilotStats.avgOverall) || 0);
                        const color = diff > 0.2 ? '#4ecdc4' : diff < -0.2 ? '#ff6b6b' : 'rgba(255,255,255,0.6)';
                        const symbol = diff > 0.2 ? '↑' : diff < -0.2 ? '↓' : '=';
                        return (
                          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '10px',
                            background: diff > 0.2 ? 'rgba(78,205,196,0.2)' : diff < -0.2 ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.1)',
                            color }}>
                            You: {voteData.overallScore} {symbol}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {onWatchAnother && !allPilotsViewed && (
                      <button onClick={() => { const result = onWatchAnother(); if (result === 'all_viewed') setAllPilotsViewed(true); }}
                        style={{ padding: '0.7rem 1.5rem', background: 'none',
                          border: '1px solid rgba(78,205,196,0.2)', borderRadius: '10px', color: 'rgba(78,205,196,0.6)',
                          fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500', transition: 'all 0.25s ease', letterSpacing: '0.02em' }}
                        onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.9)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.6)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.2)'; }}>
                        Watch Another Pilot
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Fallback if no stats */}
              {!pilotStats && (
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', fontSize: '0.9rem' }}>Thank you for your feedback!</p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => { setVoteSubmitted(false); setExistingVote(voteData); }}
                      style={{ padding: '0.7rem 1.5rem', background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500',
                        transition: 'all 0.25s ease', letterSpacing: '0.02em' }}
                      onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>Edit Vote</button>
                    {onWatchAnother && !allPilotsViewed && (
                      <button onClick={() => { const result = onWatchAnother(); if (result === 'all_viewed') setAllPilotsViewed(true); }}
                        style={{ padding: '0.7rem 1.5rem', background: 'none',
                          border: '1px solid rgba(78,205,196,0.2)', borderRadius: '10px', color: 'rgba(78,205,196,0.6)',
                          fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500', transition: 'all 0.25s ease', letterSpacing: '0.02em' }}
                        onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.9)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.6)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.2)'; }}>
                        Watch Another Pilot
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {loadingVote && currentUser &&!isViewingArchived && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Icon component={Loader2} style={{ width: '24px', height: '24px', color: '#d4a574', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* All Pilots Viewed Message */}
          {allPilotsViewed && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '2rem', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', marginTop: '12px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>All Caught Up</div>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>You've viewed all available pilots. Thank you for being part of the community.</p>
              <button onClick={onGoHome}
                style={{ padding: '0.7rem 2rem', background: 'none',
                  border: '1px solid rgba(78,205,196,0.2)', borderRadius: '10px', color: 'rgba(78,205,196,0.6)',
                  fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500', transition: 'all 0.25s ease', letterSpacing: '0.02em' }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.9)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.6)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.2)'; }}>
                Continue Browsing
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {loginModalMode && (
        <LoginModal
          onClose={() => setLoginModalMode(null)}
          onLogin={(user) => { onLogin(user); setLoginModalMode(null); }}
          onForgotPassword={onNavigate ? () => { setLoginModalMode(null); onClose(); onNavigate('forgot-password'); } : undefined}
          message="Create a free account to watch and vote!"
          initialMode={loginModalMode}
        />
      )}

    </>
  );
}

export default VideoModal;
