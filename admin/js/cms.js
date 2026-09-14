// Relies on globals from dashboard.js: tabs, escapeHtml, showAlert, api

// ==================== HOME PAGE ====================

let homeSubTab = 'hero'

async function loadHomeCms() {
  tabs.home.innerHTML = '<p class="empty-state">Loading…</p>'
  try {
    const data = await api.adminHome()
    renderHomeCms(data)
  } catch (err) {
    tabs.home.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

function renderHomeCms(data) {
  const subTabs = [
    ['hero', 'Hero Section'],
    ['highlights', 'Course Highlights'],
    ['whyUs', 'Why Choose Us'],
    ['faqs', 'FAQs'],
    ['certificate', 'Certificate Preview'],
  ]

  tabs.home.innerHTML = `
    <div class="panel-head" style="margin-bottom:1rem; gap:0.5rem; flex-wrap:wrap;">
      ${subTabs.map(([key, label]) => `
        <button class="btn ${homeSubTab === key ? 'btn-primary' : 'btn-outline'} btn-sm" data-home-sub="${key}">${label}</button>
      `).join('')}
    </div>
    <div id="home-sub-content"></div>
  `

  tabs.home.querySelectorAll('[data-home-sub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      homeSubTab = btn.dataset.homeSub
      renderHomeCms(data)
    })
  })

  const content = document.getElementById('home-sub-content')
  if (homeSubTab === 'hero') renderHeroForm(content, data.hero)
  else if (homeSubTab === 'highlights') renderReorderableList(content, {
    title: 'Course Highlights', items: data.highlights,
    api: { create: api.createHighlight, update: api.updateHighlight, del: api.deleteHighlight, toggle: api.toggleHighlight, move: api.moveHighlight },
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'text', label: 'Description', textarea: true },
      { name: 'icon', label: 'Icon (infra / shield / career)' },
      { name: 'buttonText', label: 'Button Text' },
      { name: 'buttonLink', label: 'Button Link' },
    ],
    renderRow: (i) => `<strong>${escapeHtml(i.title)}</strong> — <span style="color:var(--text-muted);">${escapeHtml(i.text || '')}</span>`,
    reload: loadHomeCms,
  })
  else if (homeSubTab === 'whyUs') renderReorderableList(content, {
    title: 'Why Choose Us', items: data.whyUs,
    api: { create: api.createWhyUs, update: api.updateWhyUs, del: api.deleteWhyUs, toggle: api.toggleWhyUs, move: api.moveWhyUs },
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'text', label: 'Description', textarea: true },
    ],
    renderRow: (i) => `<strong>${escapeHtml(i.title)}</strong> — <span style="color:var(--text-muted);">${escapeHtml(i.text || '')}</span>`,
    reload: loadHomeCms,
  })
  else if (homeSubTab === 'faqs') renderReorderableList(content, {
    title: 'Frequently Asked Questions', items: data.faqs,
    api: { create: api.createFaq, update: api.updateFaq, del: api.deleteFaq, toggle: api.toggleFaq, move: api.moveFaq },
    fields: [
      { name: 'question', label: 'Question', required: true },
      { name: 'answer', label: 'Answer', textarea: true },
    ],
    renderRow: (i) => `<strong>${escapeHtml(i.question)}</strong>`,
    reload: loadHomeCms,
  })
  else if (homeSubTab === 'certificate') renderCertificatePreviewForm(content, data.certificatePreview)
}

