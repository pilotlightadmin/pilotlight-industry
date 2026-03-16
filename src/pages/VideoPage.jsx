import React, { useState, useRef } from 'react';
import StorageManager from '../services/StorageManager';
import { StarIcon } from '../components/Icons';
import { Loader2, CheckCircle2 } from 'lucide-react';


function VideoPage({ pilot, currentUser, onContinueBrowsing, onReviewAnother, pilotsRemaining = 1 }) {
  const [videoEnded, setVideoEnded] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [pilotStats, setPilotStats] = useState(null);
  const [existingVote, setExistingVote] = useState(null);
  const [loadingVote, setLoadingVote] = useState(true);
  const [contactMessage, setContactMessage] = useState('');
  const [includeIdentity, setIncludeIdentity] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const videoRef = useRef(null);

  // Reset state when pilot changes (for auto-advance)
  React.useEffect(() => {
    setVideoEnded(false);
    setRating(0);
    setComment('');
    setVoteSubmitted(false);
    setSubmitting(false);
    setPilotStats(null);
    setExistingVote(null);
    setLoadingVote(true);
    setContactMessage('');
    setIncludeIdentity(false);
    setMessageSent(false);
    setSendingMessage(false);
    setShowContactForm(false);
  }, [pilot?.id]);

  // Check for existing vote on mount
  React.useEffect(() => {
    const checkExistingVote = async () => {
      if (pilot?.id && currentUser?.id) {
        try {
          const vote = await StorageManager.getVoterVoteForPilot(currentUser.id, pilot.id);
          if (vote) {
            setExistingVote(vote);
            setRating(vote.overallScore || 0);
            setComment(vote.comment || '');
          }
        } catch (err) {
          console.error('Error checking existing vote:', err);
        }
      }
      setLoadingVote(false);
    };
    checkExistingVote();
  }, [pilot?.id, currentUser?.id]);

  React.useEffect(() => {
    if (pilot?.playbackId && videoRef.current) {
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
  }, [pilot?.playbackId]);

  const handleVideoEnd = () => setVideoEnded(true);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const votePayload = {
        pilotId: pilot.id,
        pilotTitle: pilot.pilotTitle,
        voterId: currentUser?.id || 'anonymous',
        voterLocation: currentUser?.location || '',
        voterGender: currentUser?.gender || '',
        overallScore: rating,
        comment: comment.trim()
      };
      const result = await StorageManager.saveOrUpdateVote(votePayload);
      if (result.success) {
        setVoteSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('Error submitting vote. Please try again.');
      }
    } catch (err) {
      console.error('Vote error:', err);
      alert('Error submitting vote.');
    }
    setSubmitting(false);
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim()) return;
    setSendingMessage(true);
    try {
      const result = await StorageManager.sendMessage({
        toCreatorUserId: pilot.creatorUserId || pilot.userId,
        pilotId: pilot.id,
        pilotTitle: pilot.pilotTitle,
        messageText: contactMessage.trim(),
        senderName: includeIdentity ? (currentUser?.username || currentUser?.name || null) : null,
        fromUserId: currentUser?.id || 'anonymous'
      });
      if (result.success) {
        setMessageSent(true);
        setContactMessage('');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Message send error:', err);
      alert('Failed to send message.');
    }
    setSendingMessage(false);
  };

  if (!pilot) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#f5f0eb' }}>
      No pilot selected
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '2rem' }}>
      {/* Back button header */}
      <div style={{ maxWidth: '900px', margin: '0 auto 2rem' }}>
        <button
          className="roll-hover"
          onClick={onContinueBrowsing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: '1px solid rgba(212, 165, 116, 0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#d4a574',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '13px',
            fontWeight: 400,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.6)';
            e.currentTarget.style.backgroundColor = 'rgba(212, 165, 116, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.3)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Return to Viewing Room
        </button>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Video Player / Rating area */}
        <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', position: 'relative' }}>
          {/* Invisible spacer to maintain 16:9 ratio when video is hidden */}
          <div style={{ width: '100%', paddingBottom: '56.25%' }} />
          {/* Video — hidden once ended and rating shown */}
          <video
            ref={videoRef}
            controls
            onEnded={handleVideoEnd}
            poster={pilot.playbackId ? `https://image.mux.com/${pilot.playbackId}/thumbnail.png` : undefined}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: videoEnded && !voteSubmitted ? 'none' : 'block',
              objectFit: 'contain',
              background: '#000',
            }}
          />

          {/* Rating / Post-vote overlay — replaces video */}
          {videoEnded && !loadingVote && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(10, 10, 10, 0.97)',
                border: '1px solid rgba(212, 165, 116, 0.15)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
                animation: 'fadeIn 0.4s ease-out',
              }}
            >
              {!voteSubmitted ? (
                <>
                  <h2
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '28px',
                      fontWeight: 400,
                      letterSpacing: '0.06em',
                      color: '#d4a574',
                      textAlign: 'center',
                      margin: '0 0 24px',
                      fontStyle: 'italic',
                    }}
                  >
                    Rate This Pilot
                  </h2>

                  <form onSubmit={handleVoteSubmit} style={{ width: '100%', maxWidth: '400px' }}>
                    {/* Star rating */}
                    <div style={{ marginBottom: '24px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          justifyContent: 'center',
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <StarIcon
                              size={40}
                              filled={rating >= n}
                              color="#d4a574"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment text area */}
                    <div style={{ marginBottom: '24px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: '13px',
                          fontWeight: 400,
                          color: '#f5f0eb',
                          marginBottom: '8px',
                        }}
                      >
                        Additional Comments (Optional)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(212, 165, 116, 0.15)',
                          borderRadius: '8px',
                          color: '#f5f0eb',
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: '13px',
                          fontWeight: 300,
                          padding: '12px',
                          resize: 'vertical',
                          outline: 'none',
                          transition: 'border-color 0.3s ease',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.4)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.15)';
                        }}
                      />
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={submitting || rating === 0}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background:
                          rating > 0 && !submitting
                            ? 'linear-gradient(135deg, #d4a574 0%, #b8860b 100%)'
                            : 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(184, 134, 11, 0.3) 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color:
                          rating > 0 && !submitting ? '#0a0a0a' : 'rgba(245, 240, 235, 0.4)',
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: '13px',
                        fontWeight: 400,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        cursor: rating > 0 && !submitting ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (rating > 0 && !submitting) {
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 165, 116, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </form>
                </>
              ) : (
                /* Post-vote — thank you + next pilot / return */
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle2
                    size={48}
                    style={{ color: '#d4a574', marginBottom: '16px' }}
                  />
                  <h2
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '28px',
                      fontWeight: 400,
                      letterSpacing: '0.06em',
                      color: '#d4a574',
                      margin: '0 0 8px',
                      fontStyle: 'italic',
                    }}
                  >
                    Thank you.
                  </h2>
                  <p
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '14px',
                      fontWeight: 300,
                      color: 'rgba(245, 240, 235, 0.5)',
                      margin: '0 0 32px',
                    }}
                  >
                    Your review has been submitted.
                  </p>
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {pilotsRemaining > 0 && (
                      <button
                        className="roll-hover"
                        onClick={onReviewAnother}
                        style={{
                          padding: '12px 32px',
                          background: 'linear-gradient(135deg, #d4a574 0%, #b8860b 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#0a0a0a',
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: '13px',
                          fontWeight: 400,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 165, 116, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Next Pilot
                      </button>
                    )}
                    <button
                      className="roll-hover"
                      onClick={onContinueBrowsing}
                      style={{
                        padding: '12px 32px',
                        background: 'transparent',
                        border: '1px solid rgba(212, 165, 116, 0.4)',
                        borderRadius: '8px',
                        color: '#d4a574',
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: '13px',
                        fontWeight: 400,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.7)';
                        e.currentTarget.style.backgroundColor = 'rgba(212, 165, 116, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.4)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Return to Viewing Room
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading vote overlay */}
          {videoEnded && loadingVote && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(10, 10, 10, 0.97)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2
                size={32}
                style={{
                  color: '#d4a574',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '0.5rem',
                }}
              />
              <p style={{ color: 'rgba(245, 240, 235, 0.5)', fontSize: '14px' }}>
                Loading...
              </p>
            </div>
          )}
        </div>

        {/* Pilot Info + Contact Creator button */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <h1
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '42px',
                fontWeight: 400,
                letterSpacing: '0.06em',
                color: '#d4a574',
                margin: '0 0 8px',
                fontStyle: 'italic',
                flex: 1,
              }}
            >
              {pilot.pilotTitle}
            </h1>
            <button
              className="roll-hover"
              onClick={() => setShowContactForm(!showContactForm)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(78, 205, 196, 0.4)',
                borderRadius: '6px',
                padding: '8px 16px',
                color: '#4ecdc4',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                marginTop: '8px',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(78, 205, 196, 0.08)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(78, 205, 196, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {showContactForm ? 'Close' : 'Contact Creator'}
            </button>
          </div>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 300,
              color: 'rgba(245, 240, 235, 0.7)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {pilot.logline}
          </p>
        </div>

        {/* Contact Creator form — toggled by button */}
        {showContactForm && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(78, 205, 196, 0.15)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '2rem',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            {messageSent ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CheckCircle2 size={32} style={{ color: '#4ecdc4', marginBottom: '8px' }} />
                <p style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  color: 'rgba(245, 240, 235, 0.7)',
                  margin: 0,
                }}>Message sent successfully.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Write a message to the creator..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(212, 165, 116, 0.15)',
                    borderRadius: '8px',
                    color: '#f5f0eb',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 300,
                    padding: '12px',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.4)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.15)'; }}
                />
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '12px',
                    cursor: 'pointer',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 300,
                    color: 'rgba(245, 240, 235, 0.5)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeIdentity}
                    onChange={(e) => setIncludeIdentity(e.target.checked)}
                    style={{ accentColor: '#4ecdc4', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  Include my name
                </label>
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !contactMessage.trim()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '16px',
                    background: 'transparent',
                    border: '1px solid ' + (contactMessage.trim() && !sendingMessage ? 'rgba(78, 205, 196, 0.5)' : 'rgba(212, 165, 116, 0.15)'),
                    borderRadius: '8px',
                    color: contactMessage.trim() && !sendingMessage ? '#4ecdc4' : 'rgba(245, 240, 235, 0.3)',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    cursor: contactMessage.trim() && !sendingMessage ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (contactMessage.trim() && !sendingMessage) {
                      e.currentTarget.style.backgroundColor = 'rgba(78, 205, 196, 0.08)';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(78, 205, 196, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default VideoPage;
