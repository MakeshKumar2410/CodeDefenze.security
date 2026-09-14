import { verifyAdminToken, SESSION_COOKIE } from '../lib/auth.js'

/**
 * Protects every /api/admin/* route. Replaces the old fake client-side
 * PIN check (which anyone could bypass via localStorage in dev tools).
 */
export default function requireAdmin(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }
  try {
    req.admin = verifyAdminToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' })
  }
}
