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
  uploadClassVideo: (courseId, classId, file) => {
    const fd = new FormData()
    fd.append('video', file)
    return uploadRequest(`/api/admin/courses/${courseId}/classes/${classId}/video`, fd)
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
}
