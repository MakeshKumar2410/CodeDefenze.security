import express from 'express'
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { readDB, writeDB, nextId } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'
import requireStudent from '../middleware/requireStudent.js'
import {
  courseVideoDir,
  resolveStoredVideoPath,
  deleteStoredVideo,
  streamVideoFile,
  safeFilename,
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_BYTES,
} from '../lib/videoStream.js'

const router = express.Router()

// ---------- Multer storage ----------
// courseId comes from the route (:courseId), classId is resolved from
// :classId once we look the class up, so filenames never depend on
// user-supplied input beyond the (sanitized) original filename.
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = courseVideoDir(req.params.courseId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename(req, file, cb) {
    const ext = ALLOWED_VIDEO_TYPES[file.mimetype] || path.extname(file.originalname) || ''
    const base = safeFilename(path.basename(file.originalname, path.extname(file.originalname)))
    cb(null, `${req.params.classId}-${base}${ext}`)
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

function sortByDay(classes) {
  return [...classes].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
}

// Never send the raw videoPath to a client — it's a server-internal detail.
// Clients get a stream URL instead.
function toPublicClass(cls, { asAdmin } = {}) {
  const base = {
    id: cls.id,
    courseId: cls.courseId,
    dayNumber: cls.dayNumber,
    title: cls.title,
    hasVideo: Boolean(cls.videoPath),
    videoFilename: cls.videoFilename || null,
    uploadedAt: cls.uploadedAt || null,
  }
  if (cls.videoPath) {
    base.videoUrl = asAdmin
      ? `/api/admin/classes/${cls.id}/video`
      : `/api/student/classes/${cls.id}/video`
  }
  return base
}

// ===================== ADMIN: manage classes =====================

router.get('/admin/courses/:courseId/classes', requireAdmin, (req, res) => {
  const db = readDB()
  const course = db.courses.find((c) => c.id === req.params.courseId)
  if (!course) return res.status(404).json({ error: 'Course not found.' })

  const classes = sortByDay(db.classes.filter((c) => c.courseId === req.params.courseId))
  res.json({ classes: classes.map((c) => toPublicClass(c, { asAdmin: true })) })
})

router.post('/admin/courses/:courseId/classes', requireAdmin, (req, res) => {
  const db = readDB()
  const course = db.courses.find((c) => c.id === req.params.courseId)
  if (!course) return res.status(404).json({ error: 'Course not found.' })

  const { dayNumber, title } = req.body || {}
  if (!title?.trim()) {
    return res.status(400).json({ error: 'Title is required.' })
  }

  const cls = {
    id: nextId('class'),
    courseId: course.id,
    dayNumber: Number(dayNumber) || db.classes.filter((c) => c.courseId === course.id).length + 1,
    title: title.trim(),
    videoPath: null,
    videoFilename: null,
    videoMimeType: null,
    videoSize: null,
    uploadedAt: null,
  }
  db.classes.push(cls)
  writeDB(db)
  res.status(201).json({ class: toPublicClass(cls, { asAdmin: true }) })
})

router.put('/admin/classes/:classId', requireAdmin, (req, res) => {
  const db = readDB()
  const cls = db.classes.find((c) => c.id === req.params.classId)
  if (!cls) return res.status(404).json({ error: 'Class not found.' })

  const { dayNumber, title } = req.body || {}
  if (dayNumber !== undefined) cls.dayNumber = Number(dayNumber) || cls.dayNumber
  if (title !== undefined && title.trim()) cls.title = title.trim()

  writeDB(db)
  res.json({ class: toPublicClass(cls, { asAdmin: true }) })
})

router.delete('/admin/classes/:classId', requireAdmin, (req, res) => {
  const db = readDB()
  const cls = db.classes.find((c) => c.id === req.params.classId)
  if (!cls) return res.status(404).json({ error: 'Class not found.' })

  if (cls.videoPath) deleteStoredVideo(cls.videoPath)
  db.classes = db.classes.filter((c) => c.id !== req.params.classId)
  writeDB(db)
  res.json({ ok: true })
})

// ---------- Video upload / replace / delete ----------

router.post('/admin/courses/:courseId/classes/:classId/video', requireAdmin, (req, res) => {
  const db = readDB()
  const course = db.courses.find((c) => c.id === req.params.courseId)
  if (!course) return res.status(404).json({ error: 'Course not found.' })
  const cls = db.classes.find((c) => c.id === req.params.classId && c.courseId === req.params.courseId)
  if (!cls) return res.status(404).json({ error: 'Class not found for this course.' })

  upload.single('video')(req, res, (err) => {
    if (err) {
      const tooLarge = err.code === 'LIMIT_FILE_SIZE'
      return res.status(400).json({
        error: tooLarge ? 'Video is too large.' : err.message || 'Upload failed.',
      })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No video file was uploaded.' })
    }

    // Re-read the DB now that the (potentially slow) upload has finished, so
    // we don't clobber any other change made while the upload was in flight.
    const freshDb = readDB()
    const freshCls = freshDb.classes.find((c) => c.id === req.params.classId)
    if (!freshCls) return res.status(404).json({ error: 'Class not found.' })

    const oldVideoPath = freshCls.videoPath
    const relPath = path.join('videos', course.id, req.file.filename)

    freshCls.videoPath = relPath
    freshCls.videoFilename = req.file.originalname
    freshCls.videoMimeType = req.file.mimetype
    freshCls.videoSize = req.file.size
    freshCls.uploadedAt = new Date().toISOString()
    writeDB(freshDb)

    // Replacing an existing video: remove the old file now that the new one
    // is safely saved and recorded.
    if (oldVideoPath && oldVideoPath !== relPath) deleteStoredVideo(oldVideoPath)

    res.json({ class: toPublicClass(freshCls, { asAdmin: true }) })
  })
})

router.delete('/admin/classes/:classId/video', requireAdmin, (req, res) => {
  const db = readDB()
  const cls = db.classes.find((c) => c.id === req.params.classId)
  if (!cls) return res.status(404).json({ error: 'Class not found.' })

  if (cls.videoPath) deleteStoredVideo(cls.videoPath)
  cls.videoPath = null
  cls.videoFilename = null
  cls.videoMimeType = null
  cls.videoSize = null
  cls.uploadedAt = null

  writeDB(db)
  res.json({ class: toPublicClass(cls, { asAdmin: true }) })
})

// Admin preview — same authorization tier as the rest of /api/admin/*.
router.get('/admin/classes/:classId/video', requireAdmin, (req, res) => {
  const db = readDB()
  const cls = db.classes.find((c) => c.id === req.params.classId)
  if (!cls || !cls.videoPath) return res.status(404).json({ error: 'No video uploaded for this class.' })

  const abs = resolveStoredVideoPath(cls.videoPath)
  if (!abs) return res.status(400).json({ error: 'Invalid video reference.' })
  streamVideoFile(req, res, abs, cls.videoMimeType)
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

  const classes = sortByDay(db.classes.filter((c) => c.courseId === courseId))
  res.json({ classes: classes.map((c) => toPublicClass(c, { asAdmin: false })) })
})

// Protected video stream. Every check happens server-side — the frontend
// hiding a course from "My Courses" is never relied on for security.
router.get('/student/classes/:classId/video', requireStudent, (req, res) => {
  const db = readDB()
  const student = db.students.find((s) => s.id === req.student.sub)
  if (!student) return res.status(401).json({ error: 'Not authenticated.' })

  const cls = db.classes.find((c) => c.id === req.params.classId)
  if (!cls) return res.status(403).json({ error: 'Not authorized.' })

  const course = db.courses.find((c) => c.id === cls.courseId)
  if (!course) return res.status(403).json({ error: 'Not authorized.' })

  if (!(student.courseIds || []).includes(course.id)) {
    return res.status(403).json({ error: 'Not authorized.' })
  }
  if (!cls.videoPath) return res.status(404).json({ error: 'No video uploaded for this class.' })

  const abs = resolveStoredVideoPath(cls.videoPath)
  if (!abs) return res.status(400).json({ error: 'Invalid video reference.' })
  streamVideoFile(req, res, abs, cls.videoMimeType)
})

export default router
