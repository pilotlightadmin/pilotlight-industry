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
  const videoRef = useRef(null);

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
        // Fetch updated stats
        const stats = await StorageManager.getPilotStats(pilot.id);
        setPilotStats(stats);
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
        {/* Video Player */}
        <div style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            controls
            onEnded={handleVideoEnd}
            poster={pilot.playbackId ? `https://image.mux.com/${pilot.playbackId}/thumbnail.png` : undefined}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'contain',
              background: '#000',
            }}
          />
        </div>

        {/* Pilot Info */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '42px',
              fontWeight: 300,
              letterSpacing: '0.15em',
              color: '#d4a574',
              margin: '0 0 8px',
            }}
          >
            {pilot.pilotTitle}
          </h1>
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

        {/* Loading state */}
        {loadingVote && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader2
              size={32}
              style={{
                color: '#d4a574',
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem',
              }}
            />
            <p style={{ color: 'rgba(245, 240, 235, 0.5)', fontSize: '14px' }}>
              Loading vote data...
            </p>
          </div>
        )}

        {/* Rating section - shown after video ends */}
        {videoEnded && !voteSubmitted && !loadingVote && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(212, 165, 116, 0.15)',
              borderRadius: '16px',
              padding: '32px',
              animation: 'fadeIn 0.4s ease-out',
            }}
          >
            <h2
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '28px',
                fontWeight: 300,
                letterSpacing: '0.15em',
                color: '#d4a574',
                textAlign: 'center',
                margin: '0 0 24px',
              }}
            >
              Rate This Pilot
            </h2>

            <form onSubmit={handleVoteSubmit}>
              {/* Star rating */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 400,
                    color: '#f5f0eb',
                    marginBottom: '12px',
                  }}
                >
                  Your Rating
                </label>
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
                    minHeight: '100px',
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
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(212, 165, 116, 0.4)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(212, 165, 116, 0.15)';
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
                    e.currentTarget.style.boxShadow =
                      '0 8px 20px rgba(212, 165, 116, 0.3)';
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
          </div>
        )}

        {/* Post-vote confirmation */}
        {voteSubmitted && pilotsRemaining === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 32px',
              background: 'rgba(212, 165, 116, 0.08)',
              border: '1px solid rgba(212, 165, 116, 0.2)',
              borderRadius: '16px',
            }}
          >
            <CheckCircle2
              size={56}
              style={{
                color: '#d4a574',
                marginBottom: '16px',
              }}
            />
            <h2
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '28px',
                fontWeight: 300,
                letterSpacing: '0.15em',
                color: '#d4a574',
                margin: '0 0 8px',
              }}
            >
              Thank you for your reviews.
            </h2>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: 'rgba(245, 240, 235, 0.7)',
                margin: '0 0 24px',
              }}
            >
              See you next season.
            </p>
            <button
              onClick={onContinueBrowsing}
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
                e.currentTarget.style.boxShadow =
                  '0 8px 20px rgba(212, 165, 116, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Return to Viewing Room
            </button>
          </div>
        )}

        {/* Post-vote with next pilot available */}
        {voteSubmitted && pilotsRemaining > 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 32px',
              background: 'rgba(212, 165, 116, 0.08)',
              border: '1px solid rgba(212, 165, 116, 0.2)',
              borderRadius: '16px',
            }}
          >
            <CheckCircle2
              size={56}
              style={{
                color: '#d4a574',
                marginBottom: '16px',
              }}
            />
            <h2
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '28px',
                fontWeight: 300,
                letterSpacing: '0.15em',
                color: '#d4a574',
                margin: '0 0 8px',
              }}
            >
              Rating Submitted
            </h2>
            {pilotStats && (
              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  color: 'rgba(245, 240, 235, 0.7)',
                  margin: '0 0 8px',
                }}
              >
                Average Rating: {pilotStats.avgRating?.toFixed(1) || '—'} / 5.0
              </p>
            )}
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 300,
                color: 'rgba(245, 240, 235, 0.6)',
                margin: '0 0 24px',
              }}
            >
              Your Rating: {rating} / 5
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={onContinueBrowsing}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: '1px solid rgba(212, 165, 116, 0.3)',
                  borderRadius: '8px',
                  color: '#d4a574',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(212, 165, 116, 0.1)';
                  e.currentTarget.style.borderColor =
                    'rgba(212, 165, 116, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor =
                    'rgba(212, 165, 116, 0.3)';
                }}
              >
                Back to Viewing Room
              </button>
              <button
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
                  e.currentTarget.style.boxShadow =
                    '0 8px 20px rgba(212, 165, 116, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Next Pilot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoPage;
