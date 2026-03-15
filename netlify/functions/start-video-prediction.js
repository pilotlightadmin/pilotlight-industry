// Netlify Function: Start a Kling v2.1 image-to-video prediction on Replicate
// Takes a completed scene image + motion prompt, animates the still into 5s video
//
// NOTE: This routes through Replicate (kwaivgi/kling-v2.1) which costs more than
// the direct Kling API. To switch to direct API, replace this file with the Kling
// JWT version and ensure your Kling API account has paid credits.

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

    const { image_url, motion_prompt, scene_num } = JSON.parse(event.body);

    if (!image_url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing image_url' }) };
    }

    if (!motion_prompt) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing motion_prompt' }) };
    }

    console.log(`Starting Kling v2.1 i2v for scene ${scene_num || '?'} (via Replicate)`);
    console.log(`Image: ${image_url}`);
    console.log(`Motion: ${motion_prompt}`);

    const input = {
      start_image: image_url,
      prompt: motion_prompt,
      duration: 5,
      aspect_ratio: '16:9',
      cfg_scale: 0.5,
      negative_prompt: 'blur, distort, low quality, static, frozen'
    };

    // Kling v2.1 image-to-video on Replicate
    const resp = await fetch('https://api.replicate.com/v1/models/kwaivgi/kling-v2.1/predictions', {
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
      console.error('Video prediction failed:', JSON.stringify(pred));
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to start video prediction', details: pred.detail || 'Unknown error' }) };
    }

    console.log(`Started video: ${pred.id} (scene ${scene_num || '?'})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: pred.id,
        poll_url: pred.urls?.get,
        type: 'video',
        scene_num,
        status: pred.status
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
