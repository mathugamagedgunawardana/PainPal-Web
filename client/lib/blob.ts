import { del, get, getDownloadUrl, put, type PutBlobResult } from '@vercel/blob';

export type BlobAccess = 'public' | 'private';

const PLACEHOLDER_TOKENS = new Set([
  '',
  'MODEL_BLOB_READ_WRITE_TOKEN',
  'your_token_here',
  'vercel_blob_rw_',
])

/**
 * When Blob is connected to your Vercel Next.js project, Vercel injects
 * BLOB_READ_WRITE_TOKEN on deploy. For local dev, copy it from the project
 * env vars or run: npx vercel env pull .env.local
 */
export function resolveBlobToken(): string | undefined {
  const raw = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!raw || PLACEHOLDER_TOKENS.has(raw)) return undefined
  // Real tokens are long secrets; reject obvious label-only values
  if (raw.length < 20 || /^[A-Z_]+$/.test(raw)) return undefined
  return raw
}

export function isBlobConfigured(): boolean {
  return Boolean(resolveBlobToken())
}

export function blobSetupHint(): string {
  return (
    'Blob is not configured locally. Your store can be connected on Vercel without you seeing a ' +
    'separate “token page”. Open your **Next.js project** (not only the Storage store) → ' +
    'Settings → Environment Variables → find **BLOB_READ_WRITE_TOKEN** → reveal and copy into ' +
    'client/.env. Or run: cd client && npx vercel link && npx vercel env pull .env.local'
  )
}

export async function uploadToBlob(params: {
  key: string;
  data: Buffer | Uint8Array | ArrayBuffer;
  contentType: string;
  access?: BlobAccess;
}): Promise<PutBlobResult> {
  const { key, data, contentType, access = 'private' } = params;
  const token = resolveBlobToken();
  if (!token) {
    throw new Error(blobSetupHint())
  }

  let body: Buffer;
  if (Buffer.isBuffer(data)) {
    body = data;
  } else if (data instanceof ArrayBuffer) {
    body = Buffer.from(new Uint8Array(data));
  } else {
    body = Buffer.from(data);
  }

  try {
    return await put(key, body, {
      access,
      contentType,
      token,
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error('Vercel Blob upload failed:', error);
    throw new Error('BLOB_UPLOAD_FAILED');
  }
}

/** Fetch bytes from a private blob by pathname (server-side only). */
export async function readPrivateBlob(pathname: string): Promise<{
  buffer: Buffer;
  contentType: string | undefined;
}> {
  const token = resolveBlobToken();
  if (!token) {
    throw new Error(blobSetupHint())
  }

  const result = await get(pathname, { access: 'private', token })
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error('BLOB_NOT_FOUND')
  }
  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer())
  return { buffer, contentType: result.blob.contentType ?? undefined }
}

/** Short-lived signed URL for private blobs (avoids proxying bytes through Next.js). */
export function getBlobSignedDownloadUrl(blobUrl: string): string {
  return getDownloadUrl(blobUrl)
}

export async function deleteBlob(url: string): Promise<void> {
  const token = resolveBlobToken();
  try {
    await del(url, token ? { token } : undefined)
  } catch (error) {
    console.error('Vercel Blob delete failed:', error);
    throw new Error('BLOB_DELETE_FAILED');
  }
}
