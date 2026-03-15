// Helper functions — Phase 2: NDA calls go through serverless functions

const API_BASE = '/.netlify/functions';

function hasAcceptedNDA(userId, pilotId) {
  const key = `pl_nda_${pilotId}`;
  const acceptedUsers = JSON.parse(localStorage.getItem(key) || '[]');
  return acceptedUsers.includes(userId);
}

// Helper function to save NDA acceptance (per-pilot — localStorage + server-side logging)
async function saveNdaAcceptance(userId, pilotId, userInfo) {
  const key = `pl_nda_${pilotId}`;
  const acceptedUsers = JSON.parse(localStorage.getItem(key) || '[]');
  if (!acceptedUsers.includes(userId)) {
    acceptedUsers.push(userId);
    localStorage.setItem(key, JSON.stringify(acceptedUsers));

    // Call serverless function to update voter NDA status and log on pilot
    try {
      const token = localStorage.getItem('pilotLightSessionToken');
      await fetch(`${API_BASE}/api-sign-nda`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pilotId,
          displayName: userInfo?.displayName || userInfo?.username || userInfo?.name || '',
          email: userInfo?.email || ''
        })
      });
    } catch (e) {
      console.error('Error saving NDA acceptance:', e);
    }
  }
}

// Global NDA — site-wide, accepted once at signup
function hasAcceptedGlobalNDA(userId) {
  const acceptedUsers = JSON.parse(localStorage.getItem('pl_nda_global') || '[]');
  return acceptedUsers.includes(userId);
}

async function saveGlobalNdaAcceptance(userId, userInfo) {
  const acceptedUsers = JSON.parse(localStorage.getItem('pl_nda_global') || '[]');
  if (!acceptedUsers.includes(userId)) {
    acceptedUsers.push(userId);
    localStorage.setItem('pl_nda_global', JSON.stringify(acceptedUsers));

    try {
      const token = localStorage.getItem('pilotLightSessionToken');
      await fetch(`${API_BASE}/api-sign-nda`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pilotId: 'global',
          displayName: userInfo?.displayName || userInfo?.username || userInfo?.name || '',
          email: userInfo?.email || ''
        })
      });
    } catch (e) {
      console.error('Error saving global NDA acceptance:', e);
    }
  }
}

export { hasAcceptedNDA, saveNdaAcceptance, hasAcceptedGlobalNDA, saveGlobalNdaAcceptance };
