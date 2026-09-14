import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../lib/api'

const emptyForm = {
  name: '',
  college: '',
  course: '',
  review: '',
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [index, setIndex] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const total = testimonials.length
  const current = testimonials[index] || testimonials[0]

  useEffect(() => {
    let cancelled = false
    api
      .testimonials()
      .then((t) => {
        if (cancelled) return
        setTestimonials(t.testimonials || [])
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Fetched separately from testimonials on purpose: if this call fails,
    // it should not take down the reviews slider or hide the submit button.
    api
      .courses()
      .then((c) => {
        if (cancelled) return
        setCourses(c.courses || [])
        setForm((f) => ({ ...f, course: c.courses?.[0]?.title || '' }))
      })
      .catch(() => {
        /* course list is a nice-to-have for the review form's dropdown only */
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (index >= testimonials.length) setIndex(0)
  }, [testimonials.length, index])

  useEffect(() => {
    if (!formOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setFormOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [formOpen])

  function prev() {
    setIndex((i) => (i - 1 + total) % total)
  }

  function next() {
    setIndex((i) => (i + 1) % total)
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.review.trim()) return
    setSubmitError('')
    setSubmitting(true)
    try {
      await api.submitTestimonial({
        name: form.name.trim(),
        college: form.college.trim() || 'Student',
        course: form.course,
        review: form.review.trim(),
      })
      const refreshed = await api.testimonials()
      setTestimonials(refreshed.testimonials || [])
      setForm((f) => ({ ...emptyForm, course: f.course }))
      setSubmitted(true)
      setFormOpen(false)
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setSubmitError(err.message || 'Could not submit your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="testimonials-section">
      <div className="testimonial-box">
        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading reviews…</p>
        )}

        {!loading && (loadError || !current) && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No reviews to show yet — be the first to share yours!
          </p>
        )}

        {!loading && !loadError && current && (
          <div className="slider">
            <div className="slider-track" key={current.id}>
              <div className="quote-mark" aria-hidden="true">
                “
              </div>
              <p className="slider-quote">{current.review}</p>
              <div className="slider-author">{current.name}</div>
              <div className="slider-meta">
                {current.college} · {current.course}
              </div>
            </div>
            <div className="slider-nav">
              <button type="button" className="slider-btn" onClick={prev} aria-label="Previous review">
                ‹
              </button>
              <button type="button" className="slider-btn" onClick={next} aria-label="Next review">
                ›
              </button>
            </div>
            <div className="slider-dots">
              {testimonials.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  className={`slider-dot ${i === index ? 'active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {submitted && (
          <div className="form-success" style={{ marginTop: '1.25rem' }}>
            Thank you! Your review has been posted.
          </div>
        )}

        {/* This button is intentionally outside every loading/error branch above,
            so it is always visible regardless of whether the slider itself loaded. */}
        <div className="testimonial-actions">
          <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
            Submit Your Review
          </button>
        </div>
      </div>

      {formOpen && createPortal(
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFormOpen(false)
          }}
          role="presentation"
        >
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="review-title">
            <div className="modal-head">
              <h3 id="review-title">Submit Your Review</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setFormOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="modal-sub">
              Your review will be posted to the site right away.
            </p>
            {submitError && <div className="form-error">{submitError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="rev-name">Student Name</label>
                <input
                  id="rev-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rev-college">College</label>
                <input
                  id="rev-college"
                  name="college"
                  value={form.college}
                  onChange={handleChange}
                  placeholder="Your college / institution"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rev-course">Course</label>
                <select id="rev-course" name="course" value={form.course} onChange={handleChange}>
                  {courses.length === 0 && (
                    <option value="">General</option>
                  )}
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="rev-text">Your Review</label>
                <textarea
                  id="rev-text"
                  name="review"
                  value={form.review}
                  onChange={handleChange}
                  required
                  placeholder="Tell others about your experience..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
