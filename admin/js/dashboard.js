const pageTitle = document.getElementById('page-title')
const whoEl = document.getElementById('who')
const alertBox = document.getElementById('alert')
const tabs = {
  dashboard: document.getElementById('tab-dashboard'),
  enrollments: document.getElementById('tab-enrollments'),
  messages: document.getElementById('tab-messages'),
  testimonials: document.getElementById('tab-testimonials'),
  courses: document.getElementById('tab-courses'),
  students: document.getElementById('tab-students'),
  resources: document.getElementById('tab-resources'),
  home: document.getElementById('tab-home'),
  about: document.getElementById('tab-about'),
}
const navButtons = document.querySelectorAll('#nav button')

function showAlert(message, type = 'error') {
  alertBox.textContent = message
  alertBox.className = `alert alert-${type}`
  setTimeout(() => alertBox.classList.add('hidden'), 4000)
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// ---------- Auth guard ----------
async function guardAndInit() {
  try {
    const me = await api.me()
    whoEl.textContent = me.email
  } catch {
    window.location.href = 'index.html'
    return
  }
  switchTab('dashboard')
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await api.logout()
  } finally {
    window.location.href = 'index.html'
  }
})

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
})

function switchTab(name) {
  navButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === name))
  Object.entries(tabs).forEach(([key, el]) => el.classList.toggle('hidden', key !== name))
  pageTitle.textContent = name.charAt(0).toUpperCase() + name.slice(1)
  const loaders = {
    dashboard: loadDashboard,
    enrollments: loadEnrollments,
    messages: loadMessages,
    testimonials: loadTestimonials,
    courses: loadCourses,
    students: loadStudents,
    resources: loadResources,
    home: loadHomeCms,
    about: loadAboutCms,
  }
  loaders[name]?.()
}

