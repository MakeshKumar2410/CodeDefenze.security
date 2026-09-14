import { StorageServiceInterface } from './StorageService.js'

// Prepared, not active. Every method throws immediately rather than
// silently doing nothing — that way, if STORAGE_PROVIDER is ever set to
// 'r2' before real credentials and an implementation are added, the
// failure is loud and immediate instead of a confusing missing upload.
//
// To actually activate R2 later: fill in the constructor below using the
// AWS S3 SDK (R2 is S3-compatible) with the R2_* env vars already present
// in .env.example, implement the four methods below following the same
// shape as GoogleDriveStorageService, then set STORAGE_PROVIDER=r2.
// Nothing outside backend/lib/storage/ needs to change.
export class R2StorageService extends StorageServiceInterface {
  constructor() {
    super()
    this._configured = false
  }

  _notConfigured() {
    throw new Error(
      'Cloudflare R2 storage is prepared in code but not yet configured or activated. ' +
        'Set STORAGE_PROVIDER=google_drive, or finish implementing R2StorageService and provide R2_* credentials.',
    )
  }

  async uploadVideo() {
    this._notConfigured()
  }
  async deleteVideo() {
    this._notConfigured()
  }
  async streamVideo() {
    this._notConfigured()
  }
  async getFileMetadata() {
    this._notConfigured()
  }
}
