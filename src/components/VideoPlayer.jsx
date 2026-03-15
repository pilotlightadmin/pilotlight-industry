import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { Icon } from './Icons';

function VideoPlayer({ playbackId, videoUrl, style = {}, onEnded, showPlayAgain = false }) {
  console.log('VideoPlayer props:', { playbackId, videoUrl });
  const videoRef = useRef(null);
  const [hasEnded, setHasEnded] = useState(false);
  const defaultStyle = { width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', position: 'relative', ...style };

  // Initialize HLS.js for Mux streaming
  useEffect(() => {
    if (playbackId && videoRef.current) {
      const video = videoRef.current;
      const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari has native HLS support
        video.src = hlsUrl;
      } else if (window.Hls && Hls.isSupported()) {
        // Use HLS.js for other browsers
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
      }
    }
  }, [playbackId]);

  const handleVideoEnded = () => {
    setHasEnded(true);
    if (onEnded) onEnded();
  };

  const handlePlayAgain = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setHasEnded(false);
    }
  };

  // If we have a Mux playback ID, use HLS streaming
  if (playbackId) {
    return (
      <div style={defaultStyle}>
        <video
          ref={videoRef}
          controls
          style={{ width: '100%', height: '100%', background: '#000' }}
          poster={`https://image.mux.com/${playbackId}/thumbnail.png`}
          onEnded={handleVideoEnded}
        />
        {(hasEnded || showPlayAgain) && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={handlePlayAgain}
              style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
                border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', fontWeight: '700',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon component={Play} style={{ width: '24px', height: '24px' }} /> Play Again
            </button>
          </div>
        )}
      </div>
    );
  }

  // Legacy support: If we have a Vimeo URL, use Vimeo embed
  if (videoUrl) {
    const getVimeoId = (url) => { if (!url) return null; const match = url.match(/vimeo\.com\/(\d+)/); return match ? match[1] : null; };
    const vimeoId = getVimeoId(videoUrl);

    if (vimeoId) {
      return (
        <div style={defaultStyle}>
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Fallback for non-Vimeo URLs
    return (
      <div style={{ ...defaultStyle, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'none' }}>
          Watch Video →
        </a>
      </div>
    );
  }

  // No video available
  return (
    <div style={{ ...defaultStyle, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>No video available</p>
    </div>
  );
}

export default VideoPlayer;
