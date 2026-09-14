import express from 'express'
import { readDB, writeDB, nextId, reorderList } from '../db.js'
import requireAdmin from '../middleware/requireAdmin.js'

const router = express.Router()

function activeSorted(list) {
  return [...(list || [])]
    .filter((item) => item.active)
    .sort((a, b) => a.order - b.order)
}
function allSorted(list) {
  return [...(list || [])].sort((a, b) => a.order - b.order)
}

// ==================== PUBLIC ====================

router.get('/home', (_req, res) => {
  const db = readDB()
  const hp = db.homePage
  res.json({
    hero: hp.hero,
    highlights: activeSorted(hp.highlights),
    whyUs: activeSorted(hp.whyUs),
    faqs: activeSorted(hp.faqs),
    certificatePreview: hp.certificatePreview,
  })
})

router.get('/about', (_req, res) => {
  const db = readDB()
  const ap = db.aboutPage
  res.json({
    intro: ap.intro,
    sections: activeSorted(ap.sections),
    trainers: activeSorted(ap.trainers),
  })
})

// ==================== ADMIN: HOME PAGE ====================

router.get('/admin/home', requireAdmin, (_req, res) => {
  const db = readDB()
  const hp = db.homePage
  res.json({
    hero: hp.hero,
    highlights: allSorted(hp.highlights),
    whyUs: allSorted(hp.whyUs),
    faqs: allSorted(hp.faqs),
    certificatePreview: hp.certificatePreview,
  })
})

router.put('/admin/home/hero', requireAdmin, (req, res) => {
  const { eyebrow, headline, subtext, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink, stats } = req.body || {}
  if (!headline?.trim()) return res.status(400).json({ error: 'Headline is required.' })

  const db = readDB()
  db.homePage.hero = {
    eyebrow: eyebrow || '',
    headline: headline.trim(),
    subtext: subtext || '',
    ctaText: ctaText || '',
    ctaLink: ctaLink || '',
    secondaryCtaText: secondaryCtaText || '',
    secondaryCtaLink: secondaryCtaLink || '',
    stats: Array.isArray(stats) ? stats : db.homePage.hero.stats,
  }
  writeDB(db)
  res.json({ hero: db.homePage.hero })
})

router.put('/admin/home/certificate-preview', requireAdmin, (req, res) => {
  const { enabled, heading, description, buttonText, buttonLink, image } = req.body || {}
  const db = readDB()
  db.homePage.certificatePreview = {
    enabled: Boolean(enabled),
    heading: heading || '',
    description: description || '',
    buttonText: buttonText || '',
    buttonLink: buttonLink || '',
    image: image || '',
  }
  writeDB(db)
  res.json({ certificatePreview: db.homePage.certificatePreview })
})