function renderHeroForm(container, hero) {
  container.innerHTML = `
    <div class="panel">
      <h3>Hero Section</h3>
      <form id="hero-form">
        <div class="form-group"><label>Eyebrow (small text above heading)</label><input name="eyebrow" value="${escapeHtml(hero.eyebrow || '')}" /></div>
        <div class="form-group"><label>Main Heading</label><input name="headline" value="${escapeHtml(hero.headline || '')}" required /></div>
        <div class="form-group"><label>Description</label><textarea name="subtext">${escapeHtml(hero.subtext || '')}</textarea></div>
        <div class="form-group"><label>Primary Button Text</label><input name="ctaText" value="${escapeHtml(hero.ctaText || '')}" /></div>
        <div class="form-group"><label>Primary Button Link</label><input name="ctaLink" value="${escapeHtml(hero.ctaLink || '')}" /></div>
        <div class="form-group"><label>Secondary Button Text</label><input name="secondaryCtaText" value="${escapeHtml(hero.secondaryCtaText || '')}" /></div>
        <div class="form-group"><label>Secondary Button Link</label><input name="secondaryCtaLink" value="${escapeHtml(hero.secondaryCtaLink || '')}" /></div>

        <label style="font-size:0.85rem; font-weight:600; color:var(--navy);">Stat Badges</label>
        <div id="hero-stats"></div>
        <button type="button" class="btn btn-outline btn-sm" id="add-stat" style="margin:0.5rem 0 1rem;">+ Add Stat</button>

        <div class="row-actions">
          <button type="submit" class="btn btn-primary">Save</button>
          <button type="button" class="btn btn-outline" id="reset-hero">Reset</button>
        </div>
      </form>
    </div>
  `
  const statsWrap = document.getElementById('hero-stats')
  function addStatRow(value = '', label = '') {
    const row = document.createElement('div')
    row.className = 'repeatable-item'
    row.style.display = 'flex'
    row.style.gap = '0.5rem'
    row.style.alignItems = 'center'
    row.innerHTML = `
      <input class="stat-value" value="${escapeHtml(value)}" placeholder="12" style="flex:0 0 80px;" />
      <input class="stat-label" value="${escapeHtml(label)}" placeholder="Week Program" style="flex:1;" />
      <button type="button" class="btn btn-danger btn-sm remove-stat">Remove</button>
    `
    row.querySelector('.remove-stat').addEventListener('click', () => row.remove())
    statsWrap.appendChild(row)
  }
  ;(hero.stats || []).forEach((s) => addStatRow(s.value, s.label))
  document.getElementById('add-stat').addEventListener('click', () => addStatRow())
  document.getElementById('reset-hero').addEventListener('click', () => renderHeroForm(container, hero))

  document.getElementById('hero-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const stats = Array.from(statsWrap.querySelectorAll('.repeatable-item')).map((row) => ({
      value: row.querySelector('.stat-value').value,
      label: row.querySelector('.stat-label').value,
    })).filter((s) => s.label.trim())
    const payload = Object.fromEntries(fd.entries())
    payload.stats = stats
    try {
      await api.updateHero(payload)
      showAlert('Hero section updated successfully.', 'success')
      loadHomeCms()
    } catch (err) {
      showAlert('Failed to save changes. Please try again.')
    }
  })
}

