// Netlify Function: Parse uploaded script via Replicate (Llama 3)
// Accepts script text, sends to LLM for structure analysis, stores in Airtable

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
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!REPLICATE_API_TOKEN) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Replicate API token' }) };
    }

    const body = JSON.parse(event.body);
    const { script_text, title, creator_id } = body;
    // Anchor mode: custom system prompt + raw text output (no JSON parsing)
    const anchorMode = body.anchor_mode === true;
    const customSystemPrompt = body.system_prompt || null;
    const customMaxTokens = body.max_tokens || null;

    if (!script_text || !title || !creator_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: script_text, title, creator_id' }) };
    }

    if (!anchorMode && script_text.length > 25000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Script too long. Max 25,000 characters (~10 pages).' }) };
    }

    // --- Step 1: Send script to Llama 3 via Replicate for structure analysis ---
    // LEAN PROMPT — fits within Llama 3 70B's 8K context window.
    // Keep instructions short. The JSON schema IS the instruction.

    // Pre-count scene headings so we can give the LLM an exact target.
    // Matches INT. / EXT. / INT./EXT. at the start of a line.
    const headingRegex = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s+/gm;
    const headingMatches = script_text.match(headingRegex) || [];
    const detectedSceneCount = headingMatches.length;

    // Build scene-count constraint only for formatted screenplays (≥1 heading).
    const sceneCountClause = detectedSceneCount > 0
      ? `\n\nSCENE COUNT: This script has exactly ${detectedSceneCount} scene headings (INT./EXT.). Return exactly ${detectedSceneCount} scenes — one per heading. Do NOT split a single heading into multiple scenes, even if new characters enter mid-scene.`
      : '';

    const systemPrompt = `You are a script analyst for AI image generation. Return ONLY valid JSON (no markdown, no explanation).

INPUT FORMAT: The input may be a formatted screenplay OR prose/block text (treatment, synopsis, short story, beat sheet, outline). Extract scenes, characters, and visual details regardless of format. SCENE BOUNDARIES: When the script has scene headings (INT./EXT.), use ONLY those headings as scene boundaries — one heading = one scene. Do NOT split a single scene heading into multiple scenes, even if new characters enter mid-scene. If no scene headings exist, infer scene breaks from location or time-of-day changes. If no explicit dialogue exists, use stage_direction voiceover options drawn from the narration.${sceneCountClause}

Analyze the script and return this JSON structure:

{
  "title": "script title",
  "scenes": [
    {
      "scene_num": 1,
      "int_ext": "INT or EXT (from scene heading, or inferred from location description)",
      "location": "specific location (e.g. 'cramped studio apartment with peeling wallpaper')",
      "scene_year": "year from heading if present (e.g. 1932 from 'INT. ROOM - 1932 - FLASHBACK'), omit if none",
      "time_of_day": "day/night/golden_hour/dawn/dusk/midnight",
      "characters_present": ["CHAR_A", "CHAR_B — ONLY characters PHYSICALLY PRESENT in this scene's location. Do NOT include characters who are in a different location, mentioned in passing, or thought about. If a character is across the ocean or in another city, they are NOT present."],
      "tone": "comedic/dramatic/tense/romantic/action/quiet/eerie/bittersweet",
      "emotion": "primary emotional beat",
      "description": "1-2 sentence summary",
      "image_prompt_base": "EMPTY SET ONLY. Zero character names or actions. Describe camera angle, architecture, props, lighting, textures, weather. INT=indoor details, EXT=outdoor details. 2-3 vivid sentences.",
      "voiceover_options": [{"type": "dialogue or stage_direction", "character": "NAME or null for stage_direction", "line": "max 15 words", "context": "whispered/shouted/calm/desperate/tense/etc — MUST include at least one dialogue line per character in characters_present. Every character who speaks or is present MUST have a voiceover_option."}],
      "character_actions": {"CHAR_A": "Frozen pose at peak moment, under 10 words. No movement verbs. Include dramatic objects held.", "CHAR_B": "REQUIRED for EVERY character in characters_present. Same format."}
    }
  ],
  "characters": {
    "CHARACTER_NAME": {
      "gender": "male/female/non-binary/non-human (non-human for robots, AI, orbs, animals, digital entities)",
      "age_range": "e.g. 'early 30s', 'late 50s', 'child (6-8)', 'teenager (15)'",
      "profession": "specific job title (e.g. 'homicide detective' not 'cop', 'trauma surgeon' not 'doctor')",
      "role": "protagonist/antagonist/supporting/mentor/love_interest",
      "energy": "nervous/confident/brooding/cheerful/intense/calm/volatile/guarded/magnetic",
      "physical_description": "For humans: lead with 'a man/woman with...', include build, hair color/style, skin tone, face shape. Use traits from the script if stated; if the script gives no physical details, invent a plausible, distinctive appearance that fits the character's role and energy. For non-human: describe visual form directly (shape, color, glow, size). Permanent STRUCTURAL traits ONLY — no expressions (no smiling, frowning, grinning), no emotions, no scene actions.",
      "archetype": "hero/trickster/mentor/rebel/caregiver/explorer/outsider/antihero",
      "voice_type": "3-5 words describing speaking voice (e.g. 'low gravelly measured drawl')"
    }
  },
  "overall_tone": "primary tone",
  "setting_period": {
    "era": "time period inferred from technology, fashion, slang, cultural references (e.g. 'present day 2020s', '1920s Prohibition era')",
    "era_visual_cues": "era-specific visual details for images: clothing styles, architecture, vehicles, technology, props",
    "confidence": "high/medium/low"
  },
  "genre_cues": ["genre1", "genre2"],
  "suggested_genre": "MUST be one of: action, horror, comedy, drama",
  "genre_reasoning": "one sentence why"
}

RULES: voiceover_options: Return one dialogue line per character present in the scene PLUS one stage_direction. EVERY character in characters_present who speaks MUST have their own voiceover_option entry with type "dialogue" and their name. If a character doesn't speak, include a stage_direction describing their action instead. Each line max 15 words. If no dialogue exists at all, use stage_direction only. Return ALL scenes from the script. For image_prompt_base, select the MOST VISUALLY STRIKING moment in each scene. physical_description must include hair color/style, skin tone, and build — use traits from the script if stated, otherwise invent a plausible distinctive appearance. No expressions or emotions in physical_description. image_prompt_base = empty set, zero characters. Infer gender from names/pronouns. PROFESSION INFERENCE: Infer profession from what characters DO, not their setting. "Partner" requires context — a detective's partner who investigates cases is a "detective", NOT a "police officer". The visual difference between a plainclothes detective (rumpled suit, jacket) and a uniformed patrol officer (navy blues, badge) is enormous. Always use the most specific job title: "homicide detective" not "cop". CLOTHING: physical_description clothing must come from what the script SHOWS — if the script mentions "jacket pockets" or "leather coat", use THAT clothing, do not invent uniforms or outfits not in the script. characters_present MUST list ONLY characters PHYSICALLY PRESENT at the scene's location — including late arrivals and mid-scene entrances. Characters in a DIFFERENT location (another city, another room, across the ocean) are NOT present even if the narrative mentions them. A character being thought about or written about does NOT make them present. character_actions MUST include an action for EVERY character in characters_present, not just the primary character. CRITICAL: Characters that are NOT human (AI assistants, digital orbs, robots, holograms, animals, computer voices, virtual entities) MUST use gender "non-human" and their physical_description must describe their visual form (e.g. 'a glowing digital orb on an LED screen'), NOT 'a man/woman with...'. A character marked (V.O.) that is described as an orb, screen, or AI is non-human. Return ONLY valid JSON.`;

    const llmSystemPrompt = customSystemPrompt || systemPrompt;
    const llmUserPrompt = anchorMode ? script_text : `Here is the script (may be formatted screenplay or prose/block text):\n\n${script_text}`;
    const llmMaxTokens = customMaxTokens || 8192;
    const llmTemp = anchorMode ? 0.4 : 0.2; // Slightly more creative for anchor framing

    console.log(`Sending to Replicate (Llama 3 70B)${anchorMode ? ' [ANCHOR MODE]' : ''}...`);
    const replicateResponse = await fetch('https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          system_prompt: llmSystemPrompt,
          prompt: llmUserPrompt,
          max_tokens: llmMaxTokens,
          temperature: llmTemp
        }
      })
    });
    console.log('Replicate response status:', replicateResponse.status);

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      // Inline billing check (billing-alert.js uses ESM which breaks esbuild CJS bundling)
      if (replicateResponse.status === 402 || /billing|payment|credits|quota|suspended/i.test(JSON.stringify(errorText))) {
        console.error(`[BILLING] billing/quota error: HTTP ${replicateResponse.status}`, JSON.stringify(errorText).slice(0, 300));
      }
      console.error('Replicate API error:', errorText);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Script analysis failed', details: errorText }) };
    }

    const prediction = await replicateResponse.json();

    // Return the prediction ID immediately — frontend will poll for completion.
    // This avoids Netlify function timeouts on cold-starting 70B models.
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status: 'processing',
        prediction_id: prediction.id,
        poll_url: prediction.urls.get,
        script_id: `local_${Date.now()}`
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
