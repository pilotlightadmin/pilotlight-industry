import React from 'react';

// Helper function to get resubmission tag color based on version
// Version 2 = lightest, Version 10+ = black
const getResubmissionTagStyle = (version) => {
  if (!version || version <= 1) return null; // No tag for original pilots
  const step = Math.min(version - 1, 9); // Steps 1-9 (versions 2-10)
  // Gradient from light teal (#a8e6cf) to black (#000000) over 9 steps
  const r = Math.round(168 - (step * 168 / 9));
  const g = Math.round(230 - (step * 230 / 9));
  const b = Math.round(207 - (step * 207 / 9));
  const textColor = step >= 5 ? '#fff' : '#1a1a2e'; // White text for darker backgrounds
  return {
    background: `rgb(${r}, ${g}, ${b})`,
    color: textColor,
    version: version
  };
};

// Resubmission Tag Component
// variant="creator" shows "Version X Resubmission" text
// variant="voter" (default) shows just the colored indicator
const ResubmissionTag = ({ version, style = {}, variant = 'voter' }) => {
  const tagStyle = getResubmissionTagStyle(version);
  if (!tagStyle) return null;

  if (variant === 'creator') {
    return React.createElement('div', {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '700',
        background: tagStyle.background,
        color: tagStyle.color,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        ...style
      }
    }, `Version ${version} Resubmission`);
  }

  // Voter variant - colored badge with "Resubmission!" text
  return React.createElement('div', {
    title: `Version ${version}`,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.5rem',
      borderRadius: '10px',
      fontSize: '0.65rem',
      fontWeight: '700',
      background: tagStyle.background,
      color: tagStyle.color,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      ...style
    }
  }, 'Resubmission!');
};

// === BADGE SYSTEM ===
const getPilotBadges = (pilot, allPilots) => {
  const badges = [];
  if (!pilot) return badges;
  // 1st Pilot: creator's first and only pilot
  if (allPilots && pilot.creatorUserId) {
    const creatorPilots = allPilots.filter(p => p.creatorUserId === pilot.creatorUserId);
    if (creatorPilots.length === 1) {
      badges.push({ key: 'first-pilot', label: '1st Pilot', icon: '🚀', color: '#00cec9', bg: 'rgba(0,206,201,0.15)', border: 'rgba(0,206,201,0.3)' });
    }
  }
  if (!pilot.stats) return badges;
  const s = pilot.stats;
  // Rising Star: 5+ votes and avg ≥ 4.0
  if (s.totalVotes >= 5 && s.avgOverall >= 4.0) {
    badges.push({ key: 'rising-star', label: 'Rising Star', icon: '⭐', color: '#feca57', bg: 'rgba(254,202,87,0.15)', border: 'rgba(254,202,87,0.3)' });
  }
  // Character Driven: top pull-in factor is Characters
  if (s.topPullFactorsIn && s.topPullFactorsIn[0] === 'Characters') {
    badges.push({ key: 'character-driven', label: 'Character Driven', icon: '🎭', color: '#fd79a8', bg: 'rgba(253,121,168,0.15)', border: 'rgba(253,121,168,0.3)' });
  }
  // Funny Bone: top pull-in factor is Humor/Entertainment
  if (s.topPullFactorsIn && s.topPullFactorsIn[0] === 'Humor/Entertainment') {
    badges.push({ key: 'funny-bone', label: 'Funny Bone', icon: '😂', color: '#fdcb6e', bg: 'rgba(253,203,110,0.15)', border: 'rgba(253,203,110,0.3)' });
  }
  return badges;
};

const getCreatorBadges = (creatorUserId, allPilots) => {
  const badges = [];
  if (!creatorUserId || !allPilots) return badges;
  const creatorPilots = allPilots.filter(p => p.creatorUserId === creatorUserId);
  // 1st Pilot: creator has exactly 1 pilot
  if (creatorPilots.length === 1) {
    badges.push({ key: 'first-pilot', label: '1st Pilot', icon: '🚀', color: '#00cec9', bg: 'rgba(0,206,201,0.15)', border: 'rgba(0,206,201,0.3)', desc: 'Just launched their first pilot on Pilot Light' });
  }
  // Multi-Pilot: 2+ pilots uploaded
  if (creatorPilots.length >= 2) {
    badges.push({ key: 'multi-pilot', label: 'Multi-Pilot', icon: '🎬', color: '#4ecdc4', bg: 'rgba(78,205,196,0.15)', border: 'rgba(78,205,196,0.3)', desc: 'Uploaded 2 or more pilots to Pilot Light' });
  }
  // Genre Explorer: pilots in 2+ genres
  const genres = new Set(creatorPilots.map(p => p.genre).filter(Boolean));
  if (genres.size >= 2) {
    badges.push({ key: 'genre-explorer', label: 'Genre Explorer', icon: '🌈', color: '#a29bfe', bg: 'rgba(162,155,254,0.15)', border: 'rgba(162,155,254,0.3)', desc: 'Creates across multiple genres' });
  }
  return badges;
};