// ---------- Dashboard ----------
async function loadDashboard() {
  tabs.dashboard.innerHTML = '<p class="empty-state">Loading…</p>'
  try {
    const s = await api.stats()
    tabs.dashboard.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><strong>${s.totalEnrollments}</strong><span>Total Enrollments</span></div>
        <div class="stat-card"><strong>${s.newEnrollmentsThisWeek}</strong><span>New This Week</span></div>
        <div class="stat-card"><strong>${s.unreadMessages}</strong><span>Unread Messages</span></div>
        <div class="stat-card"><strong>${s.totalTestimonials}</strong><span>Total Reviews</span></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3 style="margin:0;">Weekly Report</h3>
          <button class="btn btn-primary btn-sm" id="weekly-report-btn">Generate & Download</button>
        </div>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Downloads a CSV summary of everything from the last 7 days: new enrollments
          (with status breakdown), new contact messages, and new testimonial submissions.
        </p>
      </div>
      <div class="panel">
        <h3>Welcome</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Use the sidebar to manage enrollments, contact messages, testimonials, course content, and free resources.
          Everything here talks directly to the backend API — changes are saved immediately.
        </p>
      </div>
    `
    document.getElementById('weekly-report-btn').addEventListener('click', downloadWeeklyReport)
  } catch (err) {
    tabs.dashboard.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

function csvEscape(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

async function downloadWeeklyReport() {
  try {
    const report = await api.weeklyReport()
    const lines = []

    lines.push('Codedefenze — Weekly Report')
    lines.push(`Generated,${report.generatedAt}`)
    lines.push('')
    lines.push('Summary')
    lines.push(`New Enrollments,${report.summary.newEnrollments}`)
    lines.push(`New Messages,${report.summary.newMessages}`)
    lines.push(`New Testimonials,${report.summary.newTestimonials}`)
    Object.entries(report.summary.enrollmentStatusCounts).forEach(([status, count]) => {
      lines.push(`Enrollments — ${status},${count}`)
    })
    lines.push('')

    lines.push('Enrollments (last 7 days)')
    lines.push(['Name', 'Email', 'Phone', 'College', 'Course', 'Status', 'Date'].join(','))
    report.enrollments.forEach((e) => {
      lines.push([e.name, e.email, e.phone, e.college, e.course, e.status, e.createdAt].map(csvEscape).join(','))
    })
    lines.push('')

    lines.push('Messages (last 7 days)')
    lines.push(['Name', 'Email', 'Phone', 'Message', 'Date'].join(','))
    report.messages.forEach((m) => {
      lines.push([m.name, m.email, m.phone, m.message, m.createdAt].map(csvEscape).join(','))
    })
    lines.push('')

    lines.push('Testimonials (last 7 days)')
    lines.push(['Name', 'College', 'Course', 'Approved', 'Review', 'Date'].join(','))
    report.testimonials.forEach((t) => {
      lines.push([t.name, t.college, t.course, t.approved ? 'Yes' : 'Pending', t.review, t.createdAt].map(csvEscape).join(','))
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `codedefenze-weekly-report-${dateStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    showAlert(err.message)
  }
}

// ---------- Enrollments ----------
async function loadEnrollments() {
  tabs.enrollments.innerHTML = '<p class="empty-state">Loading…</p>'
  try {
    const { enrollments } = await api.enrollments()
    if (!enrollments.length) {
      tabs.enrollments.innerHTML = '<div class="panel"><p class="empty-state">No enrollments yet.</p></div>'
      return
    }
    tabs.enrollments.innerHTML = `
      <div class="panel">
        <table>
          <thead><tr><th>Name</th><th>Contact</th><th>College</th><th>Course</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            ${enrollments.map((e) => `
              <tr>
                <td>${escapeHtml(e.name)}</td>
                <td>${escapeHtml(e.email)}<br><span style="color:var(--text-muted)">${escapeHtml(e.phone)}</span></td>
                <td>${escapeHtml(e.college)}</td>
                <td>${escapeHtml(e.course)}</td>
                <td>
                  <select data-id="${e.id}" class="status-select">
                    <option value="new" ${e.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="contacted" ${e.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="converted" ${e.status === 'converted' ? 'selected' : ''}>Converted</option>
                  </select>
                </td>
                <td>${formatDate(e.createdAt)}</td>
                <td><button class="btn btn-danger btn-sm" data-delete="${e.id}">Delete</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
    tabs.enrollments.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await api.updateEnrollmentStatus(sel.dataset.id, sel.value)
          showAlert('Status updated.', 'success')
        } catch (err) {
          showAlert(err.message)
        }
      })
    })
    tabs.enrollments.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this enrollment?')) return
        try {
          await api.deleteEnrollment(btn.dataset.delete)
          loadEnrollments()
        } catch (err) {
          showAlert(err.message)
        }
      })
    })
  } catch (err) {
    tabs.enrollments.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

// ---------- Messages ----------
async function loadMessages() {
  tabs.messages.innerHTML = '<p class="empty-state">Loading…</p>'
  try {
    const { messages } = await api.messages()
    if (!messages.length) {
      tabs.messages.innerHTML = '<div class="panel"><p class="empty-state">No messages yet.</p></div>'
      return
    }
    tabs.messages.innerHTML = messages.map((m) => `
      <div class="panel">
        <div class="panel-head">
          <div>
            <strong>${escapeHtml(m.name)}</strong>
            <span class="badge ${m.read ? 'badge-read' : 'badge-unread'}" style="margin-left:0.5rem;">${m.read ? 'Read' : 'Unread'}</span>
            <div style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(m.email)} · ${escapeHtml(m.phone || '—')} · ${formatDate(m.createdAt)}</div>
          </div>
          <div class="row-actions">
            ${!m.read ? `<button class="btn btn-outline btn-sm" data-read="${m.id}">Mark Read</button>` : ''}
            <button class="btn btn-danger btn-sm" data-delete="${m.id}">Delete</button>
          </div>
        </div>
        <p style="font-size: 0.9rem;">${escapeHtml(m.message)}</p>
      </div>
    `).join('')
    tabs.messages.querySelectorAll('[data-read]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try { await api.markMessageRead(btn.dataset.read); loadMessages() } catch (err) { showAlert(err.message) }
      })
    })
    tabs.messages.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this message?')) return
        try { await api.deleteMessage(btn.dataset.delete); loadMessages() } catch (err) { showAlert(err.message) }
      })
    })
  } catch (err) {
    tabs.messages.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

// ---------- Testimonials ----------
async function loadTestimonials() {
  tabs.testimonials.innerHTML = '<p class="empty-state">Loading…</p>'
  try {
    const { testimonials } = await api.testimonials()

    if (!testimonials.length) {
      tabs.testimonials.innerHTML = '<div class="panel"><p class="empty-state">No reviews yet.</p></div>'
      return
    }

    tabs.testimonials.innerHTML = `
      <div id="testimonial-list">
        ${testimonials.map((t) => `
          <div class="panel">
            <div class="panel-head">
              <div>
                <strong>${escapeHtml(t.name)}</strong>
                <div style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(t.college)} · ${escapeHtml(t.course)}</div>
              </div>
              <div class="row-actions">
                <button class="btn btn-outline btn-sm" data-edit="${t.id}">Edit</button>
                <button class="btn btn-danger btn-sm" data-delete="${t.id}">Delete</button>
              </div>
            </div>
            <p style="font-size: 0.9rem;">${escapeHtml(t.review)}</p>
          </div>
        `).join('')}
      </div>
      <div id="testimonial-form-wrap"></div>
    `

    tabs.testimonials.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const testimonial = testimonials.find((t) => t.id === btn.dataset.edit)
        renderTestimonialForm(testimonial)
      })
    })
    tabs.testimonials.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this review?')) return
        try { await api.deleteTestimonial(btn.dataset.delete); loadTestimonials() } catch (err) { showAlert(err.message) }
      })
    })
  } catch (err) {
    tabs.testimonials.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

function renderTestimonialForm(testimonial) {
  const wrap = document.getElementById('testimonial-form-wrap')
  wrap.innerHTML = `
    <div class="panel">
      <h3>Edit Review</h3>
      <form id="testimonial-form">
        <div class="form-group"><label>Student Name</label><input name="name" value="${escapeHtml(testimonial.name)}" required /></div>
        <div class="form-group"><label>College</label><input name="college" value="${escapeHtml(testimonial.college)}" /></div>
        <div class="form-group"><label>Course</label><input name="course" value="${escapeHtml(testimonial.course)}" /></div>
        <div class="form-group"><label>Review</label><textarea name="review" required>${escapeHtml(testimonial.review)}</textarea></div>
        <div class="row-actions" style="margin-top:1rem;">
          <button type="submit" class="btn btn-primary">Save Changes</button>
          <button type="button" class="btn btn-outline" id="cancel-testimonial">Cancel</button>
        </div>
      </form>
    </div>
  `
  document.getElementById('cancel-testimonial').addEventListener('click', () => { wrap.innerHTML = '' })
  document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const payload = {
      name: fd.get('name'),
      college: fd.get('college'),
      course: fd.get('course'),
      review: fd.get('review'),
    }
    try {
      await api.updateTestimonial(testimonial.id, payload)
      showAlert('Review updated.', 'success')
      loadTestimonials()
    } catch (err) {
      showAlert(err.message)
    }
  })
}

