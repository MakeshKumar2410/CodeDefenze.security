import express from 'express'
import { readDB } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'

const router = express.Router()

router.get('/admin/dashboard-stats', requireAdmin, (_req, res) => {
  const db = readDB()
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  const newThisWeek = db.enrollments.filter(
    (e) => new Date(e.createdAt).getTime() >= oneWeekAgo,
  ).length

  res.json({
    totalEnrollments: db.enrollments.length,
    newEnrollmentsThisWeek: newThisWeek,
    unreadMessages: db.messages.filter((m) => !m.read).length,
    totalTestimonials: db.testimonials.length,
  })
})

// Weekly report: everything that happened in the last 7 days, in one payload
// the admin panel turns into a downloadable CSV.
router.get('/admin/reports/weekly', requireAdmin, (_req, res) => {
  const db = readDB()
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const inWindow = (iso) => new Date(iso).getTime() >= oneWeekAgo

  const enrollments = db.enrollments.filter((e) => inWindow(e.createdAt))
  const messages = db.messages.filter((m) => inWindow(m.createdAt))
  const testimonials = db.testimonials.filter((t) => inWindow(t.createdAt))

  const statusCounts = enrollments.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1
    return acc
  }, {})

  res.json({
    generatedAt: new Date().toISOString(),
    windowDays: 7,
    summary: {
      newEnrollments: enrollments.length,
      newMessages: messages.length,
      newTestimonials: testimonials.length,
      enrollmentStatusCounts: statusCounts,
    },
    enrollments,
    messages: messages.map((m) => ({ ...m, message: m.message?.slice(0, 200) })),
    testimonials,
  })
})

export default router
