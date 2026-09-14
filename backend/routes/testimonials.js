import express from 'express'
import { readDB, writeDB, nextId } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'

const router = express.Router()

// Public: only approved testimonials
router.get('/testimonials', (_req, res) => {
  const db = readDB()
  res.json({ testimonials: db.testimonials.filter((t) => t.approved) })
})

// Public: submit a review — goes live immediately. (Previously this required
// admin approval; that step has been removed per request — admins can still
// edit or delete any review from the admin panel.)
router.post('/testimonials', (req, res) => {
  const { name, college, course, review } = req.body || {}
  if (!name?.trim() || !review?.trim()) {
    return res.status(400).json({ error: 'Name and review are required.' })
  }
  const db = readDB()
  const testimonial = {
    id: nextId('test'),
    name: name.trim(),
    college: college?.trim() || 'Student',
    course: course || db.courses[0]?.title || '',
    review: review.trim(),
    approved: true,
    createdAt: new Date().toISOString(),
  }
  db.testimonials.unshift(testimonial)
  writeDB(db)
  res.status(201).json({ ok: true })
})

// Admin: full list
router.get('/admin/testimonials', requireAdmin, (_req, res) => {
  const db = readDB()
  res.json({ testimonials: db.testimonials })
})

router.put('/admin/testimonials/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const testimonial = db.testimonials.find((t) => t.id === req.params.id)
  if (!testimonial) return res.status(404).json({ error: 'Testimonial not found.' })

  const { name, college, course, review } = req.body || {}
  if (name !== undefined) testimonial.name = name
  if (college !== undefined) testimonial.college = college
  if (course !== undefined) testimonial.course = course
  if (review !== undefined) testimonial.review = review

  writeDB(db)
  res.json({ testimonial })
})

router.delete('/admin/testimonials/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const before = db.testimonials.length
  db.testimonials = db.testimonials.filter((t) => t.id !== req.params.id)
  if (db.testimonials.length === before) {
    return res.status(404).json({ error: 'Testimonial not found.' })
  }
  writeDB(db)
  res.json({ ok: true })
})

export default router