// ---------- Courses ----------
async function loadCourses() {
  tabs.courses.innerHTML = '<p class="empty-state">Loading…</p>'
  try {
    const { courses } = await api.courses()
    tabs.courses.innerHTML = `
      <div class="panel-head" style="margin-bottom:1rem;">
        <h3>Courses</h3>
        <button class="btn btn-primary btn-sm" id="new-course-btn">+ New Course</button>
      </div>
      <div id="course-list">
        ${courses.map((c) => `
          <div class="panel">
            <div class="panel-head">
              <div>
                <strong>${escapeHtml(c.title)}</strong>
                <span class="badge ${c.published ? 'badge-approved' : 'badge-pending'}" style="margin-left:0.5rem;">${c.published ? 'Published' : 'Draft'}</span>
                <div style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(c.duration)} · ${escapeHtml(c.fee)} · ${escapeHtml(c.mode)}</div>
              </div>
              <div class="row-actions">
                <button class="btn btn-outline btn-sm" data-classes="${c.id}">Daily Classes</button>
                <button class="btn btn-outline btn-sm" data-edit="${c.id}">Edit</button>
                <button class="btn btn-danger btn-sm" data-delete="${c.id}">Delete</button>
              </div>
            </div>
            <p style="font-size:0.9rem;">${escapeHtml(c.description)}</p>
            <div id="classes-panel-${c.id}"></div>
          </div>
        `).join('')}
      </div>
      <div id="course-form-wrap"></div>
    `
    document.getElementById('new-course-btn').addEventListener('click', () => renderCourseForm())
    tabs.courses.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const course = courses.find((c) => c.id === btn.dataset.edit)
        renderCourseForm(course)
      })
    })
    tabs.courses.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this course? This cannot be undone.')) return
        try { await api.deleteCourse(btn.dataset.delete); loadCourses() } catch (err) { showAlert(err.message) }
      })
    })
    tabs.courses.querySelectorAll('[data-classes]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const courseId = btn.dataset.classes
        const panel = document.getElementById(`classes-panel-${courseId}`)
        if (panel.dataset.open === 'true') {
          panel.innerHTML = ''
          panel.dataset.open = 'false'
          return
        }
        panel.dataset.open = 'true'
        loadClassesPanel(courseId, panel)
      })
    })
  } catch (err) {
    tabs.courses.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

// ---------- Daily Classes (per course) ----------
async function loadClassesPanel(courseId, panel) {
  panel.innerHTML = '<p class="empty-state">Loading classes…</p>'
  try {
    const { classes } = await api.classes(courseId)
    panel.innerHTML = `
      <div class="panel" style="background:var(--bg-subtle,rgba(0,0,0,0.02));">
        <div class="panel-head">
          <h4 style="margin:0;">Daily / Recorded Classes</h4>
          <button class="btn btn-primary btn-sm" data-new-class>+ New Class</button>
        </div>
        ${classes.length ? `
          <table>
            <thead><tr><th>Day</th><th>Title</th><th>Video</th><th></th></tr></thead>
            <tbody>
              ${classes.map((cl) => `
                <tr>
                  <td>Day ${escapeHtml(String(cl.dayNumber))}</td>
                  <td>${escapeHtml(cl.title)}</td>
                  <td>
                    ${cl.hasVideo
                      ? `<span class="badge badge-approved">Uploaded</span><br><span style="color:var(--text-muted); font-size:0.8rem;">${escapeHtml(cl.videoFilename)}</span>`
                      : cl.uploadStatus === 'failed'
                        ? '<span class="badge badge-unread">Upload Failed</span>'
                        : '<span class="badge badge-pending">No video</span>'}
                  </td>
                  <td class="row-actions">
                    ${cl.hasVideo ? `<button class="btn btn-outline btn-sm" data-preview="${cl.id}">Preview</button>` : ''}
                    <label class="btn btn-outline btn-sm" style="cursor:pointer;">
                      ${cl.hasVideo ? 'Replace' : 'Upload Video'}
                      <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" data-upload="${cl.id}" style="display:none;" />
                    </label>
                    <span id="upload-progress-${cl.id}" style="font-size:0.8rem; color:var(--text-muted);"></span>
                    ${cl.hasVideo ? `<button class="btn btn-danger btn-sm" data-delete-video="${cl.id}">Delete Video</button>` : ''}
                    <button class="btn btn-danger btn-sm" data-delete-class="${cl.id}">Delete Class</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="empty-state">No classes yet. Click "+ New Class" to add Day 01.</p>'}
        <div id="class-form-wrap-${courseId}"></div>
        <div id="class-preview-wrap-${courseId}"></div>
      </div>
    `

    panel.querySelector('[data-new-class]').addEventListener('click', () => {
      renderClassForm(courseId, panel, classes.length + 1)
    })

    panel.querySelectorAll('[data-upload]').forEach((input) => {
      input.addEventListener('change', async () => {
        const file = input.files?.[0]
        if (!file) return
        const progressEl = document.getElementById(`upload-progress-${input.dataset.upload}`)
        try {
          await api.uploadClassVideo(courseId, input.dataset.upload, file, (pct) => {
            if (progressEl) {
              progressEl.textContent = pct < 100 ? `Uploading… ${pct}%` : 'Finalizing on Google Drive…'
            }
          })
          showAlert('Video uploaded successfully.', 'success')
          loadClassesPanel(courseId, panel)
        } catch (err) {
          showAlert(err.message)
          loadClassesPanel(courseId, panel)
        }
      })
    })

    panel.querySelectorAll('[data-delete-video]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this class\'s video? The class stays, but students lose access until you upload a new one.')) return
        try { await api.deleteClassVideo(btn.dataset.deleteVideo); loadClassesPanel(courseId, panel) } catch (err) { showAlert(err.message) }
      })
    })

    panel.querySelectorAll('[data-delete-class]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this class and its video? This cannot be undone.')) return
        try { await api.deleteClass(btn.dataset.deleteClass); loadClassesPanel(courseId, panel) } catch (err) { showAlert(err.message) }
      })
    })

    panel.querySelectorAll('[data-preview]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const wrap = document.getElementById(`class-preview-wrap-${courseId}`)
        wrap.innerHTML = `
          <div class="panel">
            <div class="panel-head">
              <h4 style="margin:0;">Preview</h4>
              <button class="btn btn-outline btn-sm" id="close-preview-${courseId}">Close</button>
            </div>
            <video controls style="width:100%; max-height:420px; background:#000;" src="${api.classVideoUrl(btn.dataset.preview)}"></video>
          </div>
        `
        document.getElementById(`close-preview-${courseId}`).addEventListener('click', () => { wrap.innerHTML = '' })
      })
    })
  } catch (err) {
    panel.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

function renderClassForm(courseId, panel, nextDay) {
  const wrap = document.getElementById(`class-form-wrap-${courseId}`)
  wrap.innerHTML = `
    <div class="panel">
      <h4>New Class</h4>
      <form id="class-form-${courseId}">
        <div class="form-group"><label>Day Number</label><input name="dayNumber" type="number" min="1" value="${nextDay}" required /></div>
        <div class="form-group"><label>Title</label><input name="title" placeholder="e.g. Introduction to Cyber Security" required /></div>
        <div class="row-actions" style="margin-top:1rem;">
          <button type="submit" class="btn btn-primary">Create Class</button>
          <button type="button" class="btn btn-outline" id="cancel-class-${courseId}">Cancel</button>
        </div>
      </form>
    </div>
  `
  document.getElementById(`cancel-class-${courseId}`).addEventListener('click', () => { wrap.innerHTML = '' })
  document.getElementById(`class-form-${courseId}`).addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    try {
      await api.createClass(courseId, { dayNumber: fd.get('dayNumber'), title: fd.get('title') })
      showAlert('Class created.', 'success')
      loadClassesPanel(courseId, panel)
    } catch (err) {
      showAlert(err.message)
    }
  })
}

