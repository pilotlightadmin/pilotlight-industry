// Netlify Function: Start LoRA training on Replicate
// Uses ostris/flux-dev-lora-trainer to train a SCENE LoRA from the wide establishing shot.
// The scene LoRA captures the visual style, lighting, palette, and environment so that
// subsequent Kontext compositions maintain visual consistency across different framings.
// Downloads the image, packages it into a ZIP (required by the trainer), uploads to S3,
// then kicks off training with the ZIP URL.

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// ── Minimal ZIP builder (single file, STORE method — no compression needed for images) ──
function createZipBuffer(filename, fileBuffer) {
  // ZIP format: local file header + file data + central directory + end of central directory
  const fnBuf = Buffer.from(filename, 'utf8');
  const fnLen = fnBuf.length;
  const fileLen = fileBuffer.length;
  const crc = crc32(fileBuffer);

  // Local file header (30 + fnLen bytes)
  const lfh = Buffer.alloc(30 + fnLen);
  lfh.writeUInt32LE(0x04034b50, 0);  // signature
  lfh.writeUInt16LE(20, 4);           // version needed
  lfh.writeUInt16LE(0, 6);            // flags
  lfh.writeUInt16LE(0, 8);            // compression: STORE
  lfh.writeUInt16LE(0, 10);           // mod time
  lfh.writeUInt16LE(0, 12);           // mod date
  lfh.writeUInt32LE(crc, 14);         // crc32
  lfh.writeUInt32LE(fileLen, 18);     // compressed size
  lfh.writeUInt32LE(fileLen, 22);     // uncompressed size
  lfh.writeUInt16LE(fnLen, 26);       // filename length
  lfh.writeUInt16LE(0, 28);           // extra field length
  fnBuf.copy(lfh, 30);

  // Central directory file header (46 + fnLen bytes)
  const cdh = Buffer.alloc(46 + fnLen);
  cdh.writeUInt32LE(0x02014b50, 0);   // signature
  cdh.writeUInt16LE(20, 4);           // version made by
  cdh.writeUInt16LE(20, 6);           // version needed
  cdh.writeUInt16LE(0, 8);            // flags
  cdh.writeUInt16LE(0, 10);           // compression: STORE
  cdh.writeUInt16LE(0, 12);           // mod time
  cdh.writeUInt16LE(0, 14);           // mod date
  cdh.writeUInt32LE(crc, 16);         // crc32
  cdh.writeUInt32LE(fileLen, 20);     // compressed size
  cdh.writeUInt32LE(fileLen, 24);     // uncompressed size
  cdh.writeUInt16LE(fnLen, 28);       // filename length
  cdh.writeUInt16LE(0, 30);           // extra field length
  cdh.writeUInt16LE(0, 32);           // file comment length
  cdh.writeUInt16LE(0, 34);           // disk number start
  cdh.writeUInt16LE(0, 36);           // internal file attributes
  cdh.writeUInt32LE(0, 38);           // external file attributes
  cdh.writeUInt32LE(0, 42);           // relative offset of local header
  fnBuf.copy(cdh, 46);

  const cdOffset = 30 + fnLen + fileLen;
  const cdSize = 46 + fnLen;

  // End of central directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);  // signature
  eocd.writeUInt16LE(0, 4);           // disk number
  eocd.writeUInt16LE(0, 6);           // disk with CD
  eocd.writeUInt16LE(1, 8);           // entries on disk
  eocd.writeUInt16LE(1, 10);          // total entries
  eocd.writeUInt32LE(cdSize, 12);     // size of central directory
  eocd.writeUInt32LE(cdOffset, 16);   // offset of central directory
  eocd.writeUInt16LE(0, 20);          // comment length

  return Buffer.concat([lfh, fileBuffer, cdh, eocd]);
}

