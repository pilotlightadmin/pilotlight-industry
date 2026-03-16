// StorageManager — Phase 2: All Airtable calls go through serverless functions
// No API keys in client code. Auth via session token in Authorization header.

const API_BASE = '/.netlify/functions';

// Helper to make API calls with optional auth
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('pilotLightSessionToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('API response not JSON:', text);
    throw new Error('Unexpected server response');
  }
};

const StorageManager = {
  // === AUTH ===
  checkEmail: async (email) => {
    try {
      return await apiFetch('api-auth-login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (e) {
      console.error('Check email error:', e);
      return { success: false, message: 'Failed to check email.' };
    }
  },

  validateMemberCode: async (email, memberCode) => {
    try {
      return await apiFetch('api-auth-login', {
        method: 'POST',
        body: JSON.stringify({ email, memberCode })
      });
    } catch (e) {
      console.error('Validate code error:', e);
      return { success: false, message: 'Failed to validate code.' };
    }
  },

  activateAccount: async (email, memberCode, newPassword) => {
    try {
      const data = await apiFetch('api-auth-login', {
        method: 'POST',
        body: JSON.stringify({ email, memberCode, newPassword })
      });
      if (data.success && data.token) {
        localStorage.setItem('pilotLightSessionToken', data.token);
        StorageManager.setCurrentVoter(data.voter);
      }
      return data;
    } catch (e) {
      console.error('Activate account error:', e);
      return { success: false, message: 'Failed to activate account.' };
    }
  },

  loginWithPassword: async (usernameOrEmail, password) => {
    try {
      const data = await apiFetch('api-auth-login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password })
      });
      if (data.success && data.token) {
        localStorage.setItem('pilotLightSessionToken', data.token);
        StorageManager.setCurrentVoter(data.voter);
      }
      return data;
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  },

  registerWithPassword: async (name, email, password, gender = '', location = '') => {
    try {
      const data = await apiFetch('api-auth-signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, gender, location })
      });
      if (data.success && data.token) {
        localStorage.setItem('pilotLightSessionToken', data.token);
        StorageManager.setCurrentVoter(data.voter);
      }
      return data;
    } catch (e) {
      console.error('Registration error:', e);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  },

  requestPasswordReset: async (email) => {
    try {
      return await apiFetch('api-forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (e) {
      console.error('Password reset request error:', e);
      return { success: false, message: 'Failed to process request. Please try again.' };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      return await apiFetch('api-reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      });
    } catch (e) {
      console.error('Password reset error:', e);
      return { success: false, message: 'Failed to reset password. Please try again.' };
    }
  },

  // Legacy login (email-only, no password) — now goes through signup flow
  registerOrLoginVoter: async (name, email) => {
    try {
      const data = await apiFetch('api-auth-signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: '' })
      });
      if (data.success && data.token) {
        localStorage.setItem('pilotLightSessionToken', data.token);
        StorageManager.setCurrentVoter(data.voter);
      }
      return { success: data.success, voter: data.voter, isNew: data.isNew };
    } catch (e) {
      console.error('Error with voter:', e);
      return { success: false, message: 'Voter registration failed' };
    }
  },

  // === SESSION MANAGEMENT (localStorage only) ===
  getCurrentUser: () => {
    try { return JSON.parse(localStorage.getItem('pilotLightCurrentUser') || 'null'); }
    catch (e) { return null; }
  },
  setCurrentUser: (user) => localStorage.setItem('pilotLightCurrentUser', JSON.stringify(user)),

  getCurrentVoter: () => {
    try { return JSON.parse(localStorage.getItem('pilotLightCurrentVoter') || 'null'); }
    catch (e) { return null; }
  },
  setCurrentVoter: (voter) => localStorage.setItem('pilotLightCurrentVoter', JSON.stringify(voter)),

  logout: () => {
    localStorage.removeItem('pilotLightCurrentUser');
    localStorage.removeItem('pilotLightSessionToken');
  },
  logoutVoter: () => {
    localStorage.removeItem('pilotLightCurrentVoter');
    localStorage.removeItem('pilotLightSessionToken');
  },

  // === PILOTS ===
  getPilots: async () => {
    try {
      const data = await apiFetch('api-get-pilots');
      return data.success ? data.pilots : [];
    } catch (e) { console.error('Error fetching pilots:', e); return []; }
  },

  getMyPilots: async (userId) => {
    try {
      const data = await apiFetch(`api-get-pilots?userId=${encodeURIComponent(userId)}`);
      return data.success ? data.pilots : [];
    } catch (e) { console.error('Error fetching my pilots:', e); return []; }
  },

  getPilotsForVoting: async () => {
    // api-get-pilots already filters hidden and formats with stats
    return StorageManager.getPilots();
  },

  savePilot: async (pilotData) => {
    try {
      return await apiFetch('api-save-pilot', {
        method: 'POST',
        body: JSON.stringify(pilotData)
      });
    } catch (e) {
      console.error('Error saving pilot:', e);
      return { success: false, message: e.message || 'Database error' };
    }
  },

  updatePilot: async (pilotId, updates) => {
    try {
      return await apiFetch('api-update-pilot', {
        method: 'POST',
        body: JSON.stringify({ pilotId, updates })
      });
    } catch (e) {
      console.error('Error updating pilot:', e);
      return { success: false };
    }
  },

  incrementFundingInterest: async (pilotId) => {
    try {
      return await apiFetch('api-update-pilot', {
        method: 'POST',
        body: JSON.stringify({ pilotId, action: 'incrementFunding' })
      });
    } catch (e) {
      console.error('Error incrementing funding interest:', e);
      return { success: false };
    }
  },

  deletePilot: async (pilotId) => {
    try {
      return await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'deletePilot', targetId: pilotId })
      });
    } catch (e) { console.error('Error deleting pilot:', e); return { success: false }; }
  },

  // === VOTES ===
  getVotes: async () => {
    try {
      const data = await apiFetch('api-get-votes');
      return data.success ? data.votes : [];
    } catch (e) { console.error('Error fetching votes:', e); return []; }
  },

  saveVote: async (voteData) => {
    try {
      const data = await apiFetch('api-submit-vote', {
        method: 'POST',
        body: JSON.stringify(voteData)
      });

      if (data.success) {
        // Cache locally to prevent duplicate votes during delay
        const localVotes = JSON.parse(localStorage.getItem('pilotLightRecentVotes') || '{}');
        const localKey = `${voteData.voterId}_${voteData.pilotId}`;
        localVotes[localKey] = data.vote;
        localStorage.setItem('pilotLightRecentVotes', JSON.stringify(localVotes));
      }

      return data;
    } catch (e) { console.error('Error saving vote:', e); return { success: false }; }
  },

  saveOrUpdateVote: async (voteData) => {
    // api-submit-vote handles save-or-update logic server-side
    // Ensures comment field is included in the payload if provided
    return StorageManager.saveVote(voteData);
  },

  updateVote: async (voteId, voteData) => {
    // Handled by api-submit-vote which checks for existing votes
    return StorageManager.saveVote(voteData);
  },

  getVoterVotedPilots: async (voterId) => {
    try {
      const data = await apiFetch(`api-get-votes?voterId=${encodeURIComponent(voterId)}`);
      if (!data.success) return [];
      return data.votes.map(v => Array.isArray(v.pilotId) ? v.pilotId[0] : v.pilotId);
    } catch (e) { console.error('Error fetching voted pilots:', e); return []; }
  },

  getVoterVotes: async (voterId) => {
    try {
      const data = await apiFetch(`api-get-votes?voterId=${encodeURIComponent(voterId)}`);
      if (!data.success) return [];
      return data.votes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) { console.error('Error fetching voter votes:', e); return []; }
  },

  getVoterVoteForPilot: async (voterId, pilotId) => {
    // Check local cache first
    const localVotes = JSON.parse(localStorage.getItem('pilotLightRecentVotes') || '{}');
    const localKey = `${voterId}_${pilotId}`;
    if (localVotes[localKey]) return localVotes[localKey];

    try {
      const data = await apiFetch(`api-get-votes?voterId=${encodeURIComponent(voterId)}&pilotId=${encodeURIComponent(pilotId)}`);
      if (!data.success || !data.votes.length) return null;
      const found = data.votes[0];
      localVotes[localKey] = found;
      localStorage.setItem('pilotLightRecentVotes', JSON.stringify(localVotes));
      return found;
    } catch (e) { console.error('Error fetching vote for pilot:', e); return null; }
  },

  deleteVote: async (voteId) => {
    try {
      return await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteVote', targetId: voteId })
      });
    } catch (e) { console.error('Error deleting vote:', e); return { success: false }; }
  },

  getCommentsForPilot: async (pilotId) => {
    try {
      const data = await apiFetch(`api-get-votes?pilotId=${encodeURIComponent(pilotId)}`);
      if (!data.success || !data.votes) return [];
      // Return only votes that have comments, as { comment, overallScore } objects
      return data.votes
        .filter(v => v.comment)
        .map(v => ({
          comment: v.comment,
          overallScore: v.overallScore
        }));
    } catch (e) {
      console.error('Error fetching comments for pilot:', e);
      return [];
    }
  },

  // === PILOT STATS ===
  getPilotStats: async (pilotId) => {
    try {
      const data = await apiFetch(`api-get-pilot-stats?pilotId=${encodeURIComponent(pilotId)}`);
      if (data.success) return data.stats;
      return { totalVotes: 0, avgOverall: 0, avgCuriosity: 0, avgSeries: 0, topPullFactorsIn: [], topPullFactorsBack: [] };
    } catch (e) {
      console.error('Error getting pilot stats:', e);
      return { totalVotes: 0, avgOverall: 0, avgCuriosity: 0, avgSeries: 0, topPullFactorsIn: [], topPullFactorsBack: [] };
    }
  },

  // === VOTERS / PROFILES ===
  getVoters: async () => {
    try {
      const data = await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'getVoters' })
      });
      return data.success ? data.voters : [];
    } catch (e) { console.error('Error fetching voters:', e); return []; }
  },

  updateCreatorProfile: async (voterId, profileData) => {
    try {
      const data = await apiFetch('api-update-profile', {
        method: 'POST',
        body: JSON.stringify(profileData)
      });
      if (data.success) {
        const currentVoter = StorageManager.getCurrentVoter();
        if (currentVoter && currentVoter.id === voterId) {
          const updatedVoter = { ...currentVoter, ...data.voter };
          StorageManager.setCurrentVoter(updatedVoter);
        }
      }
      return data;
    } catch (e) {
      console.error('Error updating creator profile:', e);
      return { success: false, message: 'Failed to update profile. Please try again.' };
    }
  },

  softDeleteAccount: async (voterId) => {
    try {
      const data = await apiFetch('api-delete-account', { method: 'POST' });
      if (data.success) {
        StorageManager.logoutVoter();
      }
      return data;
    } catch (e) {
      console.error('Error deleting account:', e);
      return { success: false, message: 'Failed to delete account. Please try again.' };
    }
  },

  deleteVoter: async (voterId) => {
    try {
      return await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteVoter', targetId: voterId })
      });
    } catch (e) { console.error('Error deleting voter:', e); return { success: false }; }
  },

  // === CREATOR APPLICATIONS ===
  submitCreatorApplication: async (voterId, applicationData) => {
    try {
      const data = await apiFetch('api-submit-creator-app', {
        method: 'POST',
        body: JSON.stringify({ applicationData })
      });
      if (data.success) {
        const currentVoter = StorageManager.getCurrentVoter();
        if (currentVoter && currentVoter.id === voterId) {
          const updatedVoter = { ...currentVoter, creatorStatus: 'pending', creatorApplication: JSON.stringify(applicationData), creatorType: applicationData.creatorType };
          StorageManager.setCurrentVoter(updatedVoter);
        }
      }
      return data;
    } catch (e) {
      console.error('Error submitting creator application:', e);
      return { success: false, message: 'Failed to submit application' };
    }
  },

  getCreatorApplications: async () => {
    try {
      const data = await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'getCreatorApps' })
      });
      return data.success ? data.applications : [];
    } catch (e) { console.error('Error fetching creator applications:', e); return []; }
  },

  getApprovedCreators: async () => {
    try {
      const data = await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'getApprovedCreators' })
      });
      return data.success ? data.creators : [];
    } catch (e) { console.error('Error fetching approved creators:', e); return []; }
  },

  approveCreatorApplication: async (voterId) => {
    try {
      return await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'approveCreator', targetId: voterId })
      });
    } catch (e) { console.error('Error approving application:', e); return { success: false }; }
  },

  rejectCreatorApplication: async (voterId) => {
    try {
      return await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'rejectCreator', targetId: voterId })
      });
    } catch (e) { console.error('Error rejecting application:', e); return { success: false }; }
  },

  revokeCreatorStatus: async (voterId) => {
    try {
      return await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'revokeCreator', targetId: voterId })
      });
    } catch (e) { console.error('Error revoking creator status:', e); return { success: false }; }
  },

  // === LEGACY CREATORS TABLE (kept for backward compat) ===
  getUsers: async () => {
    try {
      const data = await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'getVoters' })
      });
      return data.success ? data.voters : [];
    } catch (e) { console.error('Error fetching users:', e); return []; }
  },

  registerUser: async (username, email, name, password) => {
    return StorageManager.registerWithPassword(username, email, password);
  },

  loginUser: async (username, password) => {
    return StorageManager.loginWithPassword(username, password);
  },

  // === MESSAGING ===
  sendMessage: async ({ toCreatorUserId, pilotId, pilotTitle, messageText, senderName, fromUserId }) => {
    try {
      return await apiFetch('api-send-message', {
        method: 'POST',
        body: JSON.stringify({ toCreatorUserId, pilotId, pilotTitle, messageText, senderName, fromUserId })
      });
    } catch (e) {
      console.error('Error sending message:', e);
      return { success: false, message: 'Failed to send message' };
    }
  },

  getMessagesForCreator: async (creatorUserId) => {
    try {
      const data = await apiFetch(`api-get-messages?creatorUserId=${encodeURIComponent(creatorUserId)}`);
      return data.success ? data.messages : [];
    } catch (e) {
      console.error('Error fetching messages:', e);
      return [];
    }
  },

  markMessageRead: async (messageId) => {
    try {
      return await apiFetch('api-send-message', {
        method: 'POST',
        body: JSON.stringify({ action: 'markRead', messageId })
      });
    } catch (e) {
      console.error('Error marking message read:', e);
      return { success: false };
    }
  },

  // === LEGACY CREATORS TABLE (kept for backward compat) ===
  deleteCreator: async (creatorId) => {
    try {
      return await apiFetch('api-admin', {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteCreator', targetId: creatorId })
      });
    } catch (e) { console.error('Error deleting creator:', e); return { success: false }; }
  }
};

export default StorageManager;
