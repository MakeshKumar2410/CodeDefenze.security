import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'

import authRoutes from './routes/auth.js'
import courseRoutes from './routes/courses.js'
import resourceRoutes from './routes/resources.js'
import testimonialRoutes from './routes/testimonials.js'
import enrollmentRoutes from './routes/enrollments.js'
import messageRoutes from './routes/messages.js'
import dashboardRoutes from './routes/dashboard.js'
import studentRoutes from './routes/students.js'
import classRoutes from './routes/classes.js'

const app = express()
const PORT = process.env.PORT || 5000

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    message: 'Codedefenze backend is running perfectly.',
    mode: 'api',
    to: process.env.TO_EMAIL || '(not set)',
    timestamp: new Date().toISOString(),
  })
})

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in before starting the server.')
  process.exit(1)
}

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

// Public form endpoints are the ones most likely to be spammed, since the
// old formsubmit.co integration had its captcha disabled. Rate-limit them.
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})
app.use('/api/contact', publicFormLimiter)
app.use('/api/enroll', publicFormLimiter)
app.use('/api/testimonials', (req, res, next) => (req.method === 'POST' ? publicFormLimiter(req, res, next) : next()))

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
})
app.use('/api/admin/login', loginLimiter)
app.use('/api/student/login', loginLimiter)

app.use('/api/admin', authRoutes)
app.use('/api', courseRoutes)
app.use('/api', resourceRoutes)
app.use('/api', testimonialRoutes)
app.use('/api', enrollmentRoutes)
app.use('/api', messageRoutes)
app.use('/api', dashboardRoutes)
app.use('/api', studentRoutes)
app.use('/api', classRoutes)

// NOTE: the uploads directory is intentionally NOT served with
// express.static — video files are only ever returned through the
// authenticated, authorization-checked routes in routes/classes.js.

app.listen(PORT, () => {
  console.log(`Codedefenze backend API running at http://localhost:${PORT}`)
  console.log(`Notification emails will be sent to: ${process.env.TO_EMAIL || '(not set)'}`)
  console.log('If no admin user exists yet, run: npm run seed:admin')
})
