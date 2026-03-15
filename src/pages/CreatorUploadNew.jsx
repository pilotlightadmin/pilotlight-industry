import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import StorageManager from '../services/StorageManager';
import MuxUploader from '../services/MuxUploader';
import { Icon } from '../components/Icons';

function CreatorUploadNew({ currentUser, onHome, onBack, onSubmit }) {
  const [formData, setFormData] = useState({ pilotTitle: '', logline: '', genre: '', playbackId: '', fundingUrl: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleVideoUpload = async (file) => {
    setVideoFile(file);
    setUploadStatus('uploading');
    setError('');
    try {
      const { uploadUrl, uploadId } = await MuxUploader.getUploadUrl();
      await MuxUploader.uploadVideo(file, uploadUrl, setUploadProgress);
      setUploadStatus('processing');
      const { playbackId } = await MuxUploader.waitForPlaybackId(uploadId);
      setFormData(prev => ({ ...prev, playbackId }));
      setUploadStatus('ready');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Video upload failed. Please try again.');
      setUploadStatus('idle');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.playbackId) { setError('Please upload a video first'); return; }
    setSubmitting(true);
    setError('');
    try {
      const pilotData = {
        pilotTitle: formData.pilotTitle,
        logline: formData.logline,
        genre: formData.genre,
        playbackId: formData.playbackId,
        creatorUserId: currentUser.id,
        creatorName: currentUser.displayName || currentUser.username || currentUser.name,
        ...(formData.fundingUrl.trim() ? { fundingUrl: formData.fundingUrl.trim() } : {})
      };
      console.log('Submitting pilot:', pilotData);
      const result = await StorageManager.savePilot(pilotData);
      console.log('Save result:', result);
      if (result && result.success) {
        onSubmit();
      } else {
        setError('Failed to submit pilot: ' + (result?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Pilot submission error:', err);
      setError('Failed to submit pilot: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 3rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={onHome}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '0.75rem 1.25rem', color: '#fff', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </button>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px', padding: '0.75rem 1.25rem', color: '#fff', cursor: 'pointer' }}>
          ← Back to My Pilots
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', textAlign: 'center',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Pitch Your Pilot
        </h1>

        {error && <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)',
          borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', color: '#ff6b6b' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Video upload */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem' }}>Video</label>
            {uploadStatus === 'idle' && (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem',
                background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', cursor: 'pointer' }}>
                <Icon component={Upload} style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Click to upload video</span>
                <input type="file" accept="video/*" hidden onChange={(e) => e.target.files[0] && handleVideoUpload(e.target.files[0])} />
              </label>
            )}
            {uploadStatus === 'uploading' && (
              <div style={{ padding: '1.5rem', background: 'rgba(78,205,196,0.1)', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ marginBottom: '0.5rem' }}>Uploading... {uploadProgress}%</p>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #4ecdc4, #44a08d)', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            {uploadStatus === 'processing' && (
              <div style={{ padding: '1.5rem', background: 'rgba(254,202,87,0.1)', borderRadius: '12px', textAlign: 'center' }}>
                <Icon component={Loader2} style={{ width: '24px', height: '24px', color: '#feca57', animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '0.5rem', color: '#feca57' }}>Processing video...</p>
              </div>
            )}
            {uploadStatus === 'ready' && (
              <div style={{ padding: '1.5rem', background: 'rgba(78,205,196,0.1)', borderRadius: '12px', textAlign: 'center' }}>
                <Icon component={CheckCircle2} style={{ width: '24px', height: '24px', color: '#4ecdc4' }} />
                <p style={{ marginTop: '0.5rem', color: '#4ecdc4' }}>Video ready!</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Title</label>
            <input type="text" required value={formData.pilotTitle} onChange={(e) => setFormData({ ...formData, pilotTitle: e.target.value })}
              style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' }} />
          </div>

          {/* Logline */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Logline</label>
            <textarea required rows={3} value={formData.logline} onChange={(e) => setFormData({ ...formData, logline: e.target.value })}
              style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {/* Genre */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Genre</label>
            <select required value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' }}>
              <option value="">Select genre</option>
              <option value="Comedy">Comedy</option>
              <option value="Drama">Drama</option>
              <option value="Reality TV">Reality TV</option>
              <option value="Stand Up">Stand Up</option>
            </select>
          </div>

          {/* Funding URL (optional) */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              Crowdfunding Link <span style={{ fontWeight: '400', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>(optional)</span>
            </label>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', marginTop: 0 }}>
              Have a GoFundMe, Kickstarter, or Indiegogo? Add the link and voters can support your project directly.
            </p>
            <input type="url" value={formData.fundingUrl} onChange={(e) => setFormData({ ...formData, fundingUrl: e.target.value })}
              placeholder="https://gofundme.com/your-project"
              style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' }} />
          </div>

          <button type="submit" disabled={submitting || uploadStatus !== 'ready'}
            style={{ width: '100%', padding: '1rem', background: (submitting || uploadStatus !== 'ready') ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
              border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem', fontWeight: '700',
              cursor: (submitting || uploadStatus !== 'ready') ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Submitting...' : 'Submit Pilot'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatorUploadNew;
