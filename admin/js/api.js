// Base URL of the backend API. Change this if your backend runs elsewhere.
const API_BASE = window.CDZ_API_BASE || 'http://localhost:5000'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

// Same as request(), but for multipart/form-data (file uploads) — no
// Content-Type header, so the browser can set the multipart boundary itself.
async function uploadRequest(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`)
  }
  return data
}

// fetch() cannot report upload progress, so large video uploads use
// XMLHttpRequest instead — this only covers the browser-to-backend leg;
// the backend-to-storage-provider leg happens after the browser upload
// finishes and is reported via the resolved response's uploadStatus.
function uploadRequestWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}${path}`)
    xhr.withCredentials = true

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      })
    }
    xhr.addEventListener('load', () => {
      let data = {}
      try { data = JSON.parse(xhr.responseText) } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else reject(new Error(data.error || `Upload failed (${xhr.status})`))
    })
    xhr.addEventListener('error', () => reject(new Error('Upload failed — check your connection.')))
    xhr.send(formData)
  })
}

const api = {
  login: (email, password) =>
    request('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/admin/logout', { method: 'POST' }),
  me: () => request('/api/admin/me'),
  stats: () => request('/api/admin/dashboard-stats'),
  weeklyReport: () => request('/api/admin/reports/weekly'),

  enrollments: () => request('/api/admin/enrollments'),
  updateEnrollmentStatus: (id, status) =>
    request(`/api/admin/enrollments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteEnrollment: (id) => request(`/api/admin/enrollments/${id}`, { method: 'DELETE' }),

  messages: () => request('/api/admin/messages'),
  markMessageRead: (id) => request(`/api/admin/messages/${id}/read`, { method: 'PATCH' }),
  deleteMessage: (id) => request(`/api/admin/messages/${id}`, { method: 'DELETE' }),

  testimonials: () => request('/api/admin/testimonials'),
  updateTestimonial: (id, payload) =>
    request(`/api/admin/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTestimonial: (id) => request(`/api/admin/testimonials/${id}`, { method: 'DELETE' }),

  courses: () => request('/api/admin/courses'),
  createCourse: (payload) => request('/api/admin/courses', { method: 'POST', body: JSON.stringify(payload) }),
  updateCourse: (id, payload) => request(`/api/admin/courses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCourse: (id) => request(`/api/admin/courses/${id}`, { method: 'DELETE' }),

  resources: () => request('/api/admin/resources'),
  createResource: (payload) => request('/api/admin/resources', { method: 'POST', body: JSON.stringify(payload) }),
  updateResource: (id, payload) => request(`/api/admin/resources/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteResource: (id) => request(`/api/admin/resources/${id}`, { method: 'DELETE' }),

  // Daily / recorded classes
  classes: (courseId) => request(`/api/admin/courses/${courseId}/classes`),
  createClass: (courseId, payload) =>
    request(`/api/admin/courses/${courseId}/classes`, { method: 'POST', body: JSON.stringify(payload) }),
  updateClass: (classId, payload) =>
    request(`/api/admin/classes/${classId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteClass: (classId) => request(`/api/admin/classes/${classId}`, { method: 'DELETE' }),
  uploadClassVideo: (courseId, classId, file, onProgress) => {
    const fd = new FormData()
    fd.append('video', file)
    return uploadRequestWithProgress(`/api/admin/courses/${courseId}/classes/${classId}/video`, fd, onProgress)
  },
  deleteClassVideo: (classId) => request(`/api/admin/classes/${classId}/video`, { method: 'DELETE' }),
  classVideoUrl: (classId) => `${API_BASE}/api/admin/classes/${classId}/video`,

  // Students & course access
  students: () => request('/api/admin/students'),
  createStudent: (payload) => request('/api/admin/students', { method: 'POST', body: JSON.stringify(payload) }),
  updateStudent: (id, payload) => request(`/api/admin/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  setStudentAccess: (id, courseId, grant) =>
    request(`/api/admin/students/${id}/access`, { method: 'PATCH', body: JSON.stringify({ courseId, grant }) }),
  deleteStudent: (id) => request(`/api/admin/students/${id}`, { method: 'DELETE' }),

  // --- CMS: image upload (shared by Home + About forms) ---
  uploadImage: (file) => {
    const fd = new FormData()
    fd.append('image', file)
    return uploadRequest('/api/admin/uploads/image', fd)
  },

  // --- CMS: Home page ---
  adminHome: () => request('/api/admin/home'),
  updateHero: (payload) => request('/api/admin/home/hero', { method: 'PUT', body: JSON.stringify(payload) }),
  updateCertificatePreview: (payload) =>
    request('/api/admin/home/certificate-preview', { method: 'PUT', body: JSON.stringify(payload) }),

  createHighlight: (payload) => request('/api/admin/home/highlights', { method: 'POST', body: JSON.stringify(payload) }),
  updateHighlight: (id, payload) => request(`/api/admin/home/highlights/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteHighlight: (id) => request(`/api/admin/home/highlights/${id}`, { method: 'DELETE' }),
  toggleHighlight: (id) => request(`/api/admin/home/highlights/${id}/toggle`, { method: 'PATCH' }),
  moveHighlight: (id, direction) => request(`/api/admin/home/highlights/${id}/move`, { method: 'PATCH', body: JSON.stringify({ direction }) }),

  createWhyUs: (payload) => request('/api/admin/home/why-us', { method: 'POST', body: JSON.stringify(payload) }),
  updateWhyUs: (id, payload) => request(`/api/admin/home/why-us/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteWhyUs: (id) => request(`/api/admin/home/why-us/${id}`, { method: 'DELETE' }),
  toggleWhyUs: (id) => request(`/api/admin/home/why-us/${id}/toggle`, { method: 'PATCH' }),
  moveWhyUs: (id, direction) => request(`/api/admin/home/why-us/${id}/move`, { method: 'PATCH', body: JSON.stringify({ direction }) }),

  createFaq: (payload) => request('/api/admin/home/faqs', { method: 'POST', body: JSON.stringify(payload) }),
  updateFaq: (id, payload) => request(`/api/admin/home/faqs/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFaq: (id) => request(`/api/admin/home/faqs/${id}`, { method: 'DELETE' }),
  toggleFaq: (id) => request(`/api/admin/home/faqs/${id}/toggle`, { method: 'PATCH' }),
  moveFaq: (id, direction) => request(`/api/admin/home/faqs/${id}/move`, { method: 'PATCH', body: JSON.stringify({ direction }) }),

  // --- CMS: About page ---
  adminAbout: () => request('/api/admin/about'),
  updateAboutIntro: (payload) => request('/api/admin/about/intro', { method: 'PUT', body: JSON.stringify(payload) }),

  createAboutSection: (payload) => request('/api/admin/about/sections', { method: 'POST', body: JSON.stringify(payload) }),
  updateAboutSection: (id, payload) => request(`/api/admin/about/sections/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAboutSection: (id) => request(`/api/admin/about/sections/${id}`, { method: 'DELETE' }),
  toggleAboutSection: (id) => request(`/api/admin/about/sections/${id}/toggle`, { method: 'PATCH' }),
  moveAboutSection: (id, direction) => request(`/api/admin/about/sections/${id}/move`, { method: 'PATCH', body: JSON.stringify({ direction }) }),

  createTrainer: (payload) => request('/api/admin/about/trainers', { method: 'POST', body: JSON.stringify(payload) }),
  updateTrainer: (id, payload) => request(`/api/admin/about/trainers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTrainer: (id) => request(`/api/admin/about/trainers/${id}`, { method: 'DELETE' }),
  toggleTrainer: (id) => request(`/api/admin/about/trainers/${id}/toggle`, { method: 'PATCH' }),
  moveTrainer: (id, direction) => request(`/api/admin/about/trainers/${id}/move`, { method: 'PATCH', body: JSON.stringify({ direction }) }),
}
