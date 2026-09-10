import express from 'express'
import { readDB, writeDB, nextId } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'

const router = express.Router()

router.get('/resources', (_req, res) => {
  const db = readDB()
  res.json({ resources: db.resources })
})

router.get('/admin/resources', requireAdmin, (_req, res) => {
  const db = readDB()
  res.json({ resources: db.resources })
})

router.post('/admin/resources', requireAdmin, (req, res) => {
  const { type, tag, title, href } = req.body || {}
  if (!title?.trim() || !type?.trim()) {
    return res.status(400).json({ error: 'Type and title are required.' })
  }
  const db = readDB()
  const resource = {
    id: nextId('res'),
    type: type.trim(),
    tag: tag || type.toUpperCase(),
    title: title.trim(),
    href: href || '#',
  }
  db.resources.push(resource)
  writeDB(db)
  res.status(201).json({ resource })
})

router.put('/admin/resources/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const resource = db.resources.find((r) => r.id === req.params.id)
  if (!resource) return res.status(404).json({ error: 'Resource not found.' })

  const { type, tag, title, href } = req.body || {}
  if (type !== undefined) resource.type = type
  if (tag !== undefined) resource.tag = tag
  if (title !== undefined) resource.title = title
  if (href !== undefined) resource.href = href

  writeDB(db)
  res.json({ resource })
})

router.delete('/admin/resources/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const before = db.resources.length
  db.resources = db.resources.filter((r) => r.id !== req.params.id)
  if (db.resources.length === before) {
    return res.status(404).json({ error: 'Resource not found.' })
  }
  writeDB(db)
  res.json({ ok: true })
})

export default router
