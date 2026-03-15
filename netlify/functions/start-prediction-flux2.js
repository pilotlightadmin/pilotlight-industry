// Netlify Function: Start image prediction on Replicate (FLUX.2 Pro)
// Multi-reference model — accepts up to 8 image URLs alongside a text prompt
// Used when creators upload look book images for scene generation

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

    const { prompt, aspect_ratio, image_urls, image_prompt_strength, type, scene_num, name, description, seed } = JSON.parse(event.body);

    if (!prompt) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prompt' }) };
    }

    // FLUX.2 Pro parameters
    const input = {
      prompt,
      aspect_ratio: aspect_ratio || '4:3',
      guidance: 4.0,
      output_format: 'png',
      output_quality: 90,
      prompt_upsampling: false,
      ...(seed != null ? { seed } : {})
    };

    // Add reference images (FLUX.2 Pro uses image_prompt_url, image_prompt_2, etc.)
    // and their strength values (0.0–1.0, higher = more faithful to reference)
    const urls = image_urls || [];
    const strength = image_prompt_strength || 0.1; // default low for style refs
    if (urls.length > 0) { input.image_prompt_url = urls[0]; input.image_prompt_strength = strength; }
    if (urls.length > 1) { input.image_prompt_2 = urls[1]; input.image_prompt_strength_2 = strength; }
    if (urls.length > 2) { input.image_prompt_3 = urls[2]; input.image_prompt_strength_3 = strength; }
    if (urls.length > 3) { input.image_prompt_4 = urls[3]; input.image_prompt_strength_4 = strength; }
    if (urls.length > 4) { input.image_prompt_5 = urls[4]; input.image_prompt_strength_5 = strength; }
    if (urls.length > 5) { input.image_prompt_6 = urls[5]; input.image_prompt_strength_6 = strength; }
    if (urls.length > 6) { input.image_prompt_7 = urls[6]; input.image_prompt_strength_7 = strength; }
    if (urls.length > 7) { input.image_prompt_8 = urls[7]; input.image_prompt_strength_8 = strength; }
    console.log(`Reference image strength: ${strength} for ${urls.length} image(s)`);

    console.log(`Starting FLUX 2 Pro prediction: ${type} ${name || scene_num || ''} (${aspect_ratio}) with ${urls.length} reference image(s)`);

    const resp = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions', {
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
          retry_after: pred.retry_after || 12,
          message: 'Rate limited, retry after delay'
        })
      };
    }

    // Log billing-related errors for manual review
    if (resp.status === 402 || /billing|payment|credits|quota|suspended/i.test(JSON.stringify(pred))) {
      console.error(`[BILLING] FLUX 2 Pro billing/quota error in start-prediction-flux2: HTTP ${resp.status}`, JSON.stringify(pred).slice(0, 300));
    }

    if (!pred.id) {
      console.error('Prediction failed:', JSON.stringify(pred));
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to start prediction', details: pred.detail || 'Unknown error' }) };
    }

    console.log(`Started: ${pred.id} (FLUX 2 Pro ${type} ${name || scene_num || ''})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: pred.id,
        poll_url: pred.urls?.get,
        type,
        scene_num,
        name,
        description,
        status: pred.status
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