function renderCourseForm(course) {
  const isEdit = Boolean(course)
  const syllabus = course?.syllabus || []
  const learnings = course?.learnings || []
  const wrap = document.getElementById('course-form-wrap')

  wrap.innerHTML = `
    <div class="panel">
      <h3>${isEdit ? 'Edit Course' : 'New Course'}</h3>
      <form id="course-form">
        <div class="form-group"><label>Title</label><input name="title" value="${escapeHtml(course?.title || '')}" required /></div>
        <div class="form-group"><label>Description</label><textarea name="description">${escapeHtml(course?.description || '')}</textarea></div>
        <div class="form-group"><label>Duration</label><input name="duration" value="${escapeHtml(course?.duration || '')}" placeholder="e.g. 12 Weeks" /></div>
        <div class="form-group"><label>Fee</label><input name="fee" value="${escapeHtml(course?.fee || '')}" placeholder="e.g. ₹24,999" /></div>
        <div class="form-group"><label>Mode</label><input name="mode" value="${escapeHtml(course?.mode || '')}" placeholder="e.g. Online + Labs" /></div>
        <div class="form-group">
          <label><input type="checkbox" name="published" ${course?.published ? 'checked' : ''} style="width:auto;display:inline-block;margin-right:0.4rem;" />Published (visible on the public site)</label>
        </div>

        <div class="form-group">
          <label>Syllabus Modules</label>
          <div id="syllabus-items"></div>
          <button type="button" class="btn btn-outline btn-sm" id="add-module">+ Add Module</button>
        </div>

        <div class="form-group">
          <label>Learning Outcomes</label>
          <div id="learning-items"></div>
          <button type="button" class="btn btn-outline btn-sm" id="add-learning">+ Add Outcome</button>
        </div>

        <div class="row-actions" style="margin-top:1rem;">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Course'}</button>
          <button type="button" class="btn btn-outline" id="cancel-course">Cancel</button>
        </div>
      </form>
    </div>
  `

  const syllabusEl = document.getElementById('syllabus-items')
  const learningEl = document.getElementById('learning-items')

  function addModuleRow(mod = { mod: '', title: '', desc: '' }) {
    const row = document.createElement('div')
    row.className = 'repeatable-item'
    row.innerHTML = `
      <div class="form-group"><label>Label</label><input class="mod-label" value="${escapeHtml(mod.mod)}" placeholder="Module 01" /></div>
      <div class="form-group"><label>Title</label><input class="mod-title" value="${escapeHtml(mod.title)}" /></div>
      <div class="form-group"><label>Description</label><textarea class="mod-desc">${escapeHtml(mod.desc)}</textarea></div>
      <div class="row-actions"><button type="button" class="btn btn-danger btn-sm remove-row">Remove</button></div>
    `
    row.querySelector('.remove-row').addEventListener('click', () => row.remove())
    syllabusEl.appendChild(row)
  }

  function addLearningRow(text = '') {
    const row = document.createElement('div')
    row.className = 'repeatable-item'
    row.innerHTML = `
      <div class="form-group"><input class="learning-text" value="${escapeHtml(text)}" /></div>
      <div class="row-actions"><button type="button" class="btn btn-danger btn-sm remove-row">Remove</button></div>
    `
    row.querySelector('.remove-row').addEventListener('click', () => row.remove())
    learningEl.appendChild(row)
  }

  syllabus.forEach(addModuleRow)
  learnings.forEach(addLearningRow)
  if (!syllabus.length) addModuleRow()
  if (!learnings.length) addLearningRow()

  document.getElementById('add-module').addEventListener('click', () => addModuleRow())
  document.getElementById('add-learning').addEventListener('click', () => addLearningRow())
  document.getElementById('cancel-course').addEventListener('click', () => { wrap.innerHTML = '' })

  document.getElementById('course-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const payload = {
      title: fd.get('title'),
      description: fd.get('description'),
      duration: fd.get('duration'),
      fee: fd.get('fee'),
      mode: fd.get('mode'),
      published: fd.get('published') === 'on',
      syllabus: Array.from(syllabusEl.querySelectorAll('.repeatable-item')).map((row) => ({
        mod: row.querySelector('.mod-label').value,
        title: row.querySelector('.mod-title').value,
        desc: row.querySelector('.mod-desc').value,
      })).filter((m) => m.title.trim()),
      learnings: Array.from(learningEl.querySelectorAll('.learning-text')).map((i) => i.value).filter((t) => t.trim()),
    }
    try {
      if (isEdit) await api.updateCourse(course.id, payload)
      else await api.createCourse(payload)
      showAlert('Course saved.', 'success')
      loadCourses()
    } catch (err) {
      showAlert(err.message)
    }
  })
}

