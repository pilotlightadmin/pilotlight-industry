import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Loader2, CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react';
import StorageManager from '../services/StorageManager';
import { PULL_FACTORS } from '../utils/constants';
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
    curiosityScore: 0, seriesScore: 0, overallScore: 0,
    pullFactorsIn: [], pullFactorsBack: []
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
  const [fundingNotifyShown, setFundingNotifyShown] = useState(null); // pilotId when "no funding" toast is shown

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
    setVoteData({ curiosityScore: 0, seriesScore: 0, overallScore: 0, pullFactorsIn: [], pullFactorsBack: [] });
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
              curiosityScore: vote.curiosityScore || 0,
              seriesScore: vote.seriesScore || 0,
              overallScore: vote.overallScore || 0,
              pullFactorsIn: vote.pullFactorsIn || [],
              pullFactorsBack: vote.pullFactorsBack || []
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
        curiosityScore: voteData.curiosityScore, seriesScore: voteData.seriesScore,
        overallScore: voteData.overallScore, pullFactorsIn: voteData.pullFactorsIn,
        pullFactorsBack: voteData.pullFactorsBack
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

  const togglePullFactor = (type, factor) => {
    const key = type === 'in' ? 'pullFactorsIn' : 'pullFactorsBack';
    setVoteData(prev => ({
      ...prev,
      [key]: prev[key].includes(factor) ? prev[key].filter(f => f !== factor) : [...prev[key], factor]
    }));
  };

  if (!pilot) return null;

  // Window-in-window view
  return (
    <>
      {/* Backdrop — blocks scroll and clicks to background */}
      <div onClick={onClose} onWheel={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, overscrollBehavior: 'contain' }} />

      {/* Modal Window */}
      <div
        ref={modalRef}
        className="video-modal-window"
        style={{
          position: 'fixed', left: position.x, top: position.y,
          width: 'min(700px, calc(100vw - 40px))', height: 'calc(100vh - 80px)',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 9999,
          border: '1px solid rgba(78,205,196,0.3)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Header - Draggable */}
        <div
          onMouseDown={handleHeaderMouseDown}
          style={{
          padding: '10px 12px', background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: isDragging ? 'grabbing' : 'grab', gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            {isViewingArchived && (
              <button onClick={() => setViewingArchivedId(null)} title="Back to current version"
                style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none',
                  background: 'rgba(78,205,196,0.2)', color: '#4ecdc4', cursor: 'pointer', fontSize: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
            )}
            <span style={{
              padding: '2px 6px', borderRadius: '4px', fontSize: 'clamp(0.55rem, 2vw, 0.65rem)', fontWeight: '700',
              background: displayPilot.genre === 'Comedy' ? 'rgba(254,202,87,0.2)' : 'rgba(78,205,196,0.2)',
              color: displayPilot.genre === 'Comedy' ? '#feca57' : '#4ecdc4', textTransform: 'uppercase', flexShrink: 0
            }}>{displayPilot.genre}</span>
            <h3 style={{ margin: 0, fontSize: 'clamp(0.8rem, 3vw, 0.95rem)', fontWeight: '600', color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{displayPilot.pilotTitle}</h3>
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
            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              background: 'rgba(255,107,107,0.2)', color: '#ff6b6b', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}>×</button>
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
                      : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    filter: 'blur(15px) brightness(0.4)', transform: 'scale(1.1)'
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', textAlign: 'center', padding: '1rem'
                  }}>
                    <Icon component={Play} style={{ width: '32px', height: '32px', color: '#d4a574', marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px', color: '#fff' }}>Sign in to Watch</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '12px', fontSize: '0.85rem' }}>Create a free account to vote</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setLoginModalMode('signup')}
                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #d4a574 0%, #b8860b 100%)',
                          border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer' }}>Sign Up</button>
                      <button onClick={() => setLoginModalMode('login')}
                        style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Log In</button>
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
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', marginBottom: '8px', fontSize: '0.95rem' }}>{displayPilot.logline}</p>
              )}

              {/* Creator Name - clickable */}
              {displayPilot.creatorName && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '12px' }}>
                  by <span
                    onClick={() => onOpenCreatorProfile && onOpenCreatorProfile(displayPilot.creatorUserId)}
                    style={{ color: '#4ecdc4', cursor: 'pointer', textDecoration: 'none' }}
                    onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>{displayPilot.creatorName}</span>
                </p>
              )}

              {/* Fund This Pilot */}
              {displayPilot.fundingUrl ? (
                <a href={displayPilot.fundingUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                    background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)', border: 'none', borderRadius: '8px',
                    color: '#fff', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'none',
                    marginBottom: '12px', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,206,201,0.3)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  Fund This Pilot
                </a>
              ) : (
                <button
                  onClick={() => {
                    setFundingNotifyShown(displayPilot.id);
                    // Record interest in Airtable (once per user per pilot)
                    const key = `pl_funding_interest_${displayPilot.id}`;
                    if (!localStorage.getItem(key)) {
                      localStorage.setItem(key, Date.now());
                      StorageManager.incrementFundingInterest(displayPilot.id);
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                    color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                    marginBottom: '12px', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Fund This Pilot
                </button>
              )}

              {/* Funding not set up notification */}
              {fundingNotifyShown === displayPilot.id && (
                <div style={{ background: 'rgba(255,99,72,0.12)', border: '1px solid rgba(255,99,72,0.3)',
                  borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', position: 'relative',
                  animation: 'fadeIn 0.3s ease-out' }}>
                  <button onClick={() => setFundingNotifyShown(null)}
                    style={{ position: 'absolute', top: '8px', right: '10px', background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}>✕</button>
                  <p style={{ color: '#ff6348', fontSize: '0.85rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                    Funding not set up yet
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0, lineHeight: '1.4', paddingRight: '16px' }}>
                    This creator hasn't added a crowdfunding link yet — but they've been notified that someone wants to support their project. Check back soon!
                  </p>
                </div>
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
            <div style={{ background: 'rgba(212,165,116,0.08)', borderRadius: '12px', border: '1px solid rgba(212,165,116,0.3)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <h4 style={{ margin: 0, fontSize: 'clamp(0.85rem, 3vw, 1rem)', fontWeight: '700', color: '#d4a574' }}>Community Pulse</h4>
                <span style={{ fontSize: 'clamp(0.6rem, 2vw, 0.7rem)', background: 'rgba(78,205,196,0.2)', padding: '2px 6px', borderRadius: '8px', color: '#4ecdc4' }}>You've voted</span>
              </div>
              {/* Stats grid - responsive layout */}
              <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {/* Overall Rating - spans full width on mobile */}
                <div style={{ gridColumn: 'span 2', padding: '12px', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
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
                {/* Stat cards in 2x2 grid */}
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>🔥 Curiosity</div>
                  <div style={{ fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', fontWeight: '700', color: '#e17055' }}>{pilotStats.avgCuriosity ? parseFloat(pilotStats.avgCuriosity).toFixed(2) : '—'}</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>📺 Series</div>
                  <div style={{ fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', fontWeight: '700', color: '#fd79a8' }}>{pilotStats.avgSeries ? parseFloat(pilotStats.avgSeries).toFixed(2) : '—'}</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>👍 Strength</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)', fontWeight: '700', color: '#4ecdc4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pilotStats.topPullFactorsIn && pilotStats.topPullFactorsIn.length > 0 ? pilotStats.topPullFactorsIn[0] : '—'}
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(78,205,196,0.15)', borderRadius: '8px', border: '1px solid rgba(78,205,196,0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>📊 Your Vote</div>
                  <div style={{ fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', fontWeight: '700', color: '#4ecdc4' }}>★ {existingVote.overallScore}</div>
                </div>
              </div>
              {/* Action buttons */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.15)', display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowVoteForm(true)}
                  style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #d4a574 0%, #b8860b 100%)',
                    border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Update Vote
                </button>
                {onWatchAnother && !allPilotsViewed && (
                  <button onClick={() => { const result = onWatchAnother(); if (result === 'all_viewed') setAllPilotsViewed(true); }}
                    style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                      border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Watch Another
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Voting Section - for new voters OR returning voters who clicked Update Vote */}
          {currentUser &&!voteSubmitted && !loadingVote && !isViewingArchived && (!existingVote || showVoteForm) && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(212,165,116,0.2)' }}>
              {showVoteForm && existingVote && (
                <button onClick={() => setShowVoteForm(false)}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem',
                    cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Back to Community Pulse
                </button>
              )}

              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#d4a574', textAlign: 'center' }}>
                {existingVote ? 'Update Your Rating' : 'Rate This Pilot'}
              </h4>
              <form onSubmit={handleVoteSubmit}>
                {/* Curiosity */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#e17055', fontSize: '0.9rem' }}>Curiosity</label>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>How curious are you about this world?</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setVoteData(prev => ({...prev, curiosityScore: n}))}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                          background: voteData.curiosityScore >= n ? 'linear-gradient(135deg, #e17055 0%, #d63031 100%)' : 'rgba(255,255,255,0.1)',
                          cursor: 'pointer', transition: 'all 0.2s' }} />
                    ))}
                  </div>
                </div>
                {/* Series Potential */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#fd79a8', fontSize: '0.9rem' }}>Series Potential</label>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Would this make a great series?</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setVoteData(prev => ({...prev, seriesScore: n}))}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                          background: voteData.seriesScore >= n ? 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)' : 'rgba(255,255,255,0.1)',
                          cursor: 'pointer', transition: 'all 0.2s' }} />
                    ))}
                  </div>
                </div>
                {/* Overall */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#d4a574', fontSize: '0.9rem' }}>Overall Rating</label>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Your overall impression</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setVoteData(prev => ({...prev, overallScore: n}))}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <StarIcon size={36} filled={voteData.overallScore >= n} color="#d4a574" />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Pull Factors */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Icon component={ThumbsUp} style={{ width: '16px', height: '16px', color: '#e17055' }} />
                    <label style={{ fontWeight: '600', color: '#e17055', fontSize: '0.85rem' }}>What pulled you IN?</label>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PULL_FACTORS.map(f => (
                      <button key={f} type="button" onClick={() => togglePullFactor('in', f)}
                        style={{ padding: '4px 10px', borderRadius: '14px', border: 'none', fontSize: '0.75rem',
                          background: voteData.pullFactorsIn.includes(f) ? 'linear-gradient(135deg, #e17055 0%, #d63031 100%)' : 'rgba(255,255,255,0.1)',
                          color: '#fff', cursor: 'pointer' }}>{f}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Icon component={ThumbsDown} style={{ width: '16px', height: '16px', color: '#b33939' }} />
                    <label style={{ fontWeight: '600', color: '#b33939', fontSize: '0.85rem' }}>What held it BACK?</label>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PULL_FACTORS.map(f => (
                      <button key={f} type="button" onClick={() => togglePullFactor('back', f)}
                        style={{ padding: '4px 10px', borderRadius: '14px', border: 'none', fontSize: '0.75rem',
                          background: voteData.pullFactorsBack.includes(f) ? 'linear-gradient(135deg, #b33939 0%, #8B0000 100%)' : 'rgba(255,255,255,0.1)',
                          color: '#fff', cursor: 'pointer' }}>{f}</button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={submitting || !voteData.overallScore}
                  style={{ width: '100%', padding: '12px', background: (!voteData.overallScore || submitting) ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #d4a574 0%, #b8860b 100%)',
                    border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: '700',
                    cursor: (!voteData.overallScore || submitting) ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting...' : existingVote ? 'Update Vote' : 'Submit Vote'}
                </button>
              </form>
            </div>
          )}

          {/* Vote Submitted - show comparison cards */}
          {currentUser &&voteSubmitted && !isViewingArchived && (
            <div style={{ background: 'rgba(212,165,116,0.1)', borderRadius: '16px', border: '1px solid rgba(212,165,116,0.3)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Icon component={CheckCircle2} style={{ width: '36px', height: '36px', color: '#d4a574', marginBottom: '6px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#d4a574', margin: 0 }}>
                  {existingVote ? 'Vote Updated!' : 'Vote Submitted!'}
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '4px 0 0' }}>Here's how you compare to the community</p>
              </div>

              {/* Comparison Cards */}
              {pilotStats && (
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    {/* Curiosity */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>🔥 Curiosity</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#e17055' }}>
                        {pilotStats.avgCuriosity ? parseFloat(pilotStats.avgCuriosity).toFixed(2) : '—'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>avg</div>
                      {(() => {
                        const diff = voteData.curiosityScore - (parseFloat(pilotStats.avgCuriosity) || 0);
                        const color = diff > 0.2 ? '#4ecdc4' : diff < -0.2 ? '#ff6b6b' : 'rgba(255,255,255,0.6)';
                        const symbol = diff > 0.2 ? '↑' : diff < -0.2 ? '↓' : '=';
                        return (
                          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '10px',
                            background: diff > 0.2 ? 'rgba(78,205,196,0.2)' : diff < -0.2 ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.1)',
                            color }}>
                            You: {voteData.curiosityScore} {symbol}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Series Potential */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>📺 Series</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fd79a8' }}>
                        {pilotStats.avgSeries ? parseFloat(pilotStats.avgSeries).toFixed(2) : '—'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>avg</div>
                      {(() => {
                        const diff = voteData.seriesScore - (parseFloat(pilotStats.avgSeries) || 0);
                        const color = diff > 0.2 ? '#4ecdc4' : diff < -0.2 ? '#ff6b6b' : 'rgba(255,255,255,0.6)';
                        const symbol = diff > 0.2 ? '↑' : diff < -0.2 ? '↓' : '=';
                        return (
                          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '10px',
                            background: diff > 0.2 ? 'rgba(78,205,196,0.2)' : diff < -0.2 ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.1)',
                            color }}>
                            You: {voteData.seriesScore} {symbol}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Overall */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>⭐ Overall</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#d4a574' }}>
                        {pilotStats.avgOverall ? parseFloat(pilotStats.avgOverall).toFixed(2) : '—'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>avg</div>
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

                  {/* Vote count & top factors */}
                  <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                      Based on {pilotStats.totalVotes || 1} review{(pilotStats.totalVotes || 1) !== 1 ? 's' : ''}
                    </div>
                    {pilotStats.topPullFactorsIn && pilotStats.topPullFactorsIn.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        Top strengths: {pilotStats.topPullFactorsIn.slice(0, 2).map((f, i) => (
                          <span key={f} style={{ color: '#4ecdc4', fontWeight: '600' }}>{i > 0 ? ', ' : ''}{f}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {onWatchAnother && !allPilotsViewed && (
                      <button onClick={() => { const result = onWatchAnother(); if (result === 'all_viewed') setAllPilotsViewed(true); }}
                        style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                          border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '700' }}>
                        Watch Another Pilot
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Fallback if no stats */}
              {!pilotStats && (
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '12px', fontSize: '0.9rem' }}>Thank you for your feedback!</p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => { setVoteSubmitted(false); setExistingVote(voteData); }}
                      style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>Edit Vote</button>
                    {onWatchAnother && !allPilotsViewed && (
                      <button onClick={() => { const result = onWatchAnother(); if (result === 'all_viewed') setAllPilotsViewed(true); }}
                        style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                          border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '700' }}>
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
            <div style={{ background: 'linear-gradient(135deg, rgba(78,205,196,0.15), rgba(68,160,141,0.15))', borderRadius: '12px', padding: '20px', border: '1px solid rgba(78,205,196,0.3)', textAlign: 'center', marginTop: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
              <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: '700', color: '#4ecdc4' }}>You've viewed all available pilots!</h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Thank you for being an active member of the Pilot Light community.</p>
              <button onClick={onGoHome}
                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                  border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '700' }}>
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
