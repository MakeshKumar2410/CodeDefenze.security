import express from 'express'
import bcrypt from 'bcryptjs'
import { readDB } from '../db.js'
import { signAdminToken, setSessionCookie, clearSessionCookie } from '../lib/auth.js'
import requireAdmin from '../middleware/requireAdmin.js'

const router = express.Router()

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const db = readDB()
  const admin = db.admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const token = signAdminToken(admin)
  setSessionCookie(res, token)
  res.json({ ok: true, email: admin.email })
})

router.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.get('/me', requireAdmin, (req, res) => {
  res.json({ ok: true, email: req.admin.email })
})

export default router
