// Netlify Function: Check status of Replicate SDXL predictions + Kling AI video tasks
// FAST — only checks prediction statuses and returns result URLs.
// S3 upload + Airtable save is handled by save-visualization.js separately.
//
// Routing logic:
//   pred.provider === 'kling' → polls api.klingai.com  (video)
//   otherwise                 → polls api.replicate.com (images + Wan video legacy)

const crypto = require('crypto');
// Node 18+ has native fetch — no need for node-fetch

// Generate a fresh Kling JWT for each status-check batch.
// Tokens are valid for 30 min so one per request is fine.
function generateKlingJWT(accessKey, secretKey) {
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: accessKey,
    exp: now + 1800,
    nbf: now - 5
  })).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', secretKey).update(signingInput).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    const KLING_ACCESS_KEY    = process.env.KLING_ACCESS_KEY;
    const KLING_SECRET_KEY    = process.env.KLING_SECRET_KEY;

    // REPLICATE_API_TOKEN is only needed for voiceover/merge tasks (Replicate TTS).
    // All image and video tasks now go through Kling. Log a warning but don't block.
    if (!REPLICATE_API_TOKEN) {
      console.warn('REPLICATE_API_TOKEN not set — voiceover/merge tasks will fail if attempted');
    }

    const { predictions, promptMap } = JSON.parse(event.body);

    if (!predictions || !Array.isArray(predictions)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing predictions array' }) };
    }

    // Generate a single Kling JWT for this batch (reused across all Kling checks)
    let klingJWT = null;
    const hasKlingPreds = predictions.some(p => p.provider === 'kling');
    if (hasKlingPreds) {
      if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
        console.error('Kling predictions present but KLING_ACCESS_KEY/KLING_SECRET_KEY not set');
      } else {
        klingJWT = generateKlingJWT(KLING_ACCESS_KEY, KLING_SECRET_KEY);
      }
    }

    // Check ALL prediction statuses in PARALLEL — fast
    // Routes to Kling (images or video) or Replicate (voiceover/merge) based on pred.provider
    const statusChecks = predictions.map(async (pred) => {
      try {
        // --- Kling AI task (image or video) ---
        if (pred.provider === 'kling') {
          if (!klingJWT) {
            return { pred, data: { status: 'processing' } };
          }

          // Route to correct Kling endpoint based on task type:
          //   video  → /v1/videos/image2video/{id}
          //   images → /v1/images/generations/{id}
          const isVideo = pred.type === 'video';
          const klingUrl = isVideo
            ? `https://api.klingai.com/v1/videos/image2video/${pred.id}`
            : `https://api.klingai.com/v1/images/generations/${pred.id}`;

          const resp = await fetch(klingUrl, {
            headers: { 'Authorization': `Bearer ${klingJWT}` }
          });
          const body = await resp.json();

          if (body.code !== 0) {
            console.error(`[Kling] Status check error for ${pred.id}:`, JSON.stringify(body));
            return { pred, data: { status: 'failed', error: body.message || 'Kling status error' } };
          }

          const taskStatus = body.data?.task_status;  // 'submitted' | 'processing' | 'succeed' | 'failed'
          if (taskStatus === 'succeed') {
            // Images return task_result.images[]; videos return task_result.videos[]
            const outputUrl = isVideo
              ? (body.data?.task_result?.videos?.[0]?.url || null)
              : (body.data?.task_result?.images?.[0]?.url || null);
            return { pred, data: { status: 'succeeded', output: outputUrl } };
          } else if (taskStatus === 'failed') {
            return { pred, data: { status: 'failed', error: body.data?.task_status_msg || 'Kling task failed' } };
          } else {
            return { pred, data: { status: 'processing' } };
          }
        }

        // --- Replicate prediction (images, legacy Wan video, voiceover, merge) ---
        const resp = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
          headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
        });
        const data = await resp.json();
        return { pred, data };
      } catch (err) {
        console.error(`Error checking prediction ${pred.id}:`, err.message);
        return { pred, data: { status: 'processing' } };
      }
    });

    const statusResults = await Promise.all(statusChecks);

    const results = [];
    let pending = 0;
    let failed = 0;
    const failedDetails = [];

    for (const { pred, data } of statusResults) {
      if (data.status === 'succeeded') {
        const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        results.push({
          type: pred.type,
          scene_num: pred.scene_num,
          name: pred.name,
          description: pred.description,
          url: imageUrl,
          status: 'completed'
        });
      } else if (data.status === 'failed' || data.status === 'canceled') {
        failed++;
        const errorMsg = data.error || 'Unknown error';
        console.error(`Prediction ${pred.id} (${pred.type}) failed:`, errorMsg);
        failedDetails.push({ type: pred.type, name: pred.name, error: errorMsg });
      } else {
        pending++;
      }
    }

    // Still in progress
    if (pending > 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'processing',
          completed: results.length,
          pending,
          failed,
          failedDetails,
          total: predictions.length,
          message: `Generating images... ${results.length}/${predictions.length} complete${failed > 0 ? ` (${failed} failed)` : ''}`
        })
      };
    }

    // All done — return Replicate URLs immediately (no S3 upload here)
    // Merge prompts from promptMap into results so frontend can re-roll/inpaint
    const pm = promptMap || {};

    const scene_images = results
      .filter(r => r.type === 'scene')
      .sort((a, b) => (a.scene_num || 0) - (b.scene_num || 0))
      .map(r => ({
        scene_num: r.scene_num,
        url: r.url,
        description: r.description,
        prompt: pm[`scene_${r.scene_num}`] || ''
      }));

    const character_concepts = results
      .filter(r => r.type === 'character')
      .map(r => ({
        name: r.name,
        url: r.url,
        prompt: pm[`character_${r.name}`] || ''
      }));

    const mood_board = results.find(r => r.type === 'mood_board');
    const mood_board_url = mood_board ? mood_board.url : null;

    const video_results = results
      .filter(r => r.type === 'video')
      .map(r => ({
        scene_num: r.scene_num,
        url: r.url
      }));

    const voiceover_results = results
      .filter(r => r.type === 'voiceover')
      .map(r => ({
        scene_num: r.scene_num,
        url: r.url
      }));

    const merged_video_results = results
      .filter(r => r.type === 'merged_video')
      .map(r => ({
        scene_num: r.scene_num,
        url: r.url
      }));

    // Background music result (single URL, from MusicGen)
    const music_result = results.find(r => r.type === 'music');
    const music_url = music_result ? music_result.url : null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'completed',
        scene_images,
        mood_board_url,
        mood_board_prompt: pm['mood_board'] || '',
        character_concepts,
        video_results,
        voiceover_results,
        merged_video_results,
        music_url,
        completed: results.length,
        failed,
        failedDetails,
        total: predictions.length
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
