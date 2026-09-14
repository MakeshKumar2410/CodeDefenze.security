import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Large uploads land here first (via multer, on local disk) before being
// pushed to whichever storage provider is active. Kept local and temporary
// regardless of provider — nothing permanent is ever stored here.
export const TEMP_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'tmp')

export function ensureTempDir() {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true })
  return TEMP_UPLOAD_DIR
}

export function cleanupTempFile(filePath) {
  if (!filePath) return
  fs.unlink(filePath, () => {}) // best-effort; a missing file is fine
}

export const ALLOWED_VIDEO_TYPES = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
}
export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024 // 1GB

export function safeFilename(originalName = 'video') {
  const base = path.basename(String(originalName)).trim() || 'video'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned.slice(-150) || 'video'
}

/**
 * Every storage provider (GoogleDriveStorageService, R2StorageService, and
 * any future one) implements this exact shape. Nothing outside this
 * `storage/` folder should ever import a provider directly — always go
 * through `getStorageService()` in index.js, so switching
 * STORAGE_PROVIDER never requires touching routes or the video repository.
 *
 * uploadVideo({ courseName, dayNumber, localFilePath, filename, mimeType })
 *   -> { provider, fileId, folderPath }
 *   Uploads a file already sitting on local disk (written there by multer)
 *   to the provider, organized under a course/day folder structure.
 *
 * deleteVideo(fileId) -> void
 *   Removes the file from the provider. Safe to call on an already-deleted
 *   or unknown fileId — should not throw for that case.
 *
 * streamVideo(fileId, { range }) -> { stream, status, headers }
 *   Returns a readable stream (plus the HTTP status/headers to forward)
 *   for proxying the video back through our backend — the provider file
 *   itself is never made public or linked to directly.
 *
 * getFileMetadata(fileId) -> { name, mimeType, size } | null
 */
export class StorageServiceInterface {
  async uploadVideo() {
    throw new Error('uploadVideo() not implemented')
  }
  async deleteVideo() {
    throw new Error('deleteVideo() not implemented')
  }
  async streamVideo() {
    throw new Error('streamVideo() not implemented')
  }
  async getFileMetadata() {
    throw new Error('getFileMetadata() not implemented')
  }
}
