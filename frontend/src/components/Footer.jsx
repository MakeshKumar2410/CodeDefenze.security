import { Link } from 'react-router-dom'
import Brand from './Brand'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            <img src="/logo-icon.png" alt="" />
            <Brand />
          </div>
          <p>
            Professional IT infrastructure and cybersecurity training for students
            and aspiring security professionals.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <div className="footer-links">
            <Link to="/course">Course Bundle</Link>
            <Link to="/resources">Free Resources</Link>
            <Link to="/certificate">Certificate Preview</Link>
            <Link to="/enroll">Enroll Now</Link>
          </div>
        </div>
        <div>
          <h4>Contact</h4>
          <div className="footer-links">
            <a href="mailto:makeshmk2004@gmail.com">makeshmk2004@gmail.com</a>
            <a href="tel:+918940364233">+91 89403 64233</a>
            <a href="tel:+918220579687">+91 82205 79687</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        © {new Date().getFullYear()} Codedefenze.security. All rights reserved.
      </div>
    </footer>
  )
}