// ---------- Resources ----------
async function loadResources() {
  tabs.resources.innerHTML = '<p class="empty-state">Loading…</p>'
  try {
    const { resources } = await api.resources()

    const order = []
    const map = new Map()
    resources.forEach((r) => {
      const key = r.type || 'Resources'
      if (!map.has(key)) { map.set(key, []); order.push(key) }
      map.get(key).push(r)
    })

    tabs.resources.innerHTML = `
      <div class="panel-head" style="margin-bottom:1rem;">
        <h3>Resources</h3>
        <button class="btn btn-primary btn-sm" id="new-resource-btn">+ New Resource / Section</button>
      </div>
      <div id="resource-sections">
        ${order.map((section) => `
          <div class="panel">
            <div class="panel-head">
              <h3 style="margin:0;">${escapeHtml(section)}</h3>
              <button class="btn btn-outline btn-sm" data-add-to="${escapeHtml(section)}">+ Add to this section</button>
            </div>
            <table>
              <thead><tr><th>Tag</th><th>Title</th><th>Link</th><th></th></tr></thead>
              <tbody>
                ${map.get(section).map((r) => `
                  <tr>
                    <td>${escapeHtml(r.tag)}</td>
                    <td>${escapeHtml(r.title)}</td>
                    <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(r.href)}</td>
                    <td class="row-actions">
                      <button class="btn btn-outline btn-sm" data-edit="${r.id}">Edit</button>
                      <button class="btn btn-danger btn-sm" data-delete="${r.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('') || '<div class="panel"><p class="empty-state">No resources yet. Click "+ New Resource / Section" to add your first one.</p></div>'}
      </div>
      <div id="resource-form-wrap"></div>
    `

    const existingSections = order

    document.getElementById('new-resource-btn').addEventListener('click', () => renderResourceForm(null, existingSections))
    tabs.resources.querySelectorAll('[data-add-to]').forEach((btn) => {
      btn.addEventListener('click', () => renderResourceForm(null, existingSections, btn.dataset.addTo))
    })
    tabs.resources.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const resource = resources.find((r) => r.id === btn.dataset.edit)
        renderResourceForm(resource, existingSections)
      })
    })
    tabs.resources.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this resource?')) return
        try { await api.deleteResource(btn.dataset.delete); loadResources() } catch (err) { showAlert(err.message) }
      })
    })
  } catch (err) {
    tabs.resources.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

function renderResourceForm(resource, existingSections = [], presetSection = '') {
  const isEdit = Boolean(resource)
  const wrap = document.getElementById('resource-form-wrap')
  const datalistId = 'section-options'

  wrap.innerHTML = `
    <div class="panel">
      <h3>${isEdit ? 'Edit Resource' : 'New Resource'}</h3>
      <form id="resource-form">
        <div class="form-group">
          <label>Section</label>
          <input name="type" list="${datalistId}" value="${escapeHtml(resource?.type || presetSection || '')}" placeholder="e.g. Free Notes, YouTube Videos, Demo Class, or type a brand new section name" required />
          <datalist id="${datalistId}">
            ${existingSections.map((s) => `<option value="${escapeHtml(s)}"></option>`).join('')}
          </datalist>
          <p style="color:var(--text-muted); font-size:0.78rem; margin-top:0.3rem;">
            Pick an existing section from the list, or type a new name to create a brand new section on the Free Resources page.
          </p>
        </div>
        <div class="form-group"><label>Tag (short label shown on the site)</label><input name="tag" value="${escapeHtml(resource?.tag || '')}" placeholder="PDF / YT / LIVE" /></div>
        <div class="form-group"><label>Title</label><input name="title" value="${escapeHtml(resource?.title || '')}" required /></div>
        <div class="form-group"><label>Link (URL or internal path like /enroll)</label><input name="href" value="${escapeHtml(resource?.href || '')}" /></div>
        <div class="row-actions" style="margin-top:1rem;">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Resource'}</button>
          <button type="button" class="btn btn-outline" id="cancel-resource">Cancel</button>
        </div>
      </form>
    </div>
  `
  document.getElementById('cancel-resource').addEventListener('click', () => { wrap.innerHTML = '' })
  document.getElementById('resource-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const payload = {
      type: fd.get('type'),
      tag: fd.get('tag'),
      title: fd.get('title'),
      href: fd.get('href'),
    }
    try {
      if (isEdit) await api.updateResource(resource.id, payload)
      else await api.createResource(payload)
      showAlert('Resource saved.', 'success')
      loadResources()
    } catch (err) {
      showAlert(err.message)
    }
  })
}

