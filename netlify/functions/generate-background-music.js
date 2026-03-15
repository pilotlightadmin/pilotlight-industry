// Netlify Function: Generate background music for trailers using MusicGen on Replicate
// Takes a text prompt describing the desired music style + duration in seconds
// Returns a prediction ID for async polling via visualization-status.js

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

    const { prompt, duration } = JSON.parse(event.body);

    if (!prompt) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing music prompt' }) };
    }

    // Clamp duration between 5 and 30 seconds (MusicGen limit)
    const musicDuration = Math.min(30, Math.max(5, duration || 20));

    console.log(`Generating background music: "${prompt}" (${musicDuration}s)`);

    const input = {
      prompt,
      duration: musicDuration,
      output_format: 'wav',
      normalization_strategy: 'loudness'
    };

    // MusicGen on Replicate — Meta's open-source music generation model
    // Model path is meta/musicgen (not facebook/musicgen)
    const resp = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });

    const pred = await resp.json();

    if (resp.status === 429) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          retry: true,
          retry_after: pred.retry_after || 15,
          message: 'Rate limited, retry after delay'
        })
      };
    }

    // Inline billing check (billing-alert.js uses ESM which breaks esbuild CJS bundling)
    if (resp.status === 402 || /billing|payment|credits|quota|suspended/i.test(JSON.stringify(pred))) {
      console.error(`[BILLING] billing/quota error: HTTP ${resp.status}`, JSON.stringify(pred).slice(0, 300));
    }

    if (!pred.id) {
      console.error('MusicGen prediction failed:', JSON.stringify(pred));
      const errorDetail = pred.detail || pred.error || pred.message || JSON.stringify(pred);
      return { statusCode: 502, headers, body: JSON.stringify({ error: `Failed to start music generation: ${errorDetail}` }) };
    }

    console.log(`Started MusicGen: ${pred.id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: pred.id,
        poll_url: pred.urls?.get,
        type: 'music',
        status: pred.status
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
