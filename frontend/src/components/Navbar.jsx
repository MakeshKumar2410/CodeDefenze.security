import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import Brand from './Brand'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/course', label: 'Course' },
  { to: '/resources', label: 'Free Resources' },
  { to: '/certificate', label: 'Certificate' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <img
            src="/logo-icon.png"
            alt="Codedefenze logo"
            style={{ height: 60, width: 'auto', display: 'block', objectFit: 'contain' }}
          />
        </Link>

        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/student/login" onClick={() => setOpen(false)}>
            Student Login
          </NavLink>
          <NavLink to="/enroll" className="nav-cta" onClick={() => setOpen(false)}>
            Enroll Now
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