// ── CRC32 (standard polynomial, used by ZIP format) ──
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

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
    const S3_BUCKET = process.env.S3_BUCKET_NAME;
    const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;
    const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;

    if (!REPLICATE_API_TOKEN) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Replicate API token' }) };
    }
    if (!S3_BUCKET || !AWS_KEY || !AWS_SECRET) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing AWS credentials for S3' }) };
    }

    const { image_url, character_name, scene_name, trigger_word, steps } = JSON.parse(event.body);

    if (!image_url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing image_url' }) };
    }

    // Support both scene LoRA (scene_name) and legacy character LoRA (character_name)
    const entityName = scene_name || character_name;
    if (!entityName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing scene_name or character_name' }) };
    }

    const safeName = entityName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const finalTrigger = trigger_word || `TOK${safeName}`;
    const trainingSteps = steps || 500;
    const REPLICATE_OWNER = process.env.REPLICATE_OWNER || 'pilotlightadmin';
    const modelSlug = `pilotlight-${scene_name ? 'scene' : 'char'}-${safeName.toLowerCase()}-${Date.now()}`;

    console.log(`[LORA] Starting ${scene_name ? 'SCENE' : 'CHARACTER'} LoRA training for "${entityName}" (trigger: ${finalTrigger}, steps: ${trainingSteps})`);
    console.log(`[LORA] Input image: ${image_url}`);

    // ── Step 1: Download the image ──
    console.log(`[LORA] Downloading image...`);
    const imgResp = await fetch(image_url);
    if (!imgResp.ok) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Failed to download image: HTTP ${imgResp.status}` }) };
    }
    const imgArrayBuf = await imgResp.arrayBuffer();
    const imgBuffer = Buffer.from(imgArrayBuf);
    const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    console.log(`[LORA] Downloaded image: ${(imgBuffer.length / 1024).toFixed(0)} KB (${ext})`);

    // ── Step 2: Package into a ZIP (required by ostris trainer) ──
    const zipBuffer = createZipBuffer(`image.${ext}`, imgBuffer);
    console.log(`[LORA] Created ZIP: ${(zipBuffer.length / 1024).toFixed(0)} KB`);

    // ── Step 3: Upload ZIP to S3 ──
    const s3Client = new S3Client({
      region: 'us-east-2',
      credentials: { accessKeyId: AWS_KEY, secretAccessKey: AWS_SECRET }
    });

    const zipKey = `lora-training/${safeName.toLowerCase()}-${Date.now()}/training-images.zip`;
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: zipKey,
      Body: zipBuffer,
      ContentType: 'application/zip'
    }));

    const zipUrl = `https://${S3_BUCKET}.s3.us-east-2.amazonaws.com/${zipKey}`;
    console.log(`[LORA] Uploaded training ZIP to S3: ${zipUrl}`);

    // ── Step 4: Create the destination model on Replicate ──
    const createModelResp = await fetch('https://api.replicate.com/v1/models', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        owner: REPLICATE_OWNER,
        name: modelSlug,
        description: `LoRA for ${scene_name ? 'scene' : 'character'}: ${entityName}`,
        visibility: 'private',
        hardware: 'gpu-t4'
      })
    });

    let destination;
    if (createModelResp.ok) {
      const modelData = await createModelResp.json();
      destination = `${modelData.owner}/${modelData.name}`;
      console.log(`[LORA] Created destination model: ${destination}`);
    } else {
      const errBody = await createModelResp.text();
      console.error(`[LORA] Model creation FAILED (${createModelResp.status}): ${errBody.substring(0, 300)}`);
      return {
        statusCode: 502, headers,
        body: JSON.stringify({ error: 'Failed to create destination model on Replicate', details: errBody.substring(0, 200) })
      };
    }

    // ── Step 5: Start the training with the ZIP URL ──
    const trainingResp = await fetch(
      'https://api.replicate.com/v1/models/ostris/flux-dev-lora-trainer/versions/d995297071a44dcb72244e6c19462111649ec86a9646c32df56daa7f14801944/trainings',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination,
          input: {
            input_images: zipUrl,
            trigger_word: finalTrigger,
            steps: trainingSteps,
            autocaption: true,
            learning_rate: 0.0004,
            batch_size: 1,
            resolution: '512,768,1024',
            lora_rank: 16
          }
        })
      }
    );

    const training = await trainingResp.json();

    if (trainingResp.status === 429) {
      return {
        statusCode: 429, headers,
        body: JSON.stringify({ retry: true, retry_after: 30, message: 'Rate limited' })
      };
    }

    if (trainingResp.status === 402 || /billing|payment|credits|quota/i.test(JSON.stringify(training))) {
      console.error(`[BILLING] LoRA training billing error: HTTP ${trainingResp.status}`, JSON.stringify(training).slice(0, 300));
    }

    if (!training.id) {
      console.error('[LORA] Training failed to start:', JSON.stringify(training));
      return {
        statusCode: 502, headers,
        body: JSON.stringify({ error: 'Failed to start training', details: training.detail || training.error || 'Unknown error' })
      };
    }

    console.log(`[LORA] Training started: ${training.id} → ${destination} (trigger: ${finalTrigger})`);

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        training_id: training.id,
        status: training.status,
        destination,
        trigger_word: finalTrigger,
        poll_url: training.urls?.get || `https://api.replicate.com/v1/trainings/${training.id}`,
        character_name: entityName,
        scene_name: scene_name || null
      })
    };

  } catch (error) {
    console.error('[LORA] Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
