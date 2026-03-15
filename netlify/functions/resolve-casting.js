// Netlify Function: Resolve actor casting references into physical feature descriptions
// Uses Llama 3 to translate actor names → visual features for image generation

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

    const { castings } = JSON.parse(event.body);

    if (!castings || !Array.isArray(castings) || castings.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or empty castings array' }) };
    }

    // Build the actor list for the prompt
    const actorLines = castings
      .filter(c => c.actor && c.actor.trim())
      .map(c => `- "${c.character}" → cast as ${c.actor.trim()}`);

    if (actorLines.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, features: {} }) };
    }

    const systemPrompt = `You are a casting director's visual reference assistant. For each actor listed, describe ONLY their real-life physical appearance as concrete visual features suitable for an AI image generator.

CRITICAL: Accuracy of skin tone and ethnic features is essential. Think carefully about each actor's ACTUAL appearance — their real ethnicity, real skin color, real hair. Do not guess or default to generic features. For example:
- Ruth Negga is Ethiopian-Irish with deep brown skin and dark curly hair
- Idris Elba is Black British with dark brown skin
- Dev Patel is Indian-British with brown skin
- Oscar Isaac is Guatemalan-American with olive-tan skin
Get these details RIGHT for every actor.

RULES:
- FIRST priority: skin tone (be specific — "deep brown skin", "dark brown skin", "light olive skin", "pale freckled skin")
- Include: hair color/texture/style, build/body type, key facial features (jawline, eyes, nose), approximate age appearance
- Format each as: "a man/woman with [features]"
- Do NOT include the actor's name anywhere in the description
- Do NOT include clothing, roles they've played, or personality traits
- Keep each description to 25-35 words maximum

Return ONLY valid JSON (no markdown, no explanation):
{
  "CHARACTER_NAME": {
    "physical_description": "a man/woman with [physical features]",
    "age_range": "the actor's current apparent age as a range, e.g. 'early 40s', 'mid 30s', 'late 50s'"
  }
}

Actors to describe:
${actorLines.join('\n')}`;

    console.log('Resolving casting references via Llama 3...');
    const replicateResponse = await fetch('https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          prompt: systemPrompt,
          max_tokens: 1024,
          temperature: 0.3
        }
      })
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('Replicate API error:', errorText);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Casting resolution failed', details: errorText }) };
    }

    const prediction = await replicateResponse.json();

    // Return prediction ID for polling — same pattern as script-upload
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status: 'processing',
        prediction_id: prediction.id,
        poll_url: prediction.urls.get
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
