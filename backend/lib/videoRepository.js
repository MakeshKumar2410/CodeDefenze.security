import { readDB, writeDB, nextId } from '../db.js'

/**
 * Repository pattern for course video/class metadata — matches the schema
 * requested for a future SQL table:
 *   id, course_id, title, day_number, description, original_filename,
 *   storage_provider, storage_file_id, upload_status, created_at, updated_at
 *
 * IMPORTANT: this currently reads/writes the existing JSON db (db.classes),
 * not a real SQL database — see the note in the project README about why.
 * Every method below is written so that swapping the *implementation* of
 * this one file for real SQL (e.g. via the `pg` driver against Postgres)
 * is a contained change: routes/classes.js only ever calls these exported
 * functions, never touches db.classes directly, and never assumes
 * anything about how the data is actually stored.
 */

function toRecord(cls) {
  if (!cls) return null
  return {
    id: cls.id,
    courseId: cls.courseId,
    title: cls.title,
    dayNumber: cls.dayNumber,
    description: cls.description || '',
    originalFilename: cls.videoFilename || null,
    mimeType: cls.videoMimeType || null,
    sizeBytes: cls.videoSize || null,
    storageProvider: cls.storageProvider || null,
    storageFileId: cls.storageFileId || null,
    uploadStatus: cls.uploadStatus || 'pending', // pending | uploading | ready | failed
    createdAt: cls.createdAt,
    updatedAt: cls.updatedAt,
  }
}

export function listByCourse(courseId) {
  const db = readDB()
  return db.classes
    .filter((c) => c.courseId === courseId)
    .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
    .map(toRecord)
}

export function findById(id) {
  const db = readDB()
  return toRecord(db.classes.find((c) => c.id === id))
}

// Internal-only accessor for routes that need the raw record (e.g. to read
// storageFileId before calling the storage service) without exposing
// db.classes directly to route files.
export function _findRaw(id) {
  const db = readDB()
  return db.classes.find((c) => c.id === id)
}

export function create({ courseId, title, dayNumber, description }) {
  const db = readDB()
  const now = new Date().toISOString()
  const cls = {
    id: nextId('class'),
    courseId,
    title,
    dayNumber,
    description: description || '',
    videoFilename: null,
    videoMimeType: null,
    videoSize: null,
    storageProvider: null,
    storageFileId: null,
    uploadStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  db.classes.push(cls)
  writeDB(db)
  return toRecord(cls)
}

export function update(id, patch) {
  const db = readDB()
  const cls = db.classes.find((c) => c.id === id)
  if (!cls) return null
  if (patch.title !== undefined) cls.title = patch.title
  if (patch.dayNumber !== undefined) cls.dayNumber = patch.dayNumber
  if (patch.description !== undefined) cls.description = patch.description
  cls.updatedAt = new Date().toISOString()
  writeDB(db)
  return toRecord(cls)
}

export function setVideoMetadata(id, { originalFilename, mimeType, sizeBytes, storageProvider, storageFileId, uploadStatus }) {
  const db = readDB()
  const cls = db.classes.find((c) => c.id === id)
  if (!cls) return null
  cls.videoFilename = originalFilename
  cls.videoMimeType = mimeType
  cls.videoSize = sizeBytes
  cls.storageProvider = storageProvider
  cls.storageFileId = storageFileId
  cls.uploadStatus = uploadStatus
  cls.updatedAt = new Date().toISOString()
  writeDB(db)
  return toRecord(cls)
}

export function clearVideo(id) {
  return setVideoMetadata(id, {
    originalFilename: null, mimeType: null, sizeBytes: null,
    storageProvider: null, storageFileId: null, uploadStatus: 'pending',
  })
}

export function remove(id) {
  const db = readDB()
  const before = db.classes.length
  db.classes = db.classes.filter((c) => c.id !== id)
  writeDB(db)
  return db.classes.length !== before
}
