import fs from 'fs'
import { google } from 'googleapis'
import { StorageServiceInterface } from './StorageService.js'

// Sanitizes a course/day name into something safe to use as a Drive folder
// name — Drive allows almost any character, but we keep this conservative
// so folder names stay readable and predictable.
function safeFolderName(name = 'Untitled') {
  return String(name).trim().replace(/[/\\]/g, '-').slice(0, 100) || 'Untitled'
}

function normalizeEnvValue(value) {
  return typeof value === 'string' ? value.trim() : value
}

export class GoogleDriveStorageService extends StorageServiceInterface {
  constructor() {
    super()

    const GOOGLE_CLIENT_ID = normalizeEnvValue(process.env.GOOGLE_CLIENT_ID)
    const GOOGLE_CLIENT_SECRET = normalizeEnvValue(process.env.GOOGLE_CLIENT_SECRET)
    const GOOGLE_REDIRECT_URI = normalizeEnvValue(process.env.GOOGLE_REDIRECT_URI)
    const GOOGLE_REFRESH_TOKEN = normalizeEnvValue(process.env.GOOGLE_REFRESH_TOKEN)
    const GOOGLE_DRIVE_FOLDER_ID = normalizeEnvValue(process.env.GOOGLE_DRIVE_FOLDER_ID)

    this.rootFolderId = GOOGLE_DRIVE_FOLDER_ID
    this._configured = Boolean(
      GOOGLE_CLIENT_ID &&
        GOOGLE_CLIENT_SECRET &&
        GOOGLE_REDIRECT_URI &&
        GOOGLE_REFRESH_TOKEN &&
        GOOGLE_DRIVE_FOLDER_ID,
    )

    console.info('[GoogleDrive] env diagnostics', {
      storageProvider: process.env.STORAGE_PROVIDER || 'google_drive',
      hasClientId: Boolean(GOOGLE_CLIENT_ID),
      hasClientSecret: Boolean(GOOGLE_CLIENT_SECRET),
      hasRedirectUri: Boolean(GOOGLE_REDIRECT_URI),
      hasRefreshToken: Boolean(GOOGLE_REFRESH_TOKEN),
      hasDriveFolderId: Boolean(GOOGLE_DRIVE_FOLDER_ID),
    })

    if (this._configured) {
      const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
      oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN })
      this.drive = google.drive({ version: 'v3', auth: oauth2Client })
    }

    // In-memory only — just avoids repeated "does this folder exist" lookups
    // within one running process. Never persisted, never a source of truth.
    this._folderCache = new Map()
  }

  _requireConfigured() {
    if (!this._configured) {
      throw new Error(
        'Google Drive is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN, and GOOGLE_DRIVE_FOLDER_ID in backend/.env.',
      )
    }
  }

  // Finds a folder by name under a given parent, creating it if it doesn't
  // exist yet. This is how "Courses/CCNA/Day-01" gets built dynamically
  // without ever hard-coding a course name.
  async _ensureFolder(name, parentId) {
    const cacheKey = `${parentId}::${name}`
    if (this._folderCache.has(cacheKey)) return this._folderCache.get(cacheKey)

    const safeName = safeFolderName(name).replace(/'/g, "\\'")
    const query = `mimeType='application/vnd.google-apps.folder' and name='${safeName}' and '${parentId}' in parents and trashed=false`

    const existing = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    })

    let folderId
    if (existing.data.files?.length) {
      folderId = existing.data.files[0].id
    } else {
      const created = await this.drive.files.create({
        requestBody: {
          name: safeFolderName(name),
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        fields: 'id',
      })
      folderId = created.data.id
    }

    this._folderCache.set(cacheKey, folderId)
    return folderId
  }

  async _ensureCourseDayFolder(courseName, dayNumber) {
    const coursesRoot = await this._ensureFolder('Courses', this.rootFolderId)
    const courseFolder = await this._ensureFolder(courseName, coursesRoot)
    const dayLabel = `Day-${String(dayNumber).padStart(2, '0')}`
    return this._ensureFolder(dayLabel, courseFolder)
  }

  /**
   * Uploads a file already on local disk to Drive. For files in the
   * hundreds-of-MB range, the googleapis client library automatically uses
   * Google's resumable upload protocol under the hood when given a stream
   * as `media.body` (rather than loading the whole file into memory) — it
   * chunks the upload and can recover from a dropped connection without
   * restarting from zero. We just need to hand it a stream, which is why
   * the multer layer writes to a temp file first instead of buffering in
   * memory.
   */
  async uploadVideo({ courseName, dayNumber, localFilePath, filename, mimeType }) {
    this._requireConfigured()
    const dayFolderId = await this._ensureCourseDayFolder(courseName, dayNumber)

    const response = await this.drive.files.create({
      requestBody: {
        name: safeFolderName(filename),
        parents: [dayFolderId],
      },
      media: {
        mimeType,
        body: fs.createReadStream(localFilePath),
      },
      fields: 'id, name, size',
    })

    return {
      provider: 'google_drive',
      fileId: response.data.id,
      folderPath: `Courses/${courseName}/Day-${String(dayNumber).padStart(2, '0')}`,
    }
  }

  async deleteVideo(fileId) {
    if (!fileId) return
    this._requireConfigured()
    try {
      await this.drive.files.delete({ fileId })
    } catch (err) {
      // A 404 here just means it's already gone — fine. Anything else is
      // logged but still doesn't block the caller (deleting our own DB
      // record should never be blocked by Drive being unreachable).
      if (err.code !== 404) {
        console.error('[GoogleDrive] deleteVideo failed:', err.message)
      }
    }
  }

  /**
   * Streams a file back from Drive through our backend — the file itself
   * stays private in Drive (never shared/public), so this proxy is the
   * only way to actually watch it. We forward the client's Range header so
   * seeking/scrubbing in the video player works.
   *
   * Known limitation: Drive's alt=media endpoint's Range support is
   * generally reliable for progressive playback, but is not guaranteed to
   * behave identically to a purpose-built video CDN — if you notice
   * seeking issues on very large files, that's the practical ceiling of
   * proxying through Drive, and is the main reason R2 (a real object
   * store with proper HTTP range semantics) is prepared as the next step.
   */
  async streamVideo(fileId, { range } = {}) {
    this._requireConfigured()
    const headers = {}
    if (range) headers.Range = range

    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream', headers },
    )

    return {
      stream: response.data,
      status: response.status, // 200 or 206
      headers: {
        'Content-Type': response.headers['content-type'] || 'application/octet-stream',
        'Content-Length': response.headers['content-length'],
        'Content-Range': response.headers['content-range'],
        'Accept-Ranges': 'bytes',
      },
    }
  }

  async getFileMetadata(fileId) {
    this._requireConfigured()
    try {
      const res = await this.drive.files.get({ fileId, fields: 'id, name, mimeType, size' })
      return res.data
    } catch (err) {
      if (err.code === 404) return null
      throw err
    }
  }
}