// ---- Generic CRUD + reorder + toggle factory for the three Home lists ----
// (highlights, whyUs, faqs) — all three follow the identical shape of
// operations, so one factory avoids writing the same code three times.
function registerListRoutes({ key, basePath, buildItem, patchItem }) {
  router.post(`/admin/home/${basePath}`, requireAdmin, (req, res) => {
    const db = readDB()
    const list = db.homePage[key]
    const item = buildItem(req.body || {}, list.length + 1)
    if (item.error) return res.status(400).json({ error: item.error })
    list.push(item)
    writeDB(db)
    res.status(201).json({ item })
  })

  router.put(`/admin/home/${basePath}/:id`, requireAdmin, (req, res) => {
    const db = readDB()
    const list = db.homePage[key]
    const item = list.find((i) => i.id === req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found.' })
    patchItem(item, req.body || {})
    writeDB(db)
    res.json({ item })
  })

  router.delete(`/admin/home/${basePath}/:id`, requireAdmin, (req, res) => {
    const db = readDB()
    const before = db.homePage[key].length
    db.homePage[key] = db.homePage[key].filter((i) => i.id !== req.params.id)
    if (db.homePage[key].length === before) return res.status(404).json({ error: 'Not found.' })
    writeDB(db)
    res.json({ ok: true })
  })

  router.patch(`/admin/home/${basePath}/:id/toggle`, requireAdmin, (req, res) => {
    const db = readDB()
    const item = db.homePage[key].find((i) => i.id === req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found.' })
    item.active = !item.active
    writeDB(db)
    res.json({ item })
  })

  router.patch(`/admin/home/${basePath}/:id/move`, requireAdmin, (req, res) => {
    const db = readDB()
    const { direction } = req.body || {}
    db.homePage[key] = reorderList(db.homePage[key], req.params.id, direction)
    writeDB(db)
    res.json({ items: allSorted(db.homePage[key]) })
  })
}

registerListRoutes({
  key: 'highlights',
  basePath: 'highlights',
  buildItem: (body, nextOrder) => {
    if (!body.title?.trim()) return { error: 'Title is required.' }
    return {
      id: nextId('highlight'),
      order: nextOrder,
      active: true,
      icon: body.icon || 'infra',
      title: body.title.trim(),
      text: body.text || '',
      buttonText: body.buttonText || '',
      buttonLink: body.buttonLink || '',
    }
  },
  patchItem: (item, body) => {
    if (body.icon !== undefined) item.icon = body.icon
    if (body.title !== undefined) item.title = body.title
    if (body.text !== undefined) item.text = body.text
    if (body.buttonText !== undefined) item.buttonText = body.buttonText
    if (body.buttonLink !== undefined) item.buttonLink = body.buttonLink
  },
})

registerListRoutes({
  key: 'whyUs',
  basePath: 'why-us',
  buildItem: (body, nextOrder) => {
    if (!body.title?.trim()) return { error: 'Title is required.' }
    return { id: nextId('why'), order: nextOrder, active: true, title: body.title.trim(), text: body.text || '' }
  },
  patchItem: (item, body) => {
    if (body.title !== undefined) item.title = body.title
    if (body.text !== undefined) item.text = body.text
  },
})

registerListRoutes({
  key: 'faqs',
  basePath: 'faqs',
  buildItem: (body, nextOrder) => {
    if (!body.question?.trim()) return { error: 'Question is required.' }
    return { id: nextId('faq'), order: nextOrder, active: true, question: body.question.trim(), answer: body.answer || '' }
  },
  patchItem: (item, body) => {
    if (body.question !== undefined) item.question = body.question
    if (body.answer !== undefined) item.answer = body.answer
  },
})

// ==================== ADMIN: ABOUT PAGE ====================

router.get('/admin/about', requireAdmin, (_req, res) => {
  const db = readDB()
  const ap = db.aboutPage
  res.json({ intro: ap.intro, sections: allSorted(ap.sections), trainers: allSorted(ap.trainers) })
})

router.put('/admin/about/intro', requireAdmin, (req, res) => {
  const { heading, description, missionTitle, missionText, visionTitle, visionText } = req.body || {}
  const db = readDB()
  db.aboutPage.intro = {
    heading: heading || '',
    description: description || '',
    missionTitle: missionTitle || '',
    missionText: missionText || '',
    visionTitle: visionTitle || '',
    visionText: visionText || '',
  }
  writeDB(db)
  res.json({ intro: db.aboutPage.intro })
})

// ---- About sections (freeform, addable/removable) ----

router.post('/admin/about/sections', requireAdmin, (req, res) => {
  const { title, subtitle, description, image, buttonText, buttonLink } = req.body || {}
  if (!title?.trim()) return res.status(400).json({ error: 'Section title is required.' })
  const db = readDB()
  const section = {
    id: nextId('section'),
    order: db.aboutPage.sections.length + 1,
    active: true,
    title: title.trim(),
    subtitle: subtitle || '',
    description: description || '',
    image: image || '',
    buttonText: buttonText || '',
    buttonLink: buttonLink || '',
  }
  db.aboutPage.sections.push(section)
  writeDB(db)
  res.status(201).json({ section })
})

router.put('/admin/about/sections/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const section = db.aboutPage.sections.find((s) => s.id === req.params.id)
  if (!section) return res.status(404).json({ error: 'Section not found.' })
  const { title, subtitle, description, image, buttonText, buttonLink } = req.body || {}
  if (title !== undefined) section.title = title
  if (subtitle !== undefined) section.subtitle = subtitle
  if (description !== undefined) section.description = description
  if (image !== undefined) section.image = image
  if (buttonText !== undefined) section.buttonText = buttonText
  if (buttonLink !== undefined) section.buttonLink = buttonLink
  writeDB(db)
  res.json({ section })
})

router.delete('/admin/about/sections/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const before = db.aboutPage.sections.length
  db.aboutPage.sections = db.aboutPage.sections.filter((s) => s.id !== req.params.id)
  if (db.aboutPage.sections.length === before) return res.status(404).json({ error: 'Section not found.' })
  writeDB(db)
  res.json({ ok: true })
})

