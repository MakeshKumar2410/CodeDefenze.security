import express from 'express'
import { readDB, writeDB, nextId } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'
import { sendNotificationEmail } from '../lib/email.js'

const router = express.Router()

// Public: submit an enrollment. Now actually stored in the database (the old
// version only emailed it — there was no record anywhere you could look up).
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
  db.enrollments.unshift(enrollment)
  writeDB(db)

  try {
    await sendNotificationEmail({
      subject: `[Codedefenze] New Enrollment — ${enrollment.name}`,
      payload: {
        name: enrollment.name,
        email: enrollment.email,
        phone: enrollment.phone || '—',
        college: enrollment.college || '—',
        course: enrollment.course || '—',
        message: `Enrollment request from ${enrollment.name}`,
      },
    })
  } catch (err) {
    // The enrollment is already saved in the database even if the email fails,
    // so nothing is lost — just log it for now.
    console.error('Enrollment email failed:', err.message)
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
