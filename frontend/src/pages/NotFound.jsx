import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'

export default function NotFound() {
  usePageTitle('Page Not Found', 'The page you are looking for does not exist.')

  return (
    <div className="page">
      <div className="container">
        <div className="page-banner page-banner-panel" style={{ textAlign: 'center' }}>
          <p className="eyebrow">404</p>
          <h1>Page Not Found</h1>
          <p style={{ marginInline: 'auto' }}>
            The page you're looking for doesn't exist or may have moved.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
