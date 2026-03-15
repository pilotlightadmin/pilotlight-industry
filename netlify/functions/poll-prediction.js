// Netlify Function: Simple single-prediction poller
// Takes a prediction ID → checks Replicate API → returns status + output URL
// Much simpler than visualization-status (which handles batches, Kling, etc.)

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Replicate API token' }) };
    }

    const { prediction_id } = JSON.parse(event.body);
    if (!prediction_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prediction_id' }) };
    }

    const resp = await fetch(`https://api.replicate.com/v1/predictions/${prediction_id}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
    });
    const data = await resp.json();

    if (data.status === 'succeeded') {
      let output = data.output;
      if (Array.isArray(output)) output = output[0];
      // Some models return output as an object with a url field
      if (output && typeof output === 'object' && output.url) output = output.url;
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ status: 'succeeded', output })
      };
    }

    if (data.status === 'failed' || data.status === 'canceled') {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ status: 'failed', error: data.error || 'Prediction failed' })
      };
    }

    // Still processing
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ status: 'processing' })
    };

  } catch (error) {
    console.error('poll-prediction error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