function renderCertificatePreviewForm(container, cert) {
  container.innerHTML = `
    <div class="panel">
      <h3>Certificate Preview Section</h3>
      <form id="cert-form">
        <div class="form-group">
          <label><input type="checkbox" name="enabled" ${cert.enabled ? 'checked' : ''} style="width:auto; display:inline-block; margin-right:0.4rem;" />Show this section on the Home page</label>
        </div>
        <div class="form-group"><label>Heading</label><input name="heading" value="${escapeHtml(cert.heading || '')}" /></div>
        <div class="form-group"><label>Description</label><textarea name="description">${escapeHtml(cert.description || '')}</textarea></div>
        <div class="form-group"><label>Button Text</label><input name="buttonText" value="${escapeHtml(cert.buttonText || '')}" /></div>
        <div class="form-group"><label>Button Link</label><input name="buttonLink" value="${escapeHtml(cert.buttonLink || '')}" /></div>
        <div class="form-group">
          <label>Preview Image (optional)</label>
          <input type="file" id="cert-image-file" accept="image/*" />
          <input type="hidden" name="image" value="${escapeHtml(cert.image || '')}" />
          ${cert.image ? `<img src="${escapeHtml(cert.image)}" style="max-width:160px; margin-top:0.5rem; border-radius:8px;" />` : ''}
        </div>
        <button type="submit" class="btn btn-primary">Save</button>
      </form>
    </div>
  `
  const fileInput = document.getElementById('cert-image-file')
  const hiddenImage = document.querySelector('#cert-form input[name="image"]')
  fileInput.addEventListener('change', async () => {
    if (!fileInput.files[0]) return
    try {
      const { url } = await api.uploadImage(fileInput.files[0])
      hiddenImage.value = url
      showAlert('Image uploaded.', 'success')
    } catch (err) {
      showAlert(err.message)
    }
  })
  document.getElementById('cert-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const payload = Object.fromEntries(fd.entries())
    payload.enabled = fd.get('enabled') === 'on'
    try {
      await api.updateCertificatePreview(payload)
      showAlert('Certificate preview settings updated successfully.', 'success')
      loadHomeCms()
    } catch (err) {
      showAlert('Failed to save changes. Please try again.')
    }
  })
}

// Generic reorderable CRUD list — used for Highlights, Why Choose Us, FAQs,
// and About page Sections. `fields` describes the edit form; `renderRow`
// describes the one-line summary shown in the list.
function renderReorderableList(container, { title, items, api: itemApi, fields, renderRow, reload, extraFields }) {
  container.innerHTML = `
    <div class="panel-head" style="margin-bottom:1rem;">
      <h3>${title}</h3>
      <button class="btn btn-primary btn-sm" id="add-item-btn">+ Add</button>
    </div>
    <div id="item-list">
      ${items.map((item, i) => `
        <div class="panel" style="margin-bottom:0.75rem;">
          <div class="panel-head">
            <div>${renderRow(item)}</div>
            <div class="row-actions">
              <button class="btn btn-outline btn-sm" data-move-up="${item.id}" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button class="btn btn-outline btn-sm" data-move-down="${item.id}" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
              <button class="btn btn-outline btn-sm" data-toggle="${item.id}">${item.active ? 'Disable' : 'Enable'}</button>
              <button class="btn btn-outline btn-sm" data-edit="${item.id}">Edit</button>
              <button class="btn btn-danger btn-sm" data-delete="${item.id}">Delete</button>
            </div>
          </div>
          <span class="badge ${item.active ? 'badge-approved' : 'badge-pending'}">${item.active ? 'Active' : 'Inactive'}</span>
        </div>
      `).join('')}
      ${items.length === 0 ? '<p class="empty-state">Nothing here yet.</p>' : ''}
    </div>
    <div id="item-form-wrap"></div>
  `

  function itemFormHtml(item) {
    return fields.map((f) => {
      const val = escapeHtml(item?.[f.name] || '')
      if (f.textarea) return `<div class="form-group"><label>${f.label}</label><textarea name="${f.name}" ${f.required ? 'required' : ''}>${val}</textarea></div>`
      return `<div class="form-group"><label>${f.label}</label><input name="${f.name}" value="${val}" ${f.required ? 'required' : ''} /></div>`
    }).join('')
  }

  function openForm(item) {
    const wrap = document.getElementById('item-form-wrap')
    wrap.innerHTML = `
      <div class="panel">
        <h3>${item ? 'Edit' : 'Add New'}</h3>
        <form id="item-form">
          ${itemFormHtml(item)}
          ${extraFields ? extraFields(item) : ''}
          <div class="row-actions" style="margin-top:1rem;">
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-outline" id="cancel-item">Cancel</button>
          </div>
        </form>
      </div>
    `
    document.getElementById('cancel-item').addEventListener('click', () => { wrap.innerHTML = '' })
    document.getElementById('item-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const fd = new FormData(e.target)
      const payload = Object.fromEntries(fd.entries())
      try {
        if (item) await itemApi.update(item.id, payload)
        else await itemApi.create(payload)
        showAlert(item ? 'Updated successfully.' : 'Added successfully.', 'success')
        reload()
      } catch (err) {
        showAlert(err.message || 'Failed to save changes. Please try again.')
      }
    })
  }

  document.getElementById('add-item-btn').addEventListener('click', () => openForm(null))
  container.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openForm(items.find((i) => i.id === btn.dataset.edit)))
  })
  container.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this item?')) return
      try { await itemApi.del(btn.dataset.delete); showAlert('Deleted successfully.', 'success'); reload() } catch (err) { showAlert(err.message) }
    })
  })
  container.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try { await itemApi.toggle(btn.dataset.toggle); reload() } catch (err) { showAlert(err.message) }
    })
  })
  container.querySelectorAll('[data-move-up]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try { await itemApi.move(btn.dataset.moveUp, 'up'); reload() } catch (err) { showAlert(err.message) }
    })
  })
  container.querySelectorAll('[data-move-down]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try { await itemApi.move(btn.dataset.moveDown, 'down'); reload() } catch (err) { showAlert(err.message) }
    })
  })
}