// All possible pilot badges with earned/unearned status (for creator portal)
const ALL_PILOT_BADGES = [
  { key: 'rising-star', label: 'Rising Star', icon: '⭐', color: '#feca57', bg: 'rgba(254,202,87,0.15)', border: 'rgba(254,202,87,0.3)',
    desc: 'Earn 5+ votes with an average rating of 4.0 or higher' },
  { key: 'character-driven', label: 'Character Driven', icon: '🎭', color: '#fd79a8', bg: 'rgba(253,121,168,0.15)', border: 'rgba(253,121,168,0.3)',
    desc: 'Voters say your characters are the #1 draw' },
  { key: 'funny-bone', label: 'Funny Bone', icon: '😂', color: '#fdcb6e', bg: 'rgba(253,203,110,0.15)', border: 'rgba(253,203,110,0.3)',
    desc: 'Voters say humor is the #1 draw' },
];

const ALL_CREATOR_BADGES = [
  { key: 'first-pilot', label: '1st Pilot', icon: '🚀', color: '#00cec9', bg: 'rgba(0,206,201,0.15)', border: 'rgba(0,206,201,0.3)',
    desc: 'Launch your first pilot on Pilot Light' },
  { key: 'multi-pilot', label: 'Multi-Pilot', icon: '🎬', color: '#4ecdc4', bg: 'rgba(78,205,196,0.15)', border: 'rgba(78,205,196,0.3)',
    desc: 'Upload 2 or more pilots to Pilot Light' },
  { key: 'genre-explorer', label: 'Genre Explorer', icon: '🌈', color: '#a29bfe', bg: 'rgba(162,155,254,0.15)', border: 'rgba(162,155,254,0.3)',
    desc: 'Create pilots across multiple genres' },
];

// Get pilot badge status for creator portal (works with raw Airtable data)
const getPilotBadgeStatus = (pilot) => {
  const votes = parseInt(pilot.voteCount || pilot.stats?.totalVotes) || 0;
  const avg = parseFloat(pilot.avgOverall || pilot.stats?.avgOverall) || 0;
  // topPullFactorsIn not available on raw data, so only check if stats exist
  const topPull = pilot.stats?.topPullFactorsIn?.[0] || null;

  const earnedKeys = new Set();
  if (votes >= 5 && avg >= 4.0) earnedKeys.add('rising-star');
  if (topPull === 'Characters') earnedKeys.add('character-driven');
  if (topPull === 'Humor/Entertainment') earnedKeys.add('funny-bone');

  return ALL_PILOT_BADGES.map(b => ({
    ...b,
    earned: earnedKeys.has(b.key),
    progress: b.key === 'rising-star' ? `${votes}/5 votes${votes >= 5 ? ', avg ' + avg.toFixed(1) : ''}` : null
  }));
};

const getCreatorBadgeStatus = (myPilots) => {
  const pilotCount = myPilots.length;
  const genres = new Set(myPilots.map(p => p.genre).filter(Boolean));

  const earnedKeys = new Set();
  if (pilotCount >= 1) earnedKeys.add('first-pilot');
  if (pilotCount >= 2) earnedKeys.add('multi-pilot');
  if (genres.size >= 2) earnedKeys.add('genre-explorer');

  return ALL_CREATOR_BADGES.map(b => ({
    ...b,
    earned: earnedKeys.has(b.key),
    progress: b.key === 'first-pilot' ? `${pilotCount}/1 pilots` : b.key === 'multi-pilot' ? `${pilotCount}/2 pilots` : `${genres.size}/2 genres`
  }));
};

// Pilot badge — styled distinctly from genre tags (gradient border, slightly larger)
const PilotBadgeTag = ({ badge }) => (
  React.createElement('span', {
    title: badge.label,
    style: {
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.6rem', fontWeight: '700',
      background: badge.bg, color: badge.color,
      border: `1.5px solid ${badge.color}`,
      whiteSpace: 'nowrap', letterSpacing: '0.03em',
      boxShadow: `0 0 6px ${badge.bg}`
    }
  }, badge.icon, ' ', badge.label)
);

// Creator badge on pilot cards — compact icon-only with tooltip
const CreatorBadgeIcon = ({ badge }) => (
  React.createElement('span', {
    title: badge.label,
    style: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', cursor: 'default', lineHeight: 1
    }
  }, badge.icon)
);

export {
  getResubmissionTagStyle,
  ResubmissionTag,
  getPilotBadges,
  getCreatorBadges,
  ALL_PILOT_BADGES,
  ALL_CREATOR_BADGES,
  getPilotBadgeStatus,
  getCreatorBadgeStatus,
  PilotBadgeTag,
  CreatorBadgeIcon
};
