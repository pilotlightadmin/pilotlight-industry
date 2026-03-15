import React, { useState, useEffect } from 'react';
import { Users, Star, Eye, TrendingUp, Pencil, Trash2, Upload, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import StorageManager from '../services/StorageManager';
import { ResubmissionTag } from '../utils/badges';
import { generateLocationInsights } from '../analytics/locationInsights';
import USHeatMap from '../analytics/USHeatMap';
import TugOfWarChart from '../analytics/TugOfWarChart';
import { Icon } from '../components/Icons';
import { PULL_FACTORS } from '../utils/constants';

// Utility function to normalize voter location (handles array from Airtable lookup or string)
const normalizeVoterLocation = (loc) => {
  if (!loc) return '';
  if (Array.isArray(loc)) return loc[0] || '';
  return loc;
};

// Calculate analytics for a pilot
const calculatePilotAnalytics = async (pilotId) => {
  const allVotes = await StorageManager.getVotes();
  // Handle pilotId as linked field (array) or plain string
  const votes = allVotes.filter(v => {
    const pid = Array.isArray(v.pilotId) ? v.pilotId[0] : v.pilotId;
    return pid === pilotId;
  });
  if (votes.length === 0) {
    const emptyFactors = {};
    PULL_FACTORS.forEach(f => { emptyFactors[f] = 0; });
    return { totalVotes: 0, avgCuriosity: 0, avgSeries: 0, avgOverall: 0, pullFactorsIn: {...emptyFactors}, pullFactorsBack: {...emptyFactors}, votes: [] };
  }
  const pullFactorsIn = {};
  const pullFactorsBack = {};
  PULL_FACTORS.forEach(f => { pullFactorsIn[f] = 0; pullFactorsBack[f] = 0; });

  votes.forEach(vote => {
    (vote.pullFactorsIn || vote.pullFactors || []).forEach(factor => { if (pullFactorsIn[factor] !== undefined) pullFactorsIn[factor]++; });
    (vote.pullFactorsBack || []).forEach(factor => { if (pullFactorsBack[factor] !== undefined) pullFactorsBack[factor]++; });
  });

  return {
    totalVotes: votes.length,
    avgCuriosity: (votes.reduce((sum, v) => sum + (v.curiosityScore || 0), 0) / votes.length).toFixed(2),
    avgSeries: (votes.reduce((sum, v) => sum + (v.seriesScore || 0), 0) / votes.length).toFixed(2),
    avgOverall: (votes.reduce((sum, v) => sum + (v.overallScore || 0), 0) / votes.length).toFixed(2),
    pullFactorsIn,
    pullFactorsBack,
    votes // Include raw votes for heat map
  };
};

// Main PilotAnalytics component
function PilotAnalytics({ pilot, onBack, onRefresh }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPilot, setEditingPilot] = useState(null);
  const [editForm, setEditForm] = useState({ pilotTitle: '', logline: '', genre: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitForm, setResubmitForm] = useState({ pilotTitle: '', logline: '' });
  const [resubmitVideoFile, setResubmitVideoFile] = useState(null);
  const [resubmitUploadStatus, setResubmitUploadStatus] = useState('idle');
  const [resubmitUploadProgress, setResubmitUploadProgress] = useState(0);
  const [resubmitUploadError, setResubmitUploadError] = useState('');
  const [resubmitPlaybackId, setResubmitPlaybackId] = useState('');
  const [submittingResubmit, setSubmittingResubmit] = useState(false);
  const [currentPilot, setCurrentPilot] = useState(pilot);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const data = await calculatePilotAnalytics(pilot.id);
        setAnalytics(data);
      } catch (err) {
        console.error('Error loading analytics:', err);
      }
      setLoading(false);
    };
    loadAnalytics();
  }, [pilot.id]);

  const handleEdit = () => {
    setEditingPilot(currentPilot);
    setEditForm({ pilotTitle: currentPilot.pilotTitle, logline: currentPilot.logline, genre: currentPilot.genre });
  };

  const handleSaveEdit = async () => {
    if (!editingPilot) return;
    setSaving(true);
    try {
      await StorageManager.updatePilot(editingPilot.id, editForm);
      setCurrentPilot(prev => ({ ...prev, ...editForm }));
      setEditingPilot(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating pilot:', err);
      alert('Failed to update pilot. Please try again.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await StorageManager.deletePilot(currentPilot.id);
      if (onRefresh) onRefresh();
      onBack();
    } catch (err) {
      console.error('Error deleting pilot:', err);
      alert('Failed to delete pilot. Please try again.');
    }
  };

  // Resubmit handlers
  const handleResubmitVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        setResubmitUploadError('Video file must be under 500MB');
        return;
      }
      setResubmitVideoFile(file);
      setResubmitUploadError('');
    }
  };

  const handleResubmitVideoUpload = async () => {
    if (!resubmitVideoFile) return;
    setResubmitUploadStatus('uploading');
    setResubmitUploadProgress(0);
    setResubmitUploadError('');

    try {
      const response = await fetch('/.netlify/functions/mux-upload', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, uploadId } = await response.json();

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setResubmitUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => xhr.status === 200 ? resolve() : reject(new Error('Upload failed')));
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('PUT', uploadUrl);
        xhr.send(resubmitVideoFile);
      });

      setResubmitUploadStatus('processing');
      let playbackId = null;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(`/.netlify/functions/mux-status?uploadId=${uploadId}`);
        const statusData = await statusRes.json();
        if (statusData.status === 'asset_created' && statusData.playbackId) {
          playbackId = statusData.playbackId;
          break;
        } else if (statusData.status === 'errored') {
          throw new Error('Video processing failed');
        }
      }
      if (!playbackId) throw new Error('Video processing timed out');
      setResubmitPlaybackId(playbackId);
      setResubmitUploadStatus('ready');
    } catch (err) {
      console.error('Resubmit upload error:', err);
      setResubmitUploadError(err.message || 'Failed to upload video');
      setResubmitUploadStatus('idle');
    }
  };

  const openResubmitModal = () => {
    setResubmitForm({ pilotTitle: '', logline: '' });
    setResubmitVideoFile(null);
    setResubmitUploadStatus('idle');
    setResubmitUploadProgress(0);
    setResubmitUploadError('');
    setResubmitPlaybackId('');
    setShowResubmitModal(true);
  };

  const handleResubmitSubmit = async (e) => {
    e.preventDefault();
    if (resubmitUploadStatus !== 'ready') {
      setResubmitUploadError('Please upload a video first');
      return;
    }
    setSubmittingResubmit(true);
    try {
      // Use new values if provided, otherwise fall back to current pilot values
      const newPilotData = {
        pilotTitle: resubmitForm.pilotTitle.trim() || currentPilot.pilotTitle,
        logline: resubmitForm.logline.trim() || currentPilot.logline,
        genre: currentPilot.genre,
        playbackId: resubmitPlaybackId,
        creatorName: currentPilot.creatorName,
        creatorUserId: currentPilot.creatorUserId,
        episodeIdeas: currentPilot.episodeIdeas,
        previousVersionId: currentPilot.id,
        version: (currentPilot.version || 1) + 1
      };
      const result = await StorageManager.savePilot(newPilotData);
      if (!result.success) {
        throw new Error(result.message || 'Failed to save new pilot version');
      }
      // Hide the old pilot from the feed
      await StorageManager.updatePilot(currentPilot.id, { hidden: true, supersededBy: result.pilot.id });
      setShowResubmitModal(false);
      if (onRefresh) onRefresh();
      onBack();
    } catch (err) {
      console.error('Error submitting new version:', err);
      alert('Failed to submit new version. Please try again.');
    }
    setSubmittingResubmit(false);
  };

  if (loading || !analytics) {
    return (
      <div style={{ padding: 'clamp(1rem, 4vw, 2rem) clamp(1rem, 4vw, 3rem)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255,107,107,0.2)', borderTopColor: '#ff6b6b',
            borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'clamp(1rem, 4vw, 2rem) clamp(1rem, 4vw, 3rem)', minHeight: '100vh' }}>
      <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '10px', padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)', color: '#fff', cursor: 'pointer', marginBottom: 'clamp(1rem, 3vw, 2rem)', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>← Back to Portal</button>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: '800', margin: '0' }}>{pilot.pilotTitle}</h1>
            <ResubmissionTag version={pilot.version} variant="creator" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', marginBottom: '0.5rem' }}>Created by {pilot.creatorName}</p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', fontStyle: 'italic' }}>{pilot.logline}</p>
        </div>

        {/* Score Cards */}
        <div className="score-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'clamp(0.75rem, 2vw, 1.5rem)', marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }}>
          {[{ icon: Users, label: 'Total Votes', value: analytics.totalVotes, colors: ['rgba(212,165,116,0.2)', 'rgba(184,134,11,0.1)', 'rgba(212,165,116,0.3)', '#d4a574'] },
            { icon: Star, label: 'Overall Rating', value: `${analytics.avgOverall}/5`, colors: ['rgba(212,165,116,0.2)', 'rgba(184,134,11,0.1)', 'rgba(212,165,116,0.3)', '#d4a574'] },
            { icon: Eye, label: 'Curiosity Score', value: `${analytics.avgCuriosity}/5`, colors: ['rgba(225,112,85,0.2)', 'rgba(214,48,49,0.1)', 'rgba(225,112,85,0.3)', '#e17055'] },
            { icon: TrendingUp, label: 'Series Potential', value: `${analytics.avgSeries}/5`, colors: ['rgba(253,121,168,0.2)', 'rgba(232,67,147,0.1)', 'rgba(253,121,168,0.3)', '#fd79a8'] }]
            .map(({ icon, label, value, colors }) => (
            <div key={label} className="score-card" style={{ background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
              padding: 'clamp(1rem, 3vw, 2rem)', borderRadius: '20px', border: `2px solid ${colors[2]}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'clamp(0.5rem, 2vw, 1rem)' }}>
                <Icon component={icon} style={{ width: 'clamp(18px, 4vw, 24px)', height: 'clamp(18px, 4vw, 24px)', color: colors[3] }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.75rem, 2vw, 0.9rem)' }}>{label}</span>
              </div>
              <div style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)', fontWeight: '800', color: colors[3] }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Pull Factor Analysis + Vote Insights Row */}
        <div className="analytics-grid-2col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start', marginBottom: '2rem' }}>
          {/* Tug of War Chart */}
          <TugOfWarChart
            pullFactorsIn={analytics.pullFactorsIn}
            pullFactorsBack={analytics.pullFactorsBack}
            totalVotes={analytics.totalVotes}
          />

          {/* Right Column: Vote Insights + Gender Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Vote Insights - AI Driven */}
            {analytics.totalVotes > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,107,107,0.1) 0%, rgba(254,202,87,0.1) 100%)',
                borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,107,107,0.2)'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon component={Sparkles} style={{ width: '20px', height: '20px', color: '#feca57' }} /> Vote Insights
                </h3>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {(() => {
                    const insights = [];

                    // AI-style insight: Strongest pull factor
                    const strongestIn = Object.entries(analytics.pullFactorsIn).sort((a, b) => b[1] - a[1])[0];
                    if (strongestIn && strongestIn[1] > 0) {
                      const pct = Math.round((strongestIn[1] / analytics.totalVotes) * 100);
                      insights.push(
                        <div key="in" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ color: '#4ecdc4', fontWeight: '600' }}>✨ {strongestIn[0]}</span> is resonating strongly — {pct}% of voters cite it as a key draw.
                        </div>
                      );
                    }

                    // AI-style insight: Area to watch
                    const biggestConcern = Object.entries(analytics.pullFactorsBack).sort((a, b) => b[1] - a[1])[0];
                    if (biggestConcern && biggestConcern[1] > 0) {
                      const pct = Math.round((biggestConcern[1] / analytics.totalVotes) * 100);
                      insights.push(
                        <div key="back" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ color: '#ff6b6b', fontWeight: '600' }}>⚠️ {biggestConcern[0]}</span> may need refinement — {pct}% flagged it as a hesitation point.
                        </div>
                      );
                    }

                    // AI-style insight: Score analysis
                    const avgOverall = parseFloat(analytics.avgOverall);
                    const avgCuriosity = parseFloat(analytics.avgCuriosity);
                    const avgSeries = parseFloat(analytics.avgSeries);

                    if (avgOverall >= 4) {
                      insights.push(
                        <div key="overall" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ color: '#feca57', fontWeight: '600' }}>🔥 Strong reception</span> — your {avgOverall.toFixed(2)}/5 overall rating signals genuine audience enthusiasm.
                        </div>
                      );
                    } else if (avgCuriosity > avgSeries + 0.5) {
                      insights.push(
                        <div key="gap" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ color: '#feca57', fontWeight: '600' }}>💡 Curiosity gap</span> — viewers are intrigued ({avgCuriosity.toFixed(2)}/5) but less certain about series viability ({avgSeries.toFixed(2)}/5). Consider showcasing episodic potential.
                        </div>
                      );
                    } else if (avgSeries > avgCuriosity + 0.5) {
                      insights.push(
                        <div key="seriesgap" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ color: '#feca57', fontWeight: '600' }}>🎬 Series gap</span> — strong season-long concept ({avgSeries.toFixed(2)}/5) but viewers want a stronger pilot hook ({avgCuriosity.toFixed(2)}/5). Consider a more compelling opening.
                        </div>
                      );
                    } else if (avgSeries >= 4) {
                      insights.push(
                        <div key="series" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ color: '#feca57', fontWeight: '600' }}>📺 Series material</span> — voters see strong episodic potential ({avgSeries.toFixed(2)}/5).
                        </div>
                      );
                    }

                    // Net sentiment summary
                    const netPositive = PULL_FACTORS.filter(f => (analytics.pullFactorsIn[f] || 0) > (analytics.pullFactorsBack[f] || 0));
                    const netNegative = PULL_FACTORS.filter(f => (analytics.pullFactorsBack[f] || 0) > (analytics.pullFactorsIn[f] || 0));
                    if (netPositive.length >= 4) {
                      insights.push(
                        <div key="net" style={{ marginBottom: '0' }}>
                          <span style={{ color: '#4ecdc4', fontWeight: '600' }}>📊 Balanced appeal</span> — {netPositive.length} of 5 pull factors trending positive.
                        </div>
                      );
                    } else if (netNegative.length >= 3) {
                      insights.push(
                        <div key="net" style={{ marginBottom: '0' }}>
                          <span style={{ color: '#ff6b6b', fontWeight: '600' }}>📊 Room to grow</span> — focus on strengthening {netNegative.slice(0, 2).join(' and ')}.
                        </div>
                      );
                    }

                    return insights.length > 0 ? insights : (
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                        Gathering more votes to generate insights...
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Gender Breakdown */}
            <div style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1.25rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem', color: '#4ecdc4' }}>
                Gender Breakdown
              </h4>
              {(() => {
                const votesWithGender = (analytics.votes || []).filter(v => v.voterGender);
                if (votesWithGender.length < 2) {
                  return (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Gender data will appear as votes come in.
                    </p>
                  );
                }

                const byGender = {};
                votesWithGender.forEach(v => {
                  const gender = v.voterGender || 'Other';
                  byGender[gender] = (byGender[gender] || 0) + 1;
                });

                const genderOrder = ['Male', 'Female', 'Non-binary', 'Other'];
                const sortedGenders = genderOrder.filter(g => byGender[g] > 0);
                if (sortedGenders.length === 0) return null;

                const maxVotes = Math.max(...Object.values(byGender));
                const totalGenderVotes = votesWithGender.length;

                return (
                  <div>
                    {sortedGenders.map((gender) => (
                      <div key={gender} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'rgba(255,255,255,0.8)' }}>{gender}</span>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{byGender[gender]} ({Math.round((byGender[gender] / totalGenderVotes) * 100)}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${(byGender[gender] / maxVotes) * 100}%`,
                            background: gender === 'Male' ? 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)' :
                                       gender === 'Female' ? 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)' :
                                       gender === 'Non-binary' ? 'linear-gradient(90deg, #a855f7 0%, #9333ea 100%)' :
                                       'linear-gradient(90deg, #94a3b8 0%, #64748b 100%)',
                            borderRadius: '3px'
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(78,205,196,0.1) 0%, rgba(68,160,141,0.1) 100%)',
          borderRadius: '20px', padding: 'clamp(1rem, 4vw, 2rem)', marginTop: '2rem',
          border: '1px solid rgba(78,205,196,0.2)'
        }}>
          <div className="heat-map-header" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'
          }}>
            <h3 style={{
              fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '700', margin: 0,
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Geographic Distribution
            </h3>
            {/* Legend */}
            <div className="heat-map-legend" style={{
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#4ecdc4', borderRadius: '50%', flexShrink: 0 }}></div>
                <span>Few</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#4ecdc4', borderRadius: '50%', flexShrink: 0 }}></div>
                <span>Medium</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '16px', height: '16px', background: '#feca57', borderRadius: '50%', flexShrink: 0 }}></div>
                <span>Many</span>
              </div>
            </div>
          </div>

          {/* Heat Map */}
          <div className="heat-map-container" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', maxWidth: '100%' }}>
            <USHeatMap votes={analytics.votes || []} width={595} height={383} />
          </div>

          {/* Demographic Insights - Horizontal Layout */}
          <div className="geo-insights-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {/* Demographic Insights */}
            <div style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#4ecdc4' }}>
                Demographic Insights
              </h4>
              {(() => {
                const insights = generateLocationInsights(analytics.votes || []);
                if (insights.length === 0) {
                  return (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Collect more votes to unlock insights.
                    </p>
                  );
                }
                return (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {insights.slice(0, 4).map((insight, i) => (
                      <li key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                        marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)',
                        lineHeight: '1.4'
                      }}>
                        <span style={{ color: '#4ecdc4', flexShrink: 0 }}>•</span>
                        {insight.text}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            {/* Top Cities */}
            <div style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#4ecdc4' }}>
                Top Cities
              </h4>
              {(() => {
                const votesWithLocation = (analytics.votes || []).filter(v => {
                  const loc = normalizeVoterLocation(v.voterLocation);
                  return loc && loc !== 'Location unavailable';
                });
                if (votesWithLocation.length < 2) {
                  return (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Collect more votes to see top cities.
                    </p>
                  );
                }

                const byCity = {};
                votesWithLocation.forEach(v => {
                  const location = normalizeVoterLocation(v.voterLocation);
                  const parts = location.split(',').map(p => p.trim());
                  const city = parts[0];
                  const state = parts[1];
                  if (city && state) {
                    const key = `${city}, ${state}`;
                    byCity[key] = (byCity[key] || 0) + 1;
                  }
                });

                const topCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 4);
                if (topCities.length === 0) return null;

                const maxVotes = topCities[0][1];

                return (
                  <div>
                    {topCities.map(([city, count], i) => (
                      <div key={city} style={{ marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'rgba(255,255,255,0.8)' }}>{city}</span>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{count}</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${(count / maxVotes) * 100}%`,
                            background: 'linear-gradient(90deg, #4ecdc4 0%, #44a08d 100%)',
                            borderRadius: '3px'
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Edit, Resubmit & Delete Actions */}
        <div style={{ marginTop: 'clamp(1.5rem, 4vw, 3rem)', paddingTop: 'clamp(1rem, 3vw, 2rem)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 'clamp(0.5rem, 2vw, 1rem)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleEdit}
            style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1.5rem)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px', color: '#fff', fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon component={Pencil} style={{ width: 'clamp(14px, 3vw, 18px)', height: 'clamp(14px, 3vw, 18px)' }} /> Edit
          </button>
          <button onClick={openResubmitModal}
            style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1.5rem)', background: 'linear-gradient(135deg, rgba(78,205,196,0.2) 0%, rgba(69,183,209,0.2) 100%)',
              border: '1px solid rgba(78,205,196,0.4)', borderRadius: '10px', color: '#4ecdc4', fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon component={Upload} style={{ width: 'clamp(14px, 3vw, 18px)', height: 'clamp(14px, 3vw, 18px)' }} /> Resubmit
          </button>
          <button onClick={() => setDeleteConfirm(true)}
            style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1.5rem)', background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.4)',
              borderRadius: '10px', color: '#e74c3c', fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon component={Trash2} style={{ width: 'clamp(14px, 3vw, 18px)', height: 'clamp(14px, 3vw, 18px)' }} /> Delete
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPilot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setEditingPilot(null)}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '90%', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#feca57' }}>Edit Pilot</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Title</label>
              <input type="text" value={editForm.pilotTitle} onChange={(e) => setEditForm({ ...editForm, pilotTitle: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px', color: '#fff', fontSize: '1rem' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Logline</label>
              <textarea value={editForm.logline} onChange={(e) => setEditForm({ ...editForm, logline: e.target.value })}
                rows={3} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px', color: '#fff', fontSize: '1rem', resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Genre</label>
              <select value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px', color: '#fff', fontSize: '1rem' }}>
                <option value="Comedy">Comedy</option>
                <option value="Drama">Drama</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setEditingPilot(null)}
                style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving}
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #feca57 0%, #f39c12 100%)',
                  border: 'none', borderRadius: '10px', color: '#000', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setDeleteConfirm(false)}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '90%', border: '1px solid rgba(231,76,60,0.3)', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}>
            <Icon component={Trash2} style={{ width: '48px', height: '48px', color: '#e74c3c', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#fff' }}>Delete Pilot?</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
              Are you sure you want to delete "<strong>{currentPilot.pilotTitle}</strong>"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setDeleteConfirm(false)}
                style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete}
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  border: 'none', borderRadius: '10px', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resubmit Pilot Modal */}
      {showResubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 0' }}
          onClick={() => setShowResubmitModal(false)}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', padding: '2.5rem', maxWidth: '600px', width: '90%', border: '1px solid rgba(78,205,196,0.3)', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <Icon component={Upload} style={{ width: '48px', height: '48px', color: '#4ecdc4', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: '#fff' }}>Resubmit Pilot</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0, padding: '0 1rem' }}>
                Reposting this pilot will submit it as a new version. The old pilot will be hidden from the feed and voters will be notified that you have incorporated their feedback!
              </p>
            </div>

            <form onSubmit={handleResubmitSubmit}>
              {/* Title Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4ecdc4' }}>Title (If New)</label>
                <input
                  type="text"
                  value={resubmitForm.pilotTitle}
                  onChange={(e) => setResubmitForm({...resubmitForm, pilotTitle: e.target.value})}
                  placeholder={currentPilot.pilotTitle}
                  style={{ width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.4rem' }}>
                  Leave blank to keep: "{currentPilot.pilotTitle}"
                </p>
              </div>

              {/* Video Upload Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4ecdc4' }}>Upload New Video (MP4) *</label>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
                  {resubmitUploadStatus === 'ready' ? (
                    <div>
                      <div style={{ color: '#4ecdc4', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Icon component={CheckCircle2} style={{ width: '24px', height: '24px' }} /> Video Ready!
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>{resubmitVideoFile?.name}</p>
                      <button type="button" onClick={() => { setResubmitVideoFile(null); setResubmitPlaybackId(''); setResubmitUploadStatus('idle'); }}
                        style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>Choose Different Video</button>
                    </div>
                  ) : resubmitUploadStatus === 'uploading' || resubmitUploadStatus === 'processing' ? (
                    <div>
                      <div style={{ color: '#feca57', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                        {resubmitUploadStatus === 'uploading' ? `Uploading... ${resubmitUploadProgress}%` : 'Processing video...'}
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${resubmitUploadProgress}%`, height: '100%', background: 'linear-gradient(135deg, #4ecdc4 0%, #55e6c1 100%)',
                          borderRadius: '4px', transition: 'width 0.3s ease' }} />
                      </div>
                      {resubmitUploadStatus === 'processing' && (
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                          Optimizing your video for streaming...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {resubmitVideoFile ? (
                        <div>
                          <p style={{ color: '#fff', marginBottom: '0.75rem' }}>Selected: <strong>{resubmitVideoFile.name}</strong></p>
                          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                            Size: {(resubmitVideoFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                          <button type="button" onClick={handleResubmitVideoUpload}
                            style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #4ecdc4 0%, #55e6c1 100%)',
                              border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
                              marginRight: '0.75rem' }}>Upload Video</button>
                          <button type="button" onClick={() => setResubmitVideoFile(null)}
                            style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '0.95rem' }}>Cancel</button>
                        </div>
                      ) : (
                        <div>
                          <Icon component={Upload} style={{ width: '36px', height: '36px', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }} />
                          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>Upload your updated pilot video</p>
                          <input type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/*" onChange={handleResubmitVideoSelect}
                            style={{ display: 'none' }} id="resubmit-video-upload" />
                          <label htmlFor="resubmit-video-upload"
                            style={{ display: 'inline-block', padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)',
                              borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
                            Select Video File
                          </label>
                        </div>
                      )}
                      {resubmitUploadError && (
                        <p style={{ color: '#e74c3c', marginTop: '0.75rem', fontSize: '0.85rem' }}>{resubmitUploadError}</p>
                      )}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.4rem' }}>MP4 format, max 500MB</p>
              </div>

              {/* Logline Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4ecdc4' }}>Log Line (If New)</label>
                <textarea
                  rows={3}
                  value={resubmitForm.logline}
                  onChange={(e) => setResubmitForm({...resubmitForm, logline: e.target.value})}
                  placeholder={currentPilot.logline}
                  style={{ width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.4rem' }}>
                  Leave blank to keep current logline
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowResubmitModal(false)}
                  style={{ flex: 1, padding: '0.875rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingResubmit || resubmitUploadStatus !== 'ready'}
                  style={{ flex: 1, padding: '0.875rem',
                    background: resubmitUploadStatus === 'ready' ? 'linear-gradient(135deg, #4ecdc4 0%, #55e6c1 100%)' : 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: '10px', color: resubmitUploadStatus === 'ready' ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: '1rem', fontWeight: '600', cursor: resubmitUploadStatus === 'ready' ? 'pointer' : 'not-allowed' }}>
                  {submittingResubmit ? 'Submitting...' : 'Submit New Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PilotAnalytics;
