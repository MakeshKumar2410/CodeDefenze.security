import jwt from 'jsonwebtoken'

const SESSION_COOKIE = 'cdz_admin_session'
const EXPIRES_IN = '8h'

export function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin.id, email: admin.email, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: EXPIRES_IN },
  )
}

export function verifyAdminToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE)
}

// ---------- Student sessions ----------
// Deliberately a separate cookie name from the admin session so an admin and
// a student can be logged in at the same time in the same browser (cookies
// are shared across ports on localhost during local dev).
const STUDENT_SESSION_COOKIE = 'cdz_student_session'
const STUDENT_EXPIRES_IN = '12h'

export function signStudentToken(student) {
  return jwt.sign(
    { sub: student.id, email: student.email, role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: STUDENT_EXPIRES_IN },
  )
}

export function verifyStudentToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET)
  if (payload.role !== 'student') {
    throw new Error('Not a student session.')
  }
  return payload
}

export function setStudentSessionCookie(res, token) {
  res.cookie(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 12 * 60 * 60 * 1000,
  })
}

export function clearStudentSessionCookie(res) {
  res.clearCookie(STUDENT_SESSION_COOKIE)
}

export { SESSION_COOKIE, STUDENT_SESSION_COOKIE }
