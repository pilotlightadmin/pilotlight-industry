// Netlify Function: Merge voiceover audio onto video using lucataco/video-audio-merge on Replicate
// Takes video URL + audio URL, returns merged video URL
// Uses /v1/predictions with version hash (community model requires this)

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
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

    if (!REPLICATE_API_TOKEN) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Replicate API token' }) };
    }

    const { video_url, audio_url, scene_num } = JSON.parse(event.body);

    if (!video_url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing video_url' }) };
    }
    if (!audio_url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing audio_url' }) };
    }

    console.log(`Merging audio+video for scene ${scene_num || '?'}`);
    console.log(`Video: ${video_url}`);
    console.log(`Audio: ${audio_url}`);

    // Step 1: Get the latest version hash for this community model
    const versionResp = await fetch('https://api.replicate.com/v1/models/lucataco/video-audio-merge/versions', {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
    });
    const versionData = await versionResp.json();
    const latestVersion = versionData.results?.[0]?.id;

    if (!latestVersion) {
      console.error('Could not get model version:', JSON.stringify(versionData));
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Could not resolve model version' }) };
    }

    console.log(`Using version: ${latestVersion}`);

    // Step 2: Create prediction using /v1/predictions with explicit version
    const input = {
      video_file: video_url,
      audio_file: audio_url,
      replace_audio: true,
      output_format: 'mp4',
      video_codec: 'h264',
      audio_codec: 'aac'
    };

    const resp = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ version: latestVersion, input })
    });

    const pred = await resp.json();
    console.log('Merge API response status:', resp.status);

    if (resp.status === 429) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          retry: true,
          retry_after: pred.retry_after || 10,
          message: 'Rate limited, retry after delay'
        })
      };
    }

    // Inline billing check (billing-alert.js uses ESM which breaks esbuild CJS bundling)
    if (resp.status === 402 || /billing|payment|credits|quota|suspended/i.test(JSON.stringify(pred))) {
      console.error(`[BILLING] billing/quota error: HTTP ${resp.status}`, JSON.stringify(pred).slice(0, 300));
    }

    if (!pred.id) {
      console.error('Merge prediction failed:', JSON.stringify(pred));
      const errorDetail = pred.detail || pred.error || pred.message || JSON.stringify(pred);
      return { statusCode: 502, headers, body: JSON.stringify({ error: `Failed to start merge: ${errorDetail}` }) };
    }

    console.log(`Started merge: ${pred.id} (scene ${scene_num || '?'})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: pred.id,
        poll_url: pred.urls?.get,
        type: 'merged_video',
        scene_num,
        status: pred.status
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