// ==================== ABOUT PAGE ====================

let aboutSubTab = 'intro'

async function loadAboutCms() {
  tabs.about.innerHTML = '<p class="empty-state">Loading…</p>'
  try {
    const data = await api.adminAbout()
    renderAboutCms(data)
  } catch (err) {
    tabs.about.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

function renderAboutCms(data) {
  const subTabs = [
    ['intro', 'Intro / Mission / Vision'],
    ['trainers', 'Our Trainers'],
    ['sections', 'Additional Sections'],
  ]
  tabs.about.innerHTML = `
    <div class="panel-head" style="margin-bottom:1rem; gap:0.5rem; flex-wrap:wrap;">
      ${subTabs.map(([key, label]) => `
        <button class="btn ${aboutSubTab === key ? 'btn-primary' : 'btn-outline'} btn-sm" data-about-sub="${key}">${label}</button>
      `).join('')}
    </div>
    <p style="color:var(--text-muted); font-size:0.82rem; margin-bottom:1rem;">
      Leadership (Makeshkumar & Jagan) is a fixed part of the page and isn't editable here.
      Trainers and Additional Sections appear on the public About page right after Leadership.
    </p>
    <div id="about-sub-content"></div>
  `
  tabs.about.querySelectorAll('[data-about-sub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      aboutSubTab = btn.dataset.aboutSub
      renderAboutCms(data)
    })
  })

  const content = document.getElementById('about-sub-content')
  if (aboutSubTab === 'intro') renderAboutIntroForm(content, data.intro)
  else if (aboutSubTab === 'trainers') renderTrainersList(content, data.trainers)
  else if (aboutSubTab === 'sections') renderReorderableList(content, {
    title: 'Additional About Page Sections', items: data.sections,
    api: { create: api.createAboutSection, update: api.updateAboutSection, del: api.deleteAboutSection, toggle: api.toggleAboutSection, move: api.moveAboutSection },
    fields: [
      { name: 'title', label: 'Section Title', required: true },
      { name: 'subtitle', label: 'Subtitle' },
      { name: 'description', label: 'Description', textarea: true },
      { name: 'buttonText', label: 'Button Text' },
      { name: 'buttonLink', label: 'Button Link' },
    ],
    renderRow: (i) => `<strong>${escapeHtml(i.title)}</strong>`,
    reload: loadAboutCms,
    extraFields: (item) => `
      <div class="form-group">
        <label>Image (optional)</label>
        <input type="file" class="section-image-file" accept="image/*" />
        <input type="hidden" name="image" value="${escapeHtml(item?.image || '')}" />
        ${item?.image ? `<img src="${escapeHtml(item.image)}" style="max-width:160px; margin-top:0.5rem; border-radius:8px;" />` : ''}
      </div>
    `,
  })

  // Wire up the image-upload-on-change behavior for the sections form,
  // since renderReorderableList's generic form doesn't know about file inputs.
  content.addEventListener('change', async (e) => {
    if (!e.target.classList?.contains('section-image-file')) return
    const file = e.target.files[0]
    if (!file) return
    try {
      const { url } = await api.uploadImage(file)
      const hidden = e.target.closest('form').querySelector('input[name="image"]')
      hidden.value = url
      showAlert('Image uploaded.', 'success')
    } catch (err) {
      showAlert(err.message)
    }
  })
}

