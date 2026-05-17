import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp'])

/**
 * Load a local MRI file and normalize to PNG bytes for Blob + browser display.
 * ResNet inference can use the same buffer (PIL reads PNG).
 */
export async function prepareMriImageBytes(localPath: string): Promise<{
  pngBytes: Buffer
  originalFileName: string
  mimeType: string
}> {
  const abs = path.resolve(localPath)
  if (!fs.existsSync(abs)) {
    throw new Error(`MRI file not found: ${abs}`)
  }
  const ext = path.extname(abs).toLowerCase()
  if (!IMAGE_EXT.has(ext)) {
    throw new Error(`Unsupported MRI extension: ${ext}`)
  }

  const pngBytes = await sharp(abs).rotate().resize(224, 224, { fit: 'inside' }).png().toBuffer()
  const base = path.basename(abs, ext)
  return {
    pngBytes,
    originalFileName: `${base}.png`,
    mimeType: 'image/png',
  }
}
