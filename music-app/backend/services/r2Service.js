/**
 * Storage service — works with Cloudflare R2 OR Backblaze B2 (both S3-compatible).
 *
 * For Backblaze B2 set these env vars:
 *   S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com   ← your bucket's endpoint
 *   R2_ACCESS_KEY_ID=your_b2_keyID
 *   R2_SECRET_ACCESS_KEY=your_b2_applicationKey
 *   R2_BUCKET_NAME=raabta-songs
 *   R2_PUBLIC_URL=https://f004.backblazeb2.com/file/raabta-songs
 *
 * For Cloudflare R2 set these env vars (legacy):
 *   R2_ACCOUNT_ID=your_cf_account_id
 *   (rest same as above, S3_ENDPOINT not needed)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

// Lazy init — reads env vars on first use (fixes ES module + dotenv timing)
let s3Client = null;

function getClient() {
  if (s3Client) return s3Client;

  const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
  const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const S3_ENDPOINT =
    process.env.S3_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : null);

  if (!ACCESS_KEY || !SECRET_KEY || !S3_ENDPOINT) {
    console.warn('⚠ Storage credentials not set — file storage disabled');
    return null;
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: S3_ENDPOINT,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    forcePathStyle: true,
  });
  console.log(`✓ Storage client initialised → ${S3_ENDPOINT}`);
  return s3Client;
}

/**
 * Upload a buffer to storage.
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {string} Public URL
 */
export async function uploadSong(buffer, filename) {
  const s3Client = getClient();
  if (!s3Client) throw new Error('Storage client not initialised');

  const contentType = filename.endsWith('.mp3')
    ? 'audio/mpeg'
    : filename.endsWith('.jpg') || filename.endsWith('.jpeg')
    ? 'image/jpeg'
    : filename.endsWith('.png')
    ? 'image/png'
    : 'application/octet-stream';

  const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'raabta-songs';
  const PUBLIC_URL   = process.env.R2_PUBLIC_URL;
  const S3_EP        = process.env.S3_ENDPOINT || '';

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = PUBLIC_URL
    ? `${PUBLIC_URL}/${filename}`
    : `${S3_EP}/${BUCKET_NAME}/${filename}`;

  console.log(`✓ Uploaded: ${filename}`);
  return url;
}

/**
 * Check if a file exists in storage.
 */
export async function checkExists(filename) {
  const s3Client = getClient();
  if (!s3Client) return false;
  try {
    const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'raabta-songs';
    await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: filename }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Stream a file from storage with optional Range support.
 */
export async function getSongStream(url, rangeHeader) {
  const s3Client = getClient();
  if (!s3Client) throw new Error('Storage client not initialised');

  const key = url.split('/').pop();
  const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'raabta-songs';
  const params = { Bucket: BUCKET_NAME, Key: key };
  if (rangeHeader) params.Range = rangeHeader;

  const response = await s3Client.send(new GetObjectCommand(params));

  return {
    body: response.Body,
    statusCode: rangeHeader ? 206 : 200,
    contentLength: response.ContentLength,
    contentRange: response.ContentRange,
  };
}