// ---------- Students ----------
async function loadStudents() {
  tabs.students.innerHTML = '<p class="empty-state">Loading…</p>'
  try {
    const [{ students }, { courses }] = await Promise.all([api.students(), api.courses()])

    tabs.students.innerHTML = `
      <div class="panel-head" style="margin-bottom:1rem;">
        <h3>Students</h3>
        <button class="btn btn-primary btn-sm" id="new-student-btn">+ New Student</button>
      </div>
      <div id="student-form-wrap"></div>
      ${students.length ? students.map((s) => `
        <div class="panel">
          <div class="panel-head">
            <div>
              <strong>${escapeHtml(s.name)}</strong>
              <div style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(s.email)}</div>
            </div>
            <div class="row-actions">
              <button class="btn btn-outline btn-sm" data-reset="${s.id}">Reset Password</button>
              <button class="btn btn-danger btn-sm" data-delete-student="${s.id}">Delete</button>
            </div>
          </div>
          <div>
            <label style="font-size:0.85rem; color:var(--text-muted);">Course access</label>
            <div class="course-access-list" style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-top:0.4rem;">
              ${courses.map((c) => `
                <label style="display:flex; align-items:center; gap:0.35rem; font-size:0.85rem;">
                  <input type="checkbox" data-access-student="${s.id}" data-access-course="${c.id}" ${(s.courseIds || []).includes(c.id) ? 'checked' : ''} style="width:auto;" />
                  ${escapeHtml(c.title)}
                </label>
              `).join('') || '<span class="empty-state">No courses yet — create one under Courses first.</span>'}
            </div>
          </div>
          <div id="reset-form-wrap-${s.id}"></div>
        </div>
      `).join('') : '<div class="panel"><p class="empty-state">No students yet. Click "+ New Student" to create the first login.</p></div>'}
    `

    document.getElementById('new-student-btn').addEventListener('click', () => renderStudentForm(courses))

    tabs.students.querySelectorAll('[data-access-student]').forEach((checkbox) => {
      checkbox.addEventListener('change', async () => {
        try {
          await api.setStudentAccess(checkbox.dataset.accessStudent, checkbox.dataset.accessCourse, checkbox.checked)
          showAlert('Access updated.', 'success')
        } catch (err) {
          checkbox.checked = !checkbox.checked
          showAlert(err.message)
        }
      })
    })

    tabs.students.querySelectorAll('[data-delete-student]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this student account? They will immediately lose access to all courses.')) return
        try { await api.deleteStudent(btn.dataset.deleteStudent); loadStudents() } catch (err) { showAlert(err.message) }
      })
    })

    tabs.students.querySelectorAll('[data-reset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const wrap = document.getElementById(`reset-form-wrap-${btn.dataset.reset}`)
        wrap.innerHTML = `
          <form class="row-actions" style="margin-top:0.75rem; align-items:center;">
            <input type="password" placeholder="New password" minlength="6" required style="max-width:220px;" />
            <button type="submit" class="btn btn-primary btn-sm">Set Password</button>
            <button type="button" class="btn btn-outline btn-sm" data-cancel-reset>Cancel</button>
          </form>
        `
        wrap.querySelector('[data-cancel-reset]').addEventListener('click', () => { wrap.innerHTML = '' })
        wrap.querySelector('form').addEventListener('submit', async (e) => {
          e.preventDefault()
          const password = e.target.querySelector('input').value
          try {
            await api.updateStudent(btn.dataset.reset, { password })
            showAlert('Password updated.', 'success')
            wrap.innerHTML = ''
          } catch (err) {
            showAlert(err.message)
          }
        })
      })
    })
  } catch (err) {
    tabs.students.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`
  }
}

function renderStudentForm(courses) {
  const wrap = document.getElementById('student-form-wrap')
  wrap.innerHTML = `
    <div class="panel">
      <h3>New Student</h3>
      <form id="student-form">
        <div class="form-group"><label>Name</label><input name="name" required /></div>
        <div class="form-group"><label>Email</label><input name="email" type="email" required /></div>
        <div class="form-group"><label>Password</label><input name="password" type="password" minlength="6" required /></div>
        <div class="form-group">
          <label>Grant access to</label>
          <div style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-top:0.4rem;">
            ${courses.map((c) => `
              <label style="display:flex; align-items:center; gap:0.35rem; font-size:0.85rem;">
                <input type="checkbox" name="courseIds" value="${c.id}" style="width:auto;" />
                ${escapeHtml(c.title)}
              </label>
            `).join('') || '<span class="empty-state">No courses yet.</span>'}
          </div>
        </div>
        <div class="row-actions" style="margin-top:1rem;">
          <button type="submit" class="btn btn-primary">Create Student</button>
          <button type="button" class="btn btn-outline" id="cancel-student">Cancel</button>
        </div>
      </form>
    </div>
  `
  document.getElementById('cancel-student').addEventListener('click', () => { wrap.innerHTML = '' })
  document.getElementById('student-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      password: fd.get('password'),
      courseIds: fd.getAll('courseIds'),
    }
    try {
      await api.createStudent(payload)
      showAlert('Student created.', 'success')
      loadStudents()
    } catch (err) {
      showAlert(err.message)
    }
  })
}

guardAndInit()
