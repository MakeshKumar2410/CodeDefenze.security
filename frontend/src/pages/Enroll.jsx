import { useEffect, useState } from 'react'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

const initial = {
  name: '',
  email: '',
  phone: '',
  college: '',
  course: '',
}

export default function Enroll() {
  usePageTitle('Enroll Now', 'Enroll in the IT Infrastructure & Cyber Security Bundle at Codedefenze.security.')

  const [form, setForm] = useState(initial)
  const [courses, setCourses] = useState([])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverOk, setServerOk] = useState(null)

  useEffect(() => {
    api
      .health()
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false))

    api
      .courses()
      .then((data) => {
        const list = data.courses || []
        setCourses(list)
        setForm((f) => ({ ...f, course: list[0]?.title || '' }))
      })
      .catch(() => {
        /* course list is a nice-to-have; enrollment form still works without it */
      })
  }, [])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.enroll(form)
      setForm((f) => ({ ...initial, course: f.course }))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err.message || 'Could not submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-banner page-banner-panel" style={{ textAlign: 'center', marginInline: 'auto' }}>
          <p className="eyebrow">Start your journey</p>
          <h1>Enroll Now</h1>
          <p style={{ marginInline: 'auto' }}>
            Fill in your details — our team receives your enrollment by email and
            will contact you with next steps.
          </p>
        </div>

        <div className="form-wrap form-card" style={{ marginTop: '2rem' }}>
          {serverOk === false && (
            <div className="form-error">
              Backend is not reachable right now. Please try again in a moment, or
              contact us directly.
            </div>
          )}
          {success && (
            <div className="form-success">
              Enrollment submitted successfully! Details were emailed to our team.
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Student Name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="10-digit mobile number"
              />
            </div>
            <div className="form-group">
              <label htmlFor="college">College</label>
              <input
                id="college"
                name="college"
                value={form.college}
                onChange={handleChange}
                required
                placeholder="College / University name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="course">Course Selection</label>
              <select
                id="course"
                name="course"
                value={form.course}
                onChange={handleChange}
                required
              >
                {courses.length === 0 && (
                  <option value="IT Infrastructure & Cyber Security Bundle">
                    IT Infrastructure & Cyber Security Bundle
                  </option>
                )}
                {courses.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading || serverOk === false}
            >
              {loading ? 'Submitting...' : 'Submit Enrollment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
