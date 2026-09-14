import express from 'express'
import { readDB, writeDB, nextId } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'
import { sendContactEmail } from '../lib/email.js'
import { sendContactTelegram } from '../lib/telegram.js'

const router = express.Router()

router.get('/health', (_req, res) => {
  res.json({ ok: true, to: process.env.TO_EMAIL, mode: 'resend' })
})

// Public: contact form.
//   1. Save first — this is the only thing that determines success/failure
//      for the visitor.
//   2. Email and Telegram fire independently afterward. Either, both, or
//      neither can fail without affecting the save or the response.
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

  try {
    db.messages.unshift(entry)
    writeDB(db)
  } catch (err) {
    console.error(`[CONTACT] Failed to save submission:`, err.message)
    return res.status(500).json({ error: 'Could not save your message. Please try again.' })
  }

  console.log(`[CONTACT] Submission ${entry.id} saved`)

  // Both notifications are attempted before responding, but via
  // Promise.allSettled — neither one's outcome affects the other, and
  // neither can affect the response below, which only ever reflects
  // whether the save succeeded.
  const [emailResult, telegramResult] = await Promise.allSettled([
    sendContactEmail(entry),
    sendContactTelegram(entry),
  ])

  if (emailResult.status === 'fulfilled') {
    console.log(`[EMAIL] Contact ${entry.id} sent successfully`)
  } else {
    console.error(`[EMAIL] Contact ${entry.id} failed:`, emailResult.reason?.message)
  }

  if (telegramResult.status === 'fulfilled') {
    console.log(`[TELEGRAM] Contact ${entry.id} sent successfully`)
  } else {
    console.error(`[TELEGRAM] Contact ${entry.id} failed:`, telegramResult.reason?.message)
  }

  res.status(201).json({ ok: true, message: 'Message received.' })
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
