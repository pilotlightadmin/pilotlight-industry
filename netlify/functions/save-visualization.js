// Netlify Function: Persist visualization images to S3 and save record to Airtable.
// Called AFTER visualization-status returns completed results.
// This is the heavy function — downloads images from Replicate, uploads to S3.
// The frontend calls this in the background after displaying results.

// Node 18+ has native fetch — no need for node-fetch
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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
    const S3_BUCKET = process.env.S3_BUCKET_NAME;
    const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;
    const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    const {
      scene_images: inputScenes,
      character_concepts: inputChars,
      mood_board_url: inputMoodUrl,
      mood,
      visual_style,
      script_title,
      script_text,
      creator_id,
      parsed_structure
    } = JSON.parse(event.body);

    // --- S3 setup ---
    const s3Enabled = S3_BUCKET && AWS_KEY && AWS_SECRET;
    let s3Client;

    if (s3Enabled) {
      s3Client = new S3Client({
        region: 'us-east-2',
        credentials: {
          accessKeyId: AWS_KEY,
          secretAccessKey: AWS_SECRET
        }
      });
    }

    const timestamp = Date.now();
    const safeName = (script_title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const folder = `visualizations/${safeName}_${mood}_${visual_style}_${timestamp}`;

    // Single-attempt S3 uploader with validation
    const uploadToS3 = async (imageUrl, key) => {
      if (!s3Enabled || !imageUrl) return imageUrl || null;

      try {
        const imgResp = await fetch(imageUrl);
        if (!imgResp.ok) {
          console.error(`Fetch failed for ${key}: HTTP ${imgResp.status}`);
          return null;
        }

        const contentType = imgResp.headers.get('content-type') || 'image/png';
        if (!contentType.startsWith('image/')) {
          console.error(`Non-image content for ${key}: ${contentType}`);
          return null;
        }

        const buffer = Buffer.from(await imgResp.arrayBuffer());
        if (buffer.length < 1024) {
          console.error(`File too small for ${key}: ${buffer.length} bytes`);
          return null;
        }

        await s3Client.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType
        }));

        console.log(`Uploaded: ${key} (${(buffer.length / 1024).toFixed(0)} KB)`);
        return `https://${S3_BUCKET}.s3.us-east-2.amazonaws.com/${key}`;
      } catch (err) {
        console.error(`Upload failed for ${key}:`, err.message);
        return null;
      }
    };

    // --- Upload all images in parallel ---
    const uploadTasks = [];
    let uploadFailures = 0;

    // Scenes
    for (const s of (inputScenes || [])) {
      const key = `${folder}/scene-${s.scene_num}.png`;
      uploadTasks.push(
        uploadToS3(s.url, key).then(url => ({ group: 'scene', scene_num: s.scene_num, url, description: s.description }))
      );
    }

    // Characters
    for (const c of (inputChars || [])) {
      const charName = (c.name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const key = `${folder}/char-${charName}.png`;
      uploadTasks.push(
        uploadToS3(c.url, key).then(url => ({ group: 'character', name: c.name, url }))
      );
    }

    // Mood board
    if (inputMoodUrl) {
      const key = `${folder}/mood-board.png`;
      uploadTasks.push(
        uploadToS3(inputMoodUrl, key).then(url => ({ group: 'mood_board', url }))
      );
    }

    const uploaded = await Promise.all(uploadTasks);

    // Organize results
    const scene_images = [];
    const character_concepts = [];
    let mood_board_url = null;

    for (const u of uploaded) {
      if (!u.url) {
        uploadFailures++;
        continue;
      }
      if (u.group === 'scene') {
        scene_images.push({ scene_num: u.scene_num, url: u.url, description: u.description });
      } else if (u.group === 'character') {
        character_concepts.push({ name: u.name, url: u.url });
      } else if (u.group === 'mood_board') {
        mood_board_url = u.url;
      }
    }

    scene_images.sort((a, b) => (a.scene_num || 0) - (b.scene_num || 0));

    console.log(`S3: ${scene_images.length} scenes, ${character_concepts.length} chars, ${mood_board_url ? 1 : 0} mood${uploadFailures > 0 ? ` (${uploadFailures} failed)` : ''}`);

    // --- Save to Airtable ---
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      try {
        const atResp = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/ScriptVisualizations`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              records: [{
                fields: {
                  title: script_title || 'Untitled',
                  creator_id: creator_id || '',
                  script_text: script_text || '',
                  parsed_structure: parsed_structure ? JSON.stringify(parsed_structure) : '',
                  status: 'complete',
                  mood: mood || '',
                  visual_style: visual_style || '',
                  image_urls: JSON.stringify({ scene_images, character_concepts, mood_board_url }),
                  created_at: new Date().toISOString()
                }
              }]
            })
          }
        );
        console.log('Airtable: record created, status', atResp.status);
      } catch (atErr) {
        console.error('Airtable error:', atErr.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        scene_images,
        character_concepts,
        mood_board_url,
        upload_failures: uploadFailures
      })
    };

  } catch (error) {
    console.error('Save function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
