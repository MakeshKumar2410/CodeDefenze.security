import express from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'
import requireAdmin from '../middleware/requireAdmin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Separate from the video uploads folder on purpose: video files are only
// ever served through authenticated, authorization-checked routes
// (routes/classes.js), but CMS images (hero backgrounds, trainer photos,
// etc.) are meant to be publicly visible on the site, so they live in
// their own folder that IS served statically — see server.js.
export const IMAGES_ROOT = path.join(__dirname, '..', 'uploads', 'images')

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB

function safeFilename(originalName = 'image') {
  const base = path.basename(String(originalName)).trim() || 'image'
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'image'
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(IMAGES_ROOT, { recursive: true })
    cb(null, IMAGES_ROOT)
  },
  filename(_req, file, cb) {
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype] || path.extname(file.originalname) || ''
    const base = safeFilename(path.basename(file.originalname, path.extname(file.originalname)))
    cb(null, `${Date.now()}-${base}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
      return cb(new Error('Unsupported file type. Please upload JPG, PNG, WEBP, or GIF.'))
    }
    cb(null, true)
  },
})

const router = express.Router()

router.post('/admin/uploads/image', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const tooLarge = err.code === 'LIMIT_FILE_SIZE'
      return res.status(400).json({ error: tooLarge ? 'Image is too large (max 5MB).' : err.message || 'Upload failed.' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file was uploaded.' })
    }
    res.status(201).json({ url: `/uploads/images/${req.file.filename}` })
  })
})

export default router
