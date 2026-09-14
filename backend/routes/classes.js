import express from 'express'
import multer from 'multer'
import path from 'path'
import { readDB } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'
import requireStudent from '../middleware/requireStudent.js'
import { getStorageService } from '../lib/storage/index.js'
import { ensureTempDir, cleanupTempFile, safeFilename, ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES } from '../lib/storage/StorageService.js'
import * as videoRepo from '../lib/videoRepository.js'

const router = express.Router()

// ---------- Multer: temp local storage only ----------
// Videos never stay on local disk — this is just a scratch area multer
// needs so the file exists on disk before we stream it up to whichever
// storage provider is active (Google Drive resumable upload needs a
// readable stream, and streaming directly from the incoming request while
// also validating it reliably is far more fragile than this two-step
// approach). The temp file is deleted right after the provider upload
// finishes, success or failure.
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, ensureTempDir())
  },
  filename(_req, file, cb) {
    const ext = ALLOWED_VIDEO_TYPES[file.mimetype] || path.extname(file.originalname) || ''
    cb(null, `${Date.now()}-${safeFilename(path.basename(file.originalname, path.extname(file.originalname)))}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_BYTES },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_VIDEO_TYPES[file.mimetype]) {
      return cb(new Error('Unsupported file type. Please upload MP4, WebM, or MOV.'))
    }
    cb(null, true)
  },
})

function toPublicClass(record, { asAdmin } = {}) {
  const hasVideo = Boolean(record.storageFileId) && record.uploadStatus === 'ready'
  const base = {
    id: record.id,
    courseId: record.courseId,
    dayNumber: record.dayNumber,
    title: record.title,
    description: record.description,
    hasVideo,
    uploadStatus: record.uploadStatus,
    videoFilename: record.originalFilename,
    uploadedAt: record.updatedAt,
  }
  if (hasVideo) {
    base.videoUrl = asAdmin ? `/api/admin/classes/${record.id}/video` : `/api/student/classes/${record.id}/video`
  }
  return base
}

// ===================== ADMIN: manage classes =====================

router.get('/admin/courses/:courseId/classes', requireAdmin, (req, res) => {
  const db = readDB()
  const course = db.courses.find((c) => c.id === req.params.courseId)
  if (!course) return res.status(404).json({ error: 'Course not found.' })

  const classes = videoRepo.listByCourse(req.params.courseId)
  res.json({ classes: classes.map((c) => toPublicClass(c, { asAdmin: true })) })
})

router.post('/admin/courses/:courseId/classes', requireAdmin, (req, res) => {
  const db = readDB()
  const course = db.courses.find((c) => c.id === req.params.courseId)
  if (!course) return res.status(404).json({ error: 'Course not found.' })

  const { dayNumber, title, description } = req.body || {}
  if (!title?.trim()) {
    return res.status(400).json({ error: 'Title is required.' })
  }

  const record = videoRepo.create({
    courseId: course.id,
    title: title.trim(),
    dayNumber: Number(dayNumber) || videoRepo.listByCourse(course.id).length + 1,
    description: description || '',
  })
  res.status(201).json({ class: toPublicClass(record, { asAdmin: true }) })
})

router.put('/admin/classes/:classId', requireAdmin, (req, res) => {
  const { dayNumber, title, description } = req.body || {}
  const record = videoRepo.update(req.params.classId, {
    dayNumber: dayNumber !== undefined ? Number(dayNumber) : undefined,
    title: title?.trim() || undefined,
    description,
  })
  if (!record) return res.status(404).json({ error: 'Class not found.' })
  res.json({ class: toPublicClass(record, { asAdmin: true }) })
})

router.delete('/admin/classes/:classId', requireAdmin, async (req, res) => {
  const raw = videoRepo._findRaw(req.params.classId)
  if (!raw) return res.status(404).json({ error: 'Class not found.' })

  if (raw.storageFileId) {
    try {
      await getStorageService().deleteVideo(raw.storageFileId)
    } catch (err) {
      // Log and continue — we still want the class record removed even if
      // the remote file couldn't be deleted (e.g. provider unreachable).
      console.error('[CLASSES] Failed to delete video from storage:', err.message)
    }
  }
  videoRepo.remove(req.params.classId)
  res.json({ ok: true })
})

// ---------- Video upload / replace / delete ----------

router.post('/admin/courses/:courseId/classes/:classId/video', requireAdmin, (req, res) => {
  const db = readDB()
  const course = db.courses.find((c) => c.id === req.params.courseId)
  if (!course) return res.status(404).json({ error: 'Course not found.' })
  const existing = videoRepo._findRaw(req.params.classId)
  if (!existing || existing.courseId !== req.params.courseId) {
    return res.status(404).json({ error: 'Class not found for this course.' })
  }

  upload.single('video')(req, res, async (err) => {
    if (err) {
      const tooLarge = err.code === 'LIMIT_FILE_SIZE'
      return res.status(400).json({ error: tooLarge ? 'Video is too large.' : err.message || 'Upload failed.' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No video file was uploaded.' })
    }

    const oldFileId = existing.storageFileId

    try {
      const { provider, fileId } = await getStorageService().uploadVideo({
        courseName: course.title,
        dayNumber: existing.dayNumber,
        localFilePath: req.file.path,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
      })

      const record = videoRepo.setVideoMetadata(req.params.classId, {
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storageProvider: provider,
        storageFileId: fileId,
        uploadStatus: 'ready',
      })

      // Replacing an existing video — remove the old file now that the new
      // one is safely uploaded and recorded.
      if (oldFileId && oldFileId !== fileId) {
        getStorageService().deleteVideo(oldFileId).catch((e) =>
          console.error('[CLASSES] Failed to clean up replaced video:', e.message),
        )
      }

      res.json({ class: toPublicClass(record, { asAdmin: true }) })
    } catch (uploadErr) {
      console.error('[CLASSES] Video upload to storage failed:', uploadErr.message)
      videoRepo.setVideoMetadata(req.params.classId, {
        originalFilename: existing.videoFilename,
        mimeType: existing.videoMimeType,
        sizeBytes: existing.videoSize,
        storageProvider: existing.storageProvider,
        storageFileId: existing.storageFileId,
        uploadStatus: 'failed',
      })
      res.status(502).json({ error: 'Could not upload the video to storage. Please try again.' })
    } finally {
      cleanupTempFile(req.file.path)
    }
  })
})

router.delete('/admin/classes/:classId/video', requireAdmin, async (req, res) => {
  const raw = videoRepo._findRaw(req.params.classId)
  if (!raw) return res.status(404).json({ error: 'Class not found.' })

  if (raw.storageFileId) {
    try {
      await getStorageService().deleteVideo(raw.storageFileId)
    } catch (err) {
      console.error('[CLASSES] Failed to delete video from storage:', err.message)
    }
  }
  const record = videoRepo.clearVideo(req.params.classId)
  res.json({ class: toPublicClass(record, { asAdmin: true }) })
})

// Shared streaming handler for both admin preview and student viewing —
// the only difference between the two routes is which auth/authorization
// check runs first.
async function streamClassVideo(req, res, record) {
  if (!record?.storageFileId || record.uploadStatus !== 'ready') {
    return res.status(404).json({ error: 'No video uploaded for this class.' })
  }

  try {
    const { stream, status, headers } = await getStorageService().streamVideo(record.storageFileId, {
      range: req.headers.range,
    })
    res.status(status)
    Object.entries(headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value)
    })
    stream.on('error', (err) => {
      console.error('[CLASSES] Video stream error:', err.message)
      if (!res.headersSent) res.status(502).end()
      else res.end()
    })
    stream.pipe(res)
  } catch (err) {
    console.error('[CLASSES] Failed to stream video:', err.message)
    if (!res.headersSent) {
      res.status(502).json({ error: 'Could not load the video right now. Please try again.' })
    }
  }
}

// Admin preview — same authorization tier as the rest of /api/admin/*.
router.get('/admin/classes/:classId/video', requireAdmin, (req, res) => {
  const record = videoRepo._findRaw(req.params.classId)
  streamClassVideo(req, res, record)
})

// ===================== STUDENT: view permitted classes =====================

router.get('/student/courses/:courseId/classes', requireStudent, (req, res) => {
  const db = readDB()
  const student = db.students.find((s) => s.id === req.student.sub)
  if (!student) return res.status(401).json({ error: 'Not authenticated.' })

  const courseId = req.params.courseId
  if (!(student.courseIds || []).includes(courseId)) {
    return res.status(403).json({ error: 'You do not have access to this course.' })
  }
  const course = db.courses.find((c) => c.id === courseId)
  if (!course) return res.status(404).json({ error: 'Course not found.' })

  const classes = videoRepo.listByCourse(courseId)
  res.json({ classes: classes.map((c) => toPublicClass(c, { asAdmin: false })) })
})

// Protected video stream. Every check happens server-side — the frontend
// hiding a course from "My Courses" is never relied on for security.
router.get('/student/classes/:classId/video', requireStudent, (req, res) => {
  const db = readDB()
  const student = db.students.find((s) => s.id === req.student.sub)
  if (!student) return res.status(401).json({ error: 'Not authenticated.' })

  const record = videoRepo._findRaw(req.params.classId)
  if (!record) return res.status(403).json({ error: 'Not authorized.' })

  const course = db.courses.find((c) => c.id === record.courseId)
  if (!course) return res.status(403).json({ error: 'Not authorized.' })

  if (!(student.courseIds || []).includes(course.id)) {
    return res.status(403).json({ error: 'Not authorized.' })
  }

  streamClassVideo(req, res, record)
})

export default router