function renderAboutIntroForm(container, intro) {
  container.innerHTML = `
    <div class="panel">
      <h3>Intro / Mission / Vision</h3>
      <form id="about-intro-form">
        <div class="form-group"><label>Page Heading</label><input name="heading" value="${escapeHtml(intro.heading || '')}" /></div>
        <div class="form-group"><label>Page Description</label><textarea name="description">${escapeHtml(intro.description || '')}</textarea></div>
        <div class="form-group"><label>Mission Title</label><input name="missionTitle" value="${escapeHtml(intro.missionTitle || '')}" /></div>
        <div class="form-group"><label>Mission Text</label><textarea name="missionText">${escapeHtml(intro.missionText || '')}</textarea></div>
        <div class="form-group"><label>Vision Title</label><input name="visionTitle" value="${escapeHtml(intro.visionTitle || '')}" /></div>
        <div class="form-group"><label>Vision Text</label><textarea name="visionText">${escapeHtml(intro.visionText || '')}</textarea></div>
        <button type="submit" class="btn btn-primary">Save</button>
      </form>
    </div>
  `
  document.getElementById('about-intro-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    try {
      await api.updateAboutIntro(Object.fromEntries(fd.entries()))
      showAlert('About page updated successfully.', 'success')
      loadAboutCms()
    } catch (err) {
      showAlert('Failed to save changes. Please try again.')
    }
  })
}