router.patch('/admin/about/sections/:id/toggle', requireAdmin, (req, res) => {
  const db = readDB()
  const section = db.aboutPage.sections.find((s) => s.id === req.params.id)
  if (!section) return res.status(404).json({ error: 'Section not found.' })
  section.active = !section.active
  writeDB(db)
  res.json({ section })
})

router.patch('/admin/about/sections/:id/move', requireAdmin, (req, res) => {
  const db = readDB()
  db.aboutPage.sections = reorderList(db.aboutPage.sections, req.params.id, req.body?.direction)
  writeDB(db)
  res.json({ sections: allSorted(db.aboutPage.sections) })
})

// ---- Trainers ----

router.post('/admin/about/trainers', requireAdmin, (req, res) => {
  const { name, photo, designation, title, bio, skills, experience, certifications, linkedin, github, email } = req.body || {}
  if (!name?.trim()) return res.status(400).json({ error: 'Trainer name is required.' })
  const db = readDB()
  const trainer = {
    id: nextId('trainer'),
    order: db.aboutPage.trainers.length + 1,
    active: true,
    name: name.trim(),
    photo: photo || '',
    designation: designation || '',
    title: title || '',
    bio: bio || '',
    skills: Array.isArray(skills) ? skills : (skills ? String(skills).split(',').map((s) => s.trim()).filter(Boolean) : []),
    experience: experience || '',
    certifications: certifications || '',
    linkedin: linkedin || '',
    github: github || '',
    email: email || '',
  }
  db.aboutPage.trainers.push(trainer)
  writeDB(db)
  res.status(201).json({ trainer })
})

router.put('/admin/about/trainers/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const trainer = db.aboutPage.trainers.find((t) => t.id === req.params.id)
  if (!trainer) return res.status(404).json({ error: 'Trainer not found.' })
  const body = req.body || {}
  ;['name', 'photo', 'designation', 'title', 'bio', 'experience', 'certifications', 'linkedin', 'github', 'email'].forEach((f) => {
    if (body[f] !== undefined) trainer[f] = body[f]
  })
  if (body.skills !== undefined) {
    trainer.skills = Array.isArray(body.skills) ? body.skills : String(body.skills).split(',').map((s) => s.trim()).filter(Boolean)
  }
  writeDB(db)
  res.json({ trainer })
})

router.delete('/admin/about/trainers/:id', requireAdmin, (req, res) => {
  const db = readDB()
  const before = db.aboutPage.trainers.length
  db.aboutPage.trainers = db.aboutPage.trainers.filter((t) => t.id !== req.params.id)
  if (db.aboutPage.trainers.length === before) return res.status(404).json({ error: 'Trainer not found.' })
  writeDB(db)
  res.json({ ok: true })
})

router.patch('/admin/about/trainers/:id/toggle', requireAdmin, (req, res) => {
  const db = readDB()
  const trainer = db.aboutPage.trainers.find((t) => t.id === req.params.id)
  if (!trainer) return res.status(404).json({ error: 'Trainer not found.' })
  trainer.active = !trainer.active
  writeDB(db)
  res.json({ trainer })
})

router.patch('/admin/about/trainers/:id/move', requireAdmin, (req, res) => {
  const db = readDB()
  db.aboutPage.trainers = reorderList(db.aboutPage.trainers, req.params.id, req.body?.direction)
  writeDB(db)
  res.json({ trainers: allSorted(db.aboutPage.trainers) })
})

export default router
