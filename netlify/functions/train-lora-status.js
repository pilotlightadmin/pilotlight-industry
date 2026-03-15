// Netlify Function: Check LoRA training status on Replicate
// Polls training progress and returns the trained model/LoRA weights when done

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

    const { poll_url, training_id } = JSON.parse(event.body);
    const url = poll_url || `https://api.replicate.com/v1/trainings/${training_id}`;

    if (!url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing poll_url or training_id' }) };
    }

    const resp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
    });

    const data = await resp.json();

    const result = {
      status: data.status,  // starting, processing, succeeded, failed, canceled
      training_id: data.id
    };

    if (data.status === 'succeeded') {
      // Extract the trained model identifier for use as hf_lora
      // Try multiple paths since Replicate's response structure varies
      let model = null;

      // Path 1: output.version exists + model owner/name
      if (data.model && data.model.owner && data.model.name) {
        model = `${data.model.owner}/${data.model.name}`;
      }

      // Path 2: destination field in the training object
      if (!model && data.destination) {
        model = data.destination;
      }

      // Path 3: parse from the full response JSON
      if (!model) {
        const fullJson = JSON.stringify(data);
        const destMatch = fullJson.match(/"destination"\s*:\s*"([^"]+)"/);
        if (destMatch) model = destMatch[1];
      }

      result.model = model;
      result.version = data.output?.version || null;
      result.weights_url = data.output?.weights || null;

      console.log(`[LORA] Training ${data.id} succeeded — model: ${result.model}, version: ${result.version}, weights: ${result.weights_url}`);
      // Log the full output for debugging
      console.log(`[LORA] Full output keys: ${JSON.stringify(Object.keys(data.output || {}))}`);
      console.log(`[LORA] data.model: ${JSON.stringify(data.model || 'none')}`);
      console.log(`[LORA] data.destination: ${data.destination || 'none'}`);
    } else if (data.status === 'failed') {
      result.error = data.error || 'Training failed';
      console.error(`[LORA] Training ${data.id} failed:`, result.error);
    } else {
      result.logs = (data.logs || '').split('\n').slice(-3).join('\n');
      console.log(`[LORA] Training ${data.id}: ${data.status}`);
    }

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (error) {
    console.error('[LORA] Status check error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