function renderTrainersList(container, trainers) {
  container.innerHTML = `
    <div class="panel-head" style="margin-bottom:1rem;">
      <h3>Our Trainers</h3>
      <button class="btn btn-primary btn-sm" id="add-trainer-btn">+ Add Trainer</button>
    </div>
    <div>
      ${trainers.map((t, i) => `
        <div class="panel" style="margin-bottom:0.75rem;">
          <div class="panel-head">
            <div>
              <strong>${escapeHtml(t.name)}</strong>
              <span style="color:var(--text-muted); margin-left:0.4rem;">${escapeHtml(t.designation || t.title || '')}</span>
            </div>
            <div class="row-actions">
              <button class="btn btn-outline btn-sm" data-move-up="${t.id}" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button class="btn btn-outline btn-sm" data-move-down="${t.id}" ${i === trainers.length - 1 ? 'disabled' : ''}>↓</button>
              <button class="btn btn-outline btn-sm" data-toggle="${t.id}">${t.active ? 'Disable' : 'Enable'}</button>
              <button class="btn btn-outline btn-sm" data-edit="${t.id}">Edit</button>
              <button class="btn btn-danger btn-sm" data-delete="${t.id}">Delete</button>
            </div>
          </div>
          <span class="badge ${t.active ? 'badge-approved' : 'badge-pending'}">${t.active ? 'Active' : 'Inactive'}</span>
        </div>
      `).join('')}
      ${trainers.length === 0 ? '<p class="empty-state">No trainers added yet.</p>' : ''}
    </div>
    <div id="trainer-form-wrap"></div>
  `

  function openTrainerForm(trainer) {
    const wrap = document.getElementById('trainer-form-wrap')
    wrap.innerHTML = `
      <div class="panel">
        <h3>${trainer ? 'Edit Trainer' : 'Add Trainer'}</h3>
        <form id="trainer-form">
          <div class="form-group"><label>Name</label><input name="name" value="${escapeHtml(trainer?.name || '')}" required /></div>
          <div class="form-group">
            <label>Profile Photo</label>
            <input type="file" id="trainer-photo-file" accept="image/*" />
            <input type="hidden" name="photo" value="${escapeHtml(trainer?.photo || '')}" />
            ${trainer?.photo ? `<img src="${escapeHtml(trainer.photo)}" style="max-width:100px; margin-top:0.5rem; border-radius:50%;" />` : ''}
          </div>
          <div class="form-group"><label>Designation (e.g. Cybersecurity Trainer)</label><input name="designation" value="${escapeHtml(trainer?.designation || '')}" /></div>
          <div class="form-group"><label>Professional Title</label><input name="title" value="${escapeHtml(trainer?.title || '')}" /></div>
          <div class="form-group"><label>Short Bio</label><textarea name="bio">${escapeHtml(trainer?.bio || '')}</textarea></div>
          <div class="form-group"><label>Skills (comma-separated)</label><input name="skills" value="${escapeHtml((trainer?.skills || []).join(', '))}" placeholder="Networking, Cybersecurity, Ethical Hacking" /></div>
          <div class="form-group"><label>Experience</label><input name="experience" value="${escapeHtml(trainer?.experience || '')}" placeholder="e.g. 5 Years" /></div>
          <div class="form-group"><label>Certifications</label><input name="certifications" value="${escapeHtml(trainer?.certifications || '')}" /></div>
          <div class="form-group"><label>LinkedIn URL</label><input name="linkedin" value="${escapeHtml(trainer?.linkedin || '')}" /></div>
          <div class="form-group"><label>GitHub URL</label><input name="github" value="${escapeHtml(trainer?.github || '')}" /></div>
          <div class="form-group"><label>Email</label><input name="email" value="${escapeHtml(trainer?.email || '')}" /></div>
          <div class="row-actions" style="margin-top:1rem;">
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-outline" id="cancel-trainer">Cancel</button>
          </div>
        </form>
      </div>
    `
    document.getElementById('trainer-photo-file').addEventListener('change', async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        const { url } = await api.uploadImage(file)
        document.querySelector('#trainer-form input[name="photo"]').value = url
        showAlert('Photo uploaded.', 'success')
      } catch (err) {
        showAlert(err.message)
      }
    })
    document.getElementById('cancel-trainer').addEventListener('click', () => { wrap.innerHTML = '' })
    document.getElementById('trainer-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const fd = new FormData(e.target)
      const payload = Object.fromEntries(fd.entries())
      try {
        if (trainer) await api.updateTrainer(trainer.id, payload)
        else await api.createTrainer(payload)
        showAlert(trainer ? 'Trainer updated successfully.' : 'Trainer added successfully.', 'success')
        loadAboutCms()
      } catch (err) {
        showAlert(err.message || 'Failed to save changes. Please try again.')
      }
    })
  }

  document.getElementById('add-trainer-btn').addEventListener('click', () => openTrainerForm(null))
  container.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openTrainerForm(trainers.find((t) => t.id === btn.dataset.edit)))
  })
  container.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this trainer?')) return
      try { await api.deleteTrainer(btn.dataset.delete); showAlert('Trainer deleted successfully.', 'success'); loadAboutCms() } catch (err) { showAlert(err.message) }
    })
  })
  container.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try { await api.toggleTrainer(btn.dataset.toggle); loadAboutCms() } catch (err) { showAlert(err.message) }
    })
  })
  container.querySelectorAll('[data-move-up]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try { await api.moveTrainer(btn.dataset.moveUp, 'up'); loadAboutCms() } catch (err) { showAlert(err.message) }
    })
  })
  container.querySelectorAll('[data-move-down]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try { await api.moveTrainer(btn.dataset.moveDown, 'down'); loadAboutCms() } catch (err) { showAlert(err.message) }
    })
  })
}
