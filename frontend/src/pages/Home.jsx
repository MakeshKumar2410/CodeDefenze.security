import { Link } from 'react-router-dom'
import Terminal from '../components/Terminal'
import Testimonials from '../components/Testimonials'
import CertificatePreview from '../components/CertificatePreview'
import Brand from '../components/Brand'
import usePageTitle from '../hooks/usePageTitle'

const highlights = [
  {
    icon: 'infra',
    title: 'IT Infrastructure Mastery',
    text: 'Networking, servers, cloud basics, and system administration foundations built for real environments.',
  },
  {
    icon: 'shield',
    title: 'Cybersecurity Defense',
    text: 'Threat modeling, ethical hacking fundamentals, SOC awareness, and hands-on security labs.',
  },
  {
    icon: 'career',
    title: 'Career-Ready Bundle',
    text: 'One integrated path covering both infrastructure and security — with certification and mentor support.',
  },
]

const whyUs = [
  {
    num: '01',
    title: 'Industry-Aligned Syllabus',
    text: 'Curriculum designed around what companies expect from junior IT and security professionals.',
  },
  {
    num: '02',
    title: 'Hands-On Labs',
    text: 'Learn by doing — configure networks, simulate attacks, and practice defensive responses.',
  },
  {
    num: '03',
    title: 'Expert Mentorship',
    text: 'Train under Makeshkumar, Founder and Lead Technical Trainer, with dedicated career guidance.',
  },
  {
    num: '04',
    title: 'Verified Certificate',
    text: 'Earn a completion certificate that showcases your skills to employers and recruiters.',
  },
]

const stats = [
  { value: '12', label: 'Week Program' },
  { value: '8+', label: 'Core Modules' },
  { value: '100%', label: 'Lab Focused' },
  { value: '1:1', label: 'Mentor Support' },
]

const faqs = [
  {
    q: 'Who is this course for?',
    a: 'Students and freshers aiming for IT support, networking, or entry-level cybersecurity roles.',
  },
  {
    q: 'Do I need prior experience?',
    a: 'Basic computer knowledge is enough. We start from foundations and build up to security labs.',
  },
  {
    q: 'Is the certificate recognized?',
    a: 'You receive a Codedefenze.security completion certificate after assessment — ideal for resumes and LinkedIn.',
  },
  {
    q: 'How do demo classes work?',
    a: 'Book a free demo from Free Resources or Contact us. Experience our teaching style before you enroll.',
  },
]

export default function Home() {
  usePageTitle(
    undefined,
    'Professional IT Infrastructure & Cybersecurity training institute. Build secure systems, defend modern infrastructure.',
  )

  return (
    <>
      <section className="hero hero-solo">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container hero-solo-inner">
          <p className="eyebrow">IT + Cybersecurity Training Institute</p>
          <h1 className="hero-brand">
            <Brand />
          </h1>
          <p className="hero-headline">
            Build secure systems. Defend modern infrastructure.
          </p>
          <p className="hero-sub hero-sub-center">
            A professional training institute for students and aspiring
            professionals ready to master IT infrastructure and cybersecurity.
          </p>
          <div className="hero-actions hero-actions-center">
            <Link to="/enroll" className="btn btn-primary">
              Enroll Now
            </Link>
            <Link to="/course" className="btn btn-outline">
              View Course
            </Link>
            <a href="#platform" className="btn btn-ghost">
              See Platform ↓
            </a>
          </div>
        </div>
      </section>

      <section id="platform" className="section terminal-section">
        <div className="container">
          <div className="section-head">
            <h2>Live Platform Preview</h2>
            <p>
              A cyber-security style terminal that shows how Codedefenze.security
              positions itself as a hands-on training platform.
            </p>
          </div>
          <div className="terminal-wrap">
            <Terminal />
          </div>
        </div>
      </section>

      <section className="section stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Course Highlights</h2>
            <p>
              Everything you need to start a career at the intersection of IT
              operations and cyber defense.
            </p>
          </div>
          <div className="highlight-grid">
            {highlights.map((h) => (
              <article key={h.title} className="feature-card">
                <div className={`feature-icon icon-${h.icon}`} aria-hidden="true" />
                <h3>{h.title}</h3>
                <p>{h.text}</p>
                <Link to="/course" className="feature-link">
                  Explore syllabus →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>Why Choose Us</h2>
            <p>
              Practical training, clear mentoring, and a pathway from classroom
              concepts to job-ready skills.
            </p>
          </div>
          <div className="why-grid">
            {whyUs.map((w) => (
              <article key={w.num} className="why-card">
                <span className="why-num">{w.num}</span>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2>Ready to start your cybersecurity journey?</h2>
            <p>Join the IT Infrastructure & Cyber Security Bundle today.</p>
          </div>
          <div className="cta-band-actions">
            <Link to="/enroll" className="btn btn-primary">
              Enroll Now
            </Link>
            <Link to="/resources" className="btn btn-ghost">
              Free Demo Class
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Student Testimonials</h2>
            <p>Hear from learners — submit your review and it appears live on the site.</p>
          </div>
          <Testimonials />
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>Certificate Preview</h2>
            <p>Sample certificate awarded on successful course completion.</p>
          </div>
          <div className="cert-frame">
            <CertificatePreview />
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/certificate" className="btn btn-outline">
              View Full Certificate Page
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Frequently Asked Questions</h2>
            <p>Quick answers before you enroll or book a demo.</p>
          </div>
          <div className="faq-list">
            {faqs.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
