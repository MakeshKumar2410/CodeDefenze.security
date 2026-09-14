/**
 * Small fetch helper shared by every page that talks to the backend.
 * Keeps error handling consistent and avoids repeating fetch boilerplate.
 */

async function request(path, options = {}) {
  const res = await fetch(path, {
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

export const api = {
  health: () => request('/api/health'),
  courses: () => request('/api/courses'),
  resources: () => request('/api/resources'),
  home: () => request('/api/home'),
  about: () => request('/api/about'),
  testimonials: () => request('/api/testimonials'),
  submitTestimonial: (payload) =>
    request('/api/testimonials', { method: 'POST', body: JSON.stringify(payload) }),
  enroll: (payload) =>
    request('/api/enroll', { method: 'POST', body: JSON.stringify(payload) }),
  contact: (payload) =>
    request('/api/contact', { method: 'POST', body: JSON.stringify(payload) }),

  // Student login area
  studentLogin: (email, password) =>
    request('/api/student/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  studentLogout: () => request('/api/student/logout', { method: 'POST' }),
  studentMe: () => request('/api/student/me'),
  myCourses: () => request('/api/student/my-courses'),
  courseClasses: (courseId) => request(`/api/student/courses/${courseId}/classes`),
}
