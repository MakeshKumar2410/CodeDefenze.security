import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { readDB, writeDB, nextId } from '../db.js'

const email = process.env.ADMIN_SEED_EMAIL
const password = process.env.ADMIN_SEED_PASSWORD

if (!email || !password) {
  console.error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in your .env file.')
  process.exit(1)
}

const db = readDB()
const passwordHash = bcrypt.hashSync(password, 10)
const existing = db.admins.find((a) => a.email.toLowerCase() === email.toLowerCase())

if (existing) {
  existing.passwordHash = passwordHash
  console.log(`Updated password for existing admin: ${email}`)
} else {
  db.admins.push({ id: nextId('admin'), email, passwordHash })
  console.log(`Created new admin: ${email}`)
}

writeDB(db)
console.log('Done. You can now log in to the admin panel with this email and password.')
