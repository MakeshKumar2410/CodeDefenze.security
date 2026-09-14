import { GoogleDriveStorageService } from './googleDriveStorage.js'
import { R2StorageService } from './r2Storage.js'

let instance = null

/**
 * The only function anything outside backend/lib/storage/ should ever call.
 * Routes and the video repository depend on this, never on a concrete
 * provider class directly — that's what makes
 * "flip STORAGE_PROVIDER later" a one-line env change instead of a rewrite.
 */
export function getStorageService() {
  if (instance) return instance

  const provider = process.env.STORAGE_PROVIDER || 'google_drive'
  if (provider === 'r2') {
    instance = new R2StorageService()
  } else {
    instance = new GoogleDriveStorageService()
  }
  return instance
}
