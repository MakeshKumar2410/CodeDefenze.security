import express from 'express'
import { readDB, writeDB, nextId } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'
import { sendNotificationEmail } from '../lib/email.js'

const router = express.Router()

router.get('/health', (_req, res) => {
  res.json({ ok: true, to: process.env.TO_EMAIL, mode: 'formsubmit' })
})

// Public: contact form. Now stored in the database (the old version only emailed it).
router.post('/contact', async (req, res) => {
  const { name, email, phone, message } = req.body || {}
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Name and email are required.' })
  }

  const db = readDB()
  const entry = {
    id: nextId('msg'),
    name: name.trim(),
    email: email.trim(),
    phone: phone || '',
    message: message || '',
    read: false,
    createdAt: new Date().toISOString(),
  }
  db.messages.unshift(entry)
  writeDB(db)

  try {
    await sendNotificationEmail({
      subject: `[Codedefenze] Contact Form — ${entry.name}`,
      payload: {
        name: entry.name,
        email: entry.email,
        phone: entry.phone || '—',
        message: entry.message || '—',
      },
    })
    res.json({
      ok: true,
      message: 'Email sent successfully',
      note: 'If this is the first time, check your inbox and confirm FormSubmit activation.',
    })
  } catch (err) {
    console.error('Contact email failed:', err.message)
    // The message is already saved, so we still tell the visitor it went through —
    // an admin will see it in the dashboard even if the email notification failed.
    res.json({
      ok: true,
      message: 'Message received',
      note: 'Your message was saved. Email notification may be delayed.',
    })
  }
})

router.get('/admin/messages', requireAdmin, (_req, res) => {
  const db = readDB()
  res.json({ messages: db.messages })
})

router.patch('/admin/messages/:id/read', requireAdmin, (req, res) => {
  const db = readDB()
  const entry = db.messages.find((m) => m.id === req.params.id)
  if (!entry) return res.status(404).json({ error: 'Message not found.' })
  entry.read = true
  writeDB(db)
  res.json({ message: entry })
})

router.delete('/admin/messages/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const before = db.messages.length
  db.messages = db.messages.filter((m) => m.id !== req.params.id)
  if (db.messages.length === before) {
    return res.status(404).json({ error: 'Message not found.' })
  }
  writeDB(db)
  res.json({ ok: true })
})

export default router
