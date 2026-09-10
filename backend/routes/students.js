import express from 'express'
import bcrypt from 'bcryptjs'
import { readDB, writeDB, nextId } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'
import requireStudent from '../middleware/requireStudent.js'
import {
  signStudentToken,
  setStudentSessionCookie,
  clearStudentSessionCookie,
} from '../lib/auth.js'

const router = express.Router()

function toPublicStudent(s) {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    courseIds: s.courseIds || [],
    createdAt: s.createdAt,
  }
}

// ===================== Student-facing auth =====================

router.post('/student/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const db = readDB()
  const student = db.students.find((s) => s.email.toLowerCase() === email.trim().toLowerCase())
  if (!student || !bcrypt.compareSync(password, student.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const token = signStudentToken(student)
  setStudentSessionCookie(res, token)
  res.json({ ok: true, name: student.name, email: student.email })
})

router.post('/student/logout', (_req, res) => {
  clearStudentSessionCookie(res)
  res.json({ ok: true })
})

router.get('/student/me', requireStudent, (req, res) => {
  const db = readDB()
  const student = db.students.find((s) => s.id === req.student.sub)
  if (!student) return res.status(401).json({ error: 'Not authenticated.' })
  res.json({ ok: true, name: student.name, email: student.email })
})

// My Courses — only the courses this student has been explicitly granted.
router.get('/student/my-courses', requireStudent, (req, res) => {
  const db = readDB()
  const student = db.students.find((s) => s.id === req.student.sub)
  if (!student) return res.status(401).json({ error: 'Not authenticated.' })

  const courseIds = new Set(student.courseIds || [])
  const courses = db.courses
    .filter((c) => courseIds.has(c.id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      duration: c.duration,
      fee: c.fee,
      mode: c.mode,
    }))
  res.json({ courses })
})

// ===================== Admin: manage student accounts & access =====================

router.get('/admin/students', requireAdmin, (_req, res) => {
  const db = readDB()
  res.json({ students: db.students.map(toPublicStudent) })
})

router.post('/admin/students', requireAdmin, (req, res) => {
  const { name, email, password, courseIds } = req.body || {}
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' })
  }

  const db = readDB()
  const exists = db.students.some((s) => s.email.toLowerCase() === email.trim().toLowerCase())
  if (exists) {
    return res.status(409).json({ error: 'A student with this email already exists.' })
  }

  const student = {
    id: nextId('student'),
    name: name.trim(),
    email: email.trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    courseIds: Array.isArray(courseIds) ? courseIds : [],
    createdAt: new Date().toISOString(),
  }
  db.students.push(student)
  writeDB(db)
  res.status(201).json({ student: toPublicStudent(student) })
})

router.put('/admin/students/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const student = db.students.find((s) => s.id === req.params.id)
  if (!student) return res.status(404).json({ error: 'Student not found.' })

  const { name, email, password, courseIds } = req.body || {}
  if (name !== undefined && name.trim()) student.name = name.trim()
  if (email !== undefined && email.trim()) student.email = email.trim()
  if (password) student.passwordHash = bcrypt.hashSync(password, 10)
  if (Array.isArray(courseIds)) student.courseIds = courseIds

  writeDB(db)
  res.json({ student: toPublicStudent(student) })
})

// Convenience endpoint for the admin UI's per-course checkbox toggles —
// grants or revokes a single course without resending the whole list.
router.patch('/admin/students/:id/access', requireAdmin, (req, res) => {
  const db = readDB()
  const student = db.students.find((s) => s.id === req.params.id)
  if (!student) return res.status(404).json({ error: 'Student not found.' })

  const { courseId, grant } = req.body || {}
  if (!courseId) return res.status(400).json({ error: 'courseId is required.' })

  const current = new Set(student.courseIds || [])
  if (grant) current.add(courseId)
  else current.delete(courseId)
  student.courseIds = [...current]

  writeDB(db)
  res.json({ student: toPublicStudent(student) })
})

router.delete('/admin/students/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const before = db.students.length
  db.students = db.students.filter((s) => s.id !== req.params.id)
  if (db.students.length === before) {
    return res.status(404).json({ error: 'Student not found.' })
  }
  writeDB(db)
  res.json({ ok: true })
})

export default router
