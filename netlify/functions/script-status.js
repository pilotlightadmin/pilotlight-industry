// Netlify Function: Poll Replicate prediction status for script parsing
// Lightweight endpoint — frontend polls this every 2s until the LLM finishes

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
    const { poll_url } = JSON.parse(event.body);

    if (!poll_url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing poll_url' }) };
    }

    const pollResponse = await fetch(poll_url, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
    });
    const result = await pollResponse.json();

    if (result.status === 'failed') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'failed', error: result.error || 'Script analysis failed' })
      };
    }

    if (result.status !== 'succeeded') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'processing' })
      };
    }

    // Succeeded — parse the LLM output
    const rawOutput = Array.isArray(result.output) ? result.output.join('') : result.output;

    // First, try to parse as JSON (standard script analysis mode)
    let parsedScript;
    try {
      // Strip markdown code fences that LLMs sometimes add
      let cleaned = rawOutput.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '').trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      let jsonStr = jsonMatch[0];

      // Fix trailing commas before } or ] (common LLM mistake)
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

      try {
        parsedScript = JSON.parse(jsonStr);
      } catch (firstErr) {
        // Truncated JSON: try closing open braces/brackets
        console.warn('First JSON parse failed, attempting repair...');
        let repaired = jsonStr;
        // Count unclosed braces and brackets
        let openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
        let openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
        // Trim any trailing partial key/value
        repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
        repaired = repaired.replace(/,\s*$/, '');
        // Close open structures
        for (let b = 0; b < openBrackets; b++) repaired += ']';
        for (let b = 0; b < openBraces; b++) repaired += '}';
        // Fix trailing commas again after repair
        repaired = repaired.replace(/,\s*([}\]])/g, '$1');
        parsedScript = JSON.parse(repaired);
        console.log('JSON repair succeeded');
      }
    } catch (parseError) {
      // Not valid JSON — might be plain text from anchor mode
      // If we have reasonable text output, return it as a raw string
      const trimmed = rawOutput.trim();
      if (trimmed.length > 10 && trimmed.length < 2000) {
        console.log('Returning raw text output (anchor/text mode):', trimmed.substring(0, 100));
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: 'succeeded',
            parsed: trimmed
          })
        };
      }
      console.error('JSON parse error:', parseError.message);
      console.error('Raw output (first 1000 chars):', rawOutput.substring(0, 1000));
      console.error('Raw output (last 500 chars):', rawOutput.substring(rawOutput.length - 500));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'failed', error: 'Failed to parse script analysis. Try again.', raw: rawOutput.substring(0, 200) })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'succeeded',
        parsed: parsedScript,
        scene_count: parsedScript.scenes ? parsedScript.scenes.length : 0,
        character_count: parsedScript.characters ? Object.keys(parsedScript.characters).length : 0
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
