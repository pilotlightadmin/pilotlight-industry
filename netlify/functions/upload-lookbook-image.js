// Netlify Function: Upload a look book image to S3
// Accepts base64 image data, returns public S3 URL for Replicate to fetch

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

    if (!S3_BUCKET || !AWS_KEY || !AWS_SECRET) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing AWS credentials' }) };
    }

    const { image_data, index, session_id } = JSON.parse(event.body);

    if (!image_data) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing image_data' }) };
    }

    // Parse data URL → buffer
    const matches = image_data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid image data URL format' }) };
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const contentType = `image/${matches[1]}`;

    if (buffer.length < 512) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Image too small' }) };
    }

    const s3Client = new S3Client({
      region: 'us-east-2',
      credentials: { accessKeyId: AWS_KEY, secretAccessKey: AWS_SECRET }
    });

    const sid = session_id || Date.now();
    const key = `lookbook/${sid}/ref_${index || 0}.${ext}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }));

    const url = `https://${S3_BUCKET}.s3.us-east-2.amazonaws.com/${key}`;
    console.log(`Uploaded lookbook image: ${key} (${(buffer.length / 1024).toFixed(0)} KB)`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, url })
    };

  } catch (error) {
    console.error('Upload error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Upload failed', message: error.message }) };
  }
};
