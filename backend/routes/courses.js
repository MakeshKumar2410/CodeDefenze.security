import express from 'express'
import { readDB, writeDB, nextId } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'

const router = express.Router()

// Public: only published courses
router.get('/courses', (_req, res) => {
  const db = readDB()
  res.json({ courses: db.courses.filter((c) => c.published) })
})

// Admin: all courses
router.get('/admin/courses', requireAdmin, (_req, res) => {
  const db = readDB()
  res.json({ courses: db.courses })
})

router.post('/admin/courses', requireAdmin, (req, res) => {
  const { title, description, duration, fee, mode, syllabus, learnings, published } = req.body || {}
  if (!title?.trim()) {
    return res.status(400).json({ error: 'Title is required.' })
  }
  const db = readDB()
  const course = {
    id: nextId('course'),
    title: title.trim(),
    description: description || '',
    duration: duration || '',
    fee: fee || '',
    mode: mode || '',
    syllabus: Array.isArray(syllabus) ? syllabus : [],
    learnings: Array.isArray(learnings) ? learnings : [],
    published: Boolean(published),
  }
  db.courses.push(course)
  writeDB(db)
  res.status(201).json({ course })
})

router.put('/admin/courses/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const course = db.courses.find((c) => c.id === req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found.' })

  const { title, description, duration, fee, mode, syllabus, learnings, published } = req.body || {}
  if (title !== undefined) course.title = title
  if (description !== undefined) course.description = description
  if (duration !== undefined) course.duration = duration
  if (fee !== undefined) course.fee = fee
  if (mode !== undefined) course.mode = mode
  if (Array.isArray(syllabus)) course.syllabus = syllabus
  if (Array.isArray(learnings)) course.learnings = learnings
  if (published !== undefined) course.published = Boolean(published)

  writeDB(db)
  res.json({ course })
})

router.delete('/admin/courses/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const before = db.courses.length
  db.courses = db.courses.filter((c) => c.id !== req.params.id)
  if (db.courses.length === before) {
    return res.status(404).json({ error: 'Course not found.' })
  }
  writeDB(db)
  res.json({ ok: true })
})

export default router
