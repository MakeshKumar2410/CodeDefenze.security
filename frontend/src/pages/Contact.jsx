import { useEffect, useState } from 'react'
import Brand from '../components/Brand'
import usePageTitle from '../hooks/usePageTitle'

const API = '/api/contact'

export default function Contact() {
  usePageTitle(
    'Contact Us',
    'Questions about the course, demo classes, or enrollment? Get in touch with Codedefenze.security.',
  )

  return (
    <div className="page">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info contact-panel">
            <p className="eyebrow">Get in touch</p>
            <h2>
              Contact <Brand />
            </h2>
            <p>
              Questions about the course, demo classes, or enrollment? Reach out
              — messages are emailed to our team through the backend server.
            </p>

            <div className="contact-list">
              <div className="contact-item">
                <label>Email</label>
                <a href="mailto:makeshmk2004@gmail.com">makeshmk2004@gmail.com</a>
              </div>
              <div className="contact-item">
                <label>Phone</label>
                <a href="tel:+918940364233">+91 89403 64233</a>
                <br />
                <a href="tel:+918220579687">+91 82205 79687</a>
              </div>
              <div className="contact-item">
                <label>LinkedIn</label>
                <span className="social-placeholder">LinkedIn profile coming soon</span>
              </div>
              <div className="contact-item">
                <label>WhatsApp</label>
                <a
                  className="social-placeholder social-link"
                  href="https://wa.me/918940364233"
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="contact-form-panel">
            <div className="section-head" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem' }}>Send a Message</h2>
              <p>Details are sent to makeshmk2004@gmail.com via backend</p>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactForm() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverOk, setServerOk] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false))
  }, [])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'contact' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      setSent(true)
      if (data.note) setInfo(data.note)
      setForm({ name: '', email: '', phone: '', message: '' })
      setTimeout(() => setSent(false), 6000)
    } catch (err) {
      const offline =
        err.message?.includes('Failed to fetch') || err.name === 'TypeError'
      setError(
        offline
          ? 'Backend is not running. Open a terminal and run: npm run dev:all'
          : err.message || 'Could not send. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {serverOk === false && (
        <div className="form-error">
          Backend offline. Start email server with <code>npm run dev:all</code>
        </div>
      )}
      {sent && (
        <div className="form-success">
          Message sent! Check makeshmk2004@gmail.com inbox (and spam).
        </div>
      )}
      {info && <div className="form-info">{info}</div>}
      {error && <div className="form-error">{error}</div>}
      <div className="form-group">
        <label htmlFor="c-name">Name</label>
        <input id="c-name" name="name" value={form.name} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="c-email">Email</label>
        <input
          id="c-email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="c-phone">Phone (optional)</label>
        <input id="c-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label htmlFor="c-message">Message</label>
        <textarea
          id="c-message"
          name="message"
          value={form.message}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading || serverOk === false}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
