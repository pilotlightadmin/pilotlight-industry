// Netlify Function: Generate trailer by stitching scene clips via RunPod serverless
// Supports two modes:
//   1. Start job: POST { video_urls: [...], title: "..." } → returns { job_id, status }
//   2. Poll status: POST { job_id: "..." } → returns { status, trailer_url }

// Node 18+ has native fetch — no need for node-fetch

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
    const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
    const ENDPOINT_ID = process.env.RUNPOD_TRAILER_ENDPOINT_ID;

    if (!RUNPOD_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing RUNPOD_API_KEY' }) };
    }

    if (!ENDPOINT_ID) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing RUNPOD_TRAILER_ENDPOINT_ID — deploy the trailer handler to RunPod first' }) };
    }

    const body = JSON.parse(event.body);

    // --- Mode 2: Poll status ---
    if (body.job_id) {
      const statusResp = await fetch(`https://api.runpod.ai/v2/${ENDPOINT_ID}/status/${body.job_id}`, {
        headers: { 'Authorization': `Bearer ${RUNPOD_API_KEY}` }
      });
      const statusData = await statusResp.json();

      // RunPod statuses: IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED, CANCELLED, TIMED_OUT
      const status = statusData.status;
      const result = {
        status,
        job_id: body.job_id
      };

      if (status === 'COMPLETED' && statusData.output) {
        result.trailer_url = statusData.output.trailer_url;
        result.clip_count = statusData.output.clip_count;
      }

      if (status === 'FAILED') {
        result.error = statusData.output?.error || statusData.error || 'Trailer generation failed';
      }

      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    // --- Mode 1: Start job ---
    const { video_urls, title, music_url } = body;

    if (!video_urls || !Array.isArray(video_urls) || video_urls.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or empty video_urls array' }) };
    }

    console.log(`Starting trailer job: ${video_urls.length} clips, title="${title || 'trailer'}"${music_url ? ', with background music' : ''}`);

    const input = {
      video_urls,
      title: title || 'trailer',
      crossfade_duration: 0.5,
      s3_bucket: process.env.S3_BUCKET_NAME || 'pilot-light-visualizations',
      s3_key_prefix: 'trailers/'
    };

    // Optional: background music URL (from MusicGen)
    if (music_url) {
      input.music_url = music_url;
    }

    const runResp = await fetch(`https://api.runpod.ai/v2/${ENDPOINT_ID}/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });

    const runData = await runResp.json();

    // Inline billing check (billing-alert.js uses ESM which breaks esbuild CJS bundling)
    if (runResp.status === 402 || /billing|payment|credits|quota|suspended/i.test(JSON.stringify(runData))) {
      console.error(`[BILLING] billing/quota error: HTTP ${runResp.status}`, JSON.stringify(runData).slice(0, 300));
    }

    if (!runData.id) {
      console.error('RunPod run failed:', JSON.stringify(runData));
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to start trailer job', details: runData.error || 'Unknown error' }) };
    }

    console.log(`Trailer job started: ${runData.id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        job_id: runData.id,
        status: runData.status || 'IN_QUEUE'
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
