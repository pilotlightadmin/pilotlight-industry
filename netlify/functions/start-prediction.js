// Netlify Function: Start image prediction on Replicate
// Routing:
//   1. image_url + hf_lora → FLUX Kontext Dev LoRA (Kontext edit with LoRA identity)
//   2. image_url only      → FLUX Kontext Dev (Kontext edit, face from input image)
//   3. neither             → FLUX Dev (pure text-to-image)
// Called by frontend one at a time with delays to avoid rate limits

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

    const { prompt, width, height, type, scene_num, name, description, seed,
            image_url, hf_lora, lora_scale, extra_lora, extra_lora_scale } = JSON.parse(event.body);

    if (!prompt) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prompt' }) };
    }

    const paramsByType = {
      scene:      { steps: 28, guidance: 3.5, go_fast: true },
      character:  { steps: 35, guidance: 4.0, go_fast: false },
      mood_board: { steps: 28, guidance: 3.0, go_fast: true }
    };
    const params = paramsByType[type] || paramsByType.scene;

    const w = width || 1024;
    const h = height || 768;
    const ratio = w / h;
    let aspect_ratio;
    if (ratio > 2.0) aspect_ratio = '21:9';
    else if (ratio > 1.7) aspect_ratio = '16:9';
    else if (ratio > 1.4) aspect_ratio = '3:2';
    else if (ratio > 1.2) aspect_ratio = '4:3';
    else if (ratio > 0.9) aspect_ratio = '1:1';
    else if (ratio > 0.7) aspect_ratio = '3:4';
    else if (ratio > 0.6) aspect_ratio = '2:3';
    else aspect_ratio = '9:16';

    const hasImage = !!image_url;
    const hasLora = !!hf_lora;
    let modelLabel, modelEndpoint, input;

    if (hasImage && hasLora) {
      // Kontext + LoRA: input image provides one face, LoRA provides another identity
      modelLabel = 'FLUX Kontext Dev LoRA';
      modelEndpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-dev-lora/predictions';
      input = {
        prompt,
        input_image: image_url,
        hf_lora: hf_lora,
        lora_scale: lora_scale || 0.85,
        aspect_ratio,
        num_inference_steps: params.steps,
        guidance: params.guidance,
        go_fast: params.go_fast,
        output_format: 'png',
        output_quality: 90,
        ...(seed != null ? { seed } : {}),
        ...(extra_lora ? { extra_lora, extra_lora_scale: extra_lora_scale || 0.85 } : {})
      };
      if (extra_lora) console.log(`  + extra_lora: ${extra_lora} (scale: ${extra_lora_scale || 0.85})`);

    } else if (hasImage) {
      // Kontext only: face from input image, no LoRA
      modelLabel = 'FLUX Kontext Dev';
      modelEndpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-dev/predictions';
      input = {
        prompt,
        input_image: image_url,
        aspect_ratio,
        num_inference_steps: params.steps,
        guidance: params.guidance,
        go_fast: params.go_fast,
        output_format: 'png',
        output_quality: 90,
        ...(seed != null ? { seed } : {})
      };

    } else if (hasLora) {
      // LoRA text-to-image: run against the trained model directly
      // The trained model (e.g. "pilotlightadmin/pilotlight-scene-xxx") is FLUX Dev + LoRA baked in
      modelLabel = `LoRA T2I (${hf_lora})`;
      modelEndpoint = `https://api.replicate.com/v1/models/${hf_lora}/predictions`;
      input = {
        prompt,
        aspect_ratio,
        num_inference_steps: params.steps,
        guidance: params.guidance,
        go_fast: params.go_fast,
        output_format: 'png',
        ...(seed != null ? { seed } : {})
      };

    } else {
      // Pure text-to-image (FLUX Dev) — no input image, no LoRA
      modelLabel = 'FLUX Dev';
      modelEndpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions';
      input = {
        prompt,
        aspect_ratio,
        num_inference_steps: params.steps,
        guidance: params.guidance,
        go_fast: params.go_fast,
        output_format: 'png',
        ...(seed != null ? { seed } : {})
      };
    }

    console.log(`Starting ${modelLabel}: ${type} ${name || scene_num || ''} (${aspect_ratio})${image_url ? ' (input_image)' : ''}${hf_lora ? ` (LoRA: ${hf_lora})` : ''}`);

    const resp = await fetch(modelEndpoint, {
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
        statusCode: 429, headers,
        body: JSON.stringify({ retry: true, retry_after: pred.retry_after || 12, message: 'Rate limited' })
      };
    }

    if (resp.status === 402 || /billing|payment|credits|quota|suspended/i.test(JSON.stringify(pred))) {
      console.error(`[BILLING] ${modelLabel} error: HTTP ${resp.status}`, JSON.stringify(pred).slice(0, 300));
    }

    if (!pred.id) {
      console.error('Prediction failed:', JSON.stringify(pred));
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to start prediction', details: pred.detail || 'Unknown error' }) };
    }

    console.log(`Started: ${pred.id} (${modelLabel} ${type} ${name || scene_num || ''})`);

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        id: pred.id, poll_url: pred.urls?.get,
        type, scene_num, name, description, status: pred.status
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
