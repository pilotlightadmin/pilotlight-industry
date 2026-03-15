// Netlify Function: Inpaint an image region using FLUX Fill Dev on Replicate
// Accepts source image URL + mask + prompt, starts a FLUX Fill prediction

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

    const {
      image_url,           // Replicate URL of original image
      mask_base64,         // data:image/png;base64,... — white=replace, black=keep
      prompt,              // What to generate in masked area
      guidance,            // Optional, default 7
      num_inference_steps, // Optional, default 28
      seed                 // Optional
    } = JSON.parse(event.body);

    if (!image_url || !mask_base64 || !prompt) {
      return { statusCode: 400, headers, body: JSON.stringify({
        error: 'Missing required fields: image_url, mask_base64, prompt'
      }) };
    }

    console.log(`Starting FLUX Fill inpaint: "${prompt.slice(0, 60)}..."`);

    const input = {
      image: image_url,
      mask: mask_base64,
      prompt,
      guidance: guidance || 7,
      num_inference_steps: num_inference_steps || 28,
      output_format: 'png',
      output_quality: 90,
      ...(seed != null ? { seed } : {})
    };

    const resp = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-fill-dev',
        input
      })
    });

    const pred = await resp.json();

    if (resp.status === 429) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          retry: true,
          retry_after: pred.retry_after || 12,
          message: 'Rate limited, retry after delay'
        })
      };
    }

    // Inline billing check (billing-alert.js uses ESM which breaks esbuild CJS bundling)
    if (resp.status === 402 || /billing|payment|credits|quota|suspended/i.test(JSON.stringify(pred))) {
      console.error(`[BILLING] billing/quota error: HTTP ${resp.status}`, JSON.stringify(pred).slice(0, 300));
    }

    if (!pred.id) {
      console.error('FLUX Fill prediction failed:', JSON.stringify(pred));
      return { statusCode: 502, headers, body: JSON.stringify({
        error: 'Failed to start inpaint prediction',
        details: pred.detail || 'Unknown error'
      }) };
    }

    console.log(`Started inpaint: ${pred.id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: pred.id,
        poll_url: pred.urls?.get,
        status: pred.status
      })
    };

  } catch (error) {
    console.error('Inpaint function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }) };
  }
};
