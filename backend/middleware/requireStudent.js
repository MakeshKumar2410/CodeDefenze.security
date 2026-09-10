import { verifyStudentToken, STUDENT_SESSION_COOKIE } from '../lib/auth.js'

/**
 * Protects every /api/student/* route that requires a logged-in student.
 * Mirrors requireAdmin.js but reads the separate student session cookie, so
 * an admin session in the same browser never accidentally grants student
 * access (or vice versa).
 */
export default function requireStudent(req, res, next) {
  const token = req.cookies?.[STUDENT_SESSION_COOKIE]
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }
  try {
    req.student = verifyStudentToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' })
  }
}
