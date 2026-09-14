import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// backend/uploads/videos/<courseId>/<classId>-<safe-filename>
export const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads')
export const VIDEOS_ROOT = path.join(UPLOADS_ROOT, 'videos')

export const ALLOWED_VIDEO_TYPES = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov', // .mov, "if practical"
}

export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024 // 1GB — generous for a recorded class

// Strips anything that isn't safe for a filename: no path separators, no
// traversal sequences, no characters that could confuse the filesystem.
export function safeFilename(originalName = 'video') {
  const base = path.basename(String(originalName)).trim() || 'video'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned.slice(-150) || 'video'
}

export function courseVideoDir(courseId) {
  return path.join(VIDEOS_ROOT, path.basename(String(courseId)))
}

// Resolves a stored logical videoPath (e.g. "videos/course-1/class-1-x.mp4")
// back to an absolute path, refusing anything that would escape UPLOADS_ROOT.
export function resolveStoredVideoPath(videoPath) {
  if (!videoPath) return null
  const abs = path.join(UPLOADS_ROOT, videoPath)
  const normalizedRoot = path.normalize(UPLOADS_ROOT + path.sep)
  const normalizedAbs = path.normalize(abs)
  if (!normalizedAbs.startsWith(normalizedRoot)) return null // path traversal attempt
  return normalizedAbs
}

export function deleteStoredVideo(videoPath) {
  const abs = resolveStoredVideoPath(videoPath)
  if (!abs) return
  fs.unlink(abs, () => {}) // best-effort; missing file is fine
}

// Streams a video file to `res`, honoring Range requests so the HTML5 video
// player can seek/scrub instead of downloading the whole file up front.
export function streamVideoFile(req, res, absPath, mimeType) {
  let stat
  try {
    stat = fs.statSync(absPath)
  } catch {
    return res.status(404).json({ error: 'Video file not found.' })
  }

  const range = req.headers.range
  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Content-Type', mimeType || 'application/octet-stream')

  if (!range) {
    res.setHeader('Content-Length', stat.size)
    fs.createReadStream(absPath).pipe(res)
    return
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range)
  let start = match?.[1] ? parseInt(match[1], 10) : 0
  let end = match?.[2] ? parseInt(match[2], 10) : stat.size - 1
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= stat.size) {
    res.setHeader('Content-Range', `bytes */${stat.size}`)
    return res.status(416).end()
  }

  res.status(206)
  res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`)
  res.setHeader('Content-Length', end - start + 1)
  fs.createReadStream(absPath, { start, end }).pipe(res)
}
