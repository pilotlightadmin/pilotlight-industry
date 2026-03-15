// Netlify Function: Generate voiceover audio for a scene using MiniMax Speech-02 on Replicate
// Takes dialogue text + voice/emotion parameters, returns audio URL

// Node 18+ has native fetch — no need for node-fetch

// Map voice_type descriptions from parser to MiniMax voice_id presets.
// MiniMax actual preset IDs:
//   Female: Wise_Woman, Calm_Woman, Inspirational_girl, Lively_Girl, Lovely_Girl,
//           Sweet_Girl_2, Exuberant_Girl, Abbess
//   Male:   Deep_Voice_Man, Patient_Man, Casual_Guy, Young_Knight, Determined_Man,
//           Decent_Boy, Elegant_Man, Imposing_Manner
//   Neutral: Friendly_Person
const inferVoiceId = (voiceType, gender) => {
  const vt = (voiceType || '').toLowerCase();

  // Narrator / stage direction: gender-neutral friendly voice
  if (/narrator|neutral/i.test(gender) || vt === 'narrator') return 'Friendly_Person';

  const isFemale = /female|woman/i.test(gender);

  if (isFemale) {
    if (/wise|old|mature|weathered/i.test(vt)) return 'Wise_Woman';
    if (/calm|soft|gentle|quiet|measured/i.test(vt)) return 'Calm_Woman';
    if (/sharp|bright|rapid|energetic|fiery/i.test(vt)) return 'Lively_Girl';
    if (/warm|inspiring|confident|strong/i.test(vt)) return 'Inspirational_girl';
    if (/low|husky|gravelly|deep|contralto/i.test(vt)) return 'Wise_Woman';
    if (/sweet|young|innocent|light/i.test(vt)) return 'Sweet_Girl_2';
    if (/authoritative|commanding|stern|formal/i.test(vt)) return 'Abbess';
    // Default female — distinct from male default
    return 'Calm_Woman';
  } else {
    if (/deep|commanding|baritone|authoritative|booming/i.test(vt)) return 'Deep_Voice_Man';
    if (/calm|patient|warm|gentle|measured/i.test(vt)) return 'Patient_Man';
    if (/sharp|bright|rapid|energetic/i.test(vt)) return 'Casual_Guy';
    if (/gravelly|rough|low|gruff|raspy/i.test(vt)) return 'Imposing_Manner';
    if (/young|boyish|light|eager/i.test(vt)) return 'Young_Knight';
    if (/elegant|smooth|refined|polished/i.test(vt)) return 'Elegant_Man';
    if (/determined|intense|driven|serious/i.test(vt)) return 'Determined_Man';
    // Default male — distinct from female default
    return 'Deep_Voice_Man';
  }
};

// Map dialogue context to MiniMax emotion parameter
const inferEmotion = (context) => {
  const ctx = (context || '').toLowerCase();
  if (/angry|furious|rage|cold|threatening/i.test(ctx)) return 'angry';
  if (/sad|tearful|grief|mourning|broken/i.test(ctx)) return 'sad';
  if (/happy|cheerful|excited|relieved/i.test(ctx)) return 'happy';
  if (/scared|desperate|panicked|fearful|terrified/i.test(ctx)) return 'fearful';
  if (/disgusted|revolted/i.test(ctx)) return 'disgusted';
  if (/shocked|surprised|stunned/i.test(ctx)) return 'surprised';
  return 'neutral';
};

// Map context to speed adjustment
const inferSpeed = (context) => {
  const ctx = (context || '').toLowerCase();
  if (/whispered|muttered|slow|measured|deliberate/i.test(ctx)) return 0.85;
  if (/shouted|desperate|rapid|panicked|urgent/i.test(ctx)) return 1.15;
  if (/narrator|stage.direction|dramatic.pause/i.test(ctx)) return 0.9;
  return 1.0;
};

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

    const { dialogue_text, dialogue_context, voice_type, gender, scene_num, is_narrator } = JSON.parse(event.body);

    if (!dialogue_text) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing dialogue_text' }) };
    }

    // Safety net: is_narrator flag forces narrator voice regardless of other fields
    const voice_id = is_narrator ? 'Friendly_Person' : inferVoiceId(voice_type, gender);
    const emotion = inferEmotion(dialogue_context);
    const speed = inferSpeed(dialogue_context);

    console.log(`Generating voiceover for scene ${scene_num || '?'}`);
    console.log(`Text: "${dialogue_text}"`);
    console.log(`Voice: ${voice_id}, Emotion: ${emotion}, Speed: ${speed}`);

    const input = {
      text: dialogue_text,
      voice_id,
      emotion,
      speed
    };

    console.log('TTS input:', JSON.stringify(input));

    // MiniMax Speech-02 HD for quality voiceover
    // Use /v1/models/ endpoint (official model, no version hash needed)
    const resp = await fetch('https://api.replicate.com/v1/models/minimax/speech-02-hd/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });

    console.log('TTS response status:', resp.status);

    const pred = await resp.json();

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
      console.error('TTS prediction failed:', JSON.stringify(pred));
      const errorDetail = pred.detail || pred.error || pred.message || JSON.stringify(pred);
      return { statusCode: 502, headers, body: JSON.stringify({ error: `Failed to start voiceover: ${errorDetail}` }) };
    }

    console.log(`Started TTS: ${pred.id} (scene ${scene_num || '?'})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: pred.id,
        poll_url: pred.urls?.get,
        type: 'voiceover',
        scene_num,
        status: pred.status
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
