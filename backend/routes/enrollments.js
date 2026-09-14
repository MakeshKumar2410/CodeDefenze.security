import express from 'express'
import { readDB, writeDB, nextId } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'
import { sendEnrollmentEmail } from '../lib/email.js'
import { sendEnrollmentTelegram } from '../lib/telegram.js'

const router = express.Router()

// Public: submit an enrollment.
//   1. Save first — this alone determines success/failure for the visitor.
//   2. Email and Telegram fire independently afterward via
//      Promise.allSettled — either can fail without affecting the save,
//      the other notification, or the response.
router.post('/enroll', async (req, res) => {
  const { name, email, phone, college, course } = req.body || {}
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Name and email are required.' })
  }

  const db = readDB()
  const enrollment = {
    id: nextId('enroll'),
    name: name.trim(),
    email: email.trim(),
    phone: phone || '',
    college: college || '',
    course: course || db.courses[0]?.title || '',
    status: 'new',
    createdAt: new Date().toISOString(),
  }

  try {
    db.enrollments.unshift(enrollment)
    writeDB(db)
  } catch (err) {
    console.error(`[ENROLL] Failed to save submission:`, err.message)
    return res.status(500).json({ error: 'Could not save your enrollment. Please try again.' })
  }

  console.log(`[ENROLL] Submission ${enrollment.id} saved`)

  const [emailResult, telegramResult] = await Promise.allSettled([
    sendEnrollmentEmail(enrollment),
    sendEnrollmentTelegram(enrollment),
  ])

  if (emailResult.status === 'fulfilled') {
    console.log(`[EMAIL] Enrollment ${enrollment.id} sent successfully`)
  } else {
    console.error(`[EMAIL] Enrollment ${enrollment.id} failed:`, emailResult.reason?.message)
  }

  if (telegramResult.status === 'fulfilled') {
    console.log(`[TELEGRAM] Enrollment ${enrollment.id} sent successfully`)
  } else {
    console.error(`[TELEGRAM] Enrollment ${enrollment.id} failed:`, telegramResult.reason?.message)
  }

  res.status(201).json({ ok: true })
})

router.get('/admin/enrollments', requireAdmin, (_req, res) => {
  const db = readDB()
  res.json({ enrollments: db.enrollments })
})

router.patch('/admin/enrollments/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const enrollment = db.enrollments.find((e) => e.id === req.params.id)
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' })
  const { status } = req.body || {}
  if (status) enrollment.status = status
  writeDB(db)
  res.json({ enrollment })
})

router.delete('/admin/enrollments/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const before = db.enrollments.length
  db.enrollments = db.enrollments.filter((e) => e.id !== req.params.id)
  if (db.enrollments.length === before) {
    return res.status(404).json({ error: 'Enrollment not found.' })
  }
  writeDB(db)
  res.json({ ok: true })
})

export default router
