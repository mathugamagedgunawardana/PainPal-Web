import { put, del, type PutBlobResult } from '@vercel/blob';

export type BlobAccess = 'public';

export async function uploadToBlob(params: {
  key: string;
  data: Buffer | Uint8Array | ArrayBuffer;
  contentType: string;
  access?: BlobAccess;
}): Promise<PutBlobResult> {
  const { key, data, contentType, access = 'public' } = params;

  try {
    let body: Buffer;
    if (Buffer.isBuffer(data)) {
      body = data;
    } else if (data instanceof ArrayBuffer) {
      body = Buffer.from(new Uint8Array(data));
    } else {
      body = Buffer.from(data);
    }

    const blob = await put(key, body, {
      access,
      contentType,
    });
    return blob;
  } catch (error) {
    console.error('Vercel Blob upload failed:', error);
    throw new Error('BLOB_UPLOAD_FAILED');
  }
}

export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('Vercel Blob delete failed:', error);
    throw new Error('BLOB_DELETE_FAILED');
  }
}
