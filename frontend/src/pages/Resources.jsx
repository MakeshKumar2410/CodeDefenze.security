import { useEffect, useState } from 'react'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

export default function Resources() {
  usePageTitle(
    'Free Resources',
    'Notes, YouTube videos, and demo class links to explore cybersecurity before you enroll.',
  )

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .resources()
      .then((data) => {
        if (cancelled) return
        const all = data.resources || []
        // Group dynamically by section name (r.type) in the order each
        // section first appears, so a new section added from the admin
        // panel shows up automatically without any code changes.
        const order = []
        const map = new Map()
        all.forEach((r) => {
          const key = r.type || 'Resources'
          if (!map.has(key)) {
            map.set(key, [])
            order.push(key)
          }
          map.get(key).push(r)
        })
        setGroups(order.map((name) => ({ name, items: map.get(name) })))
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <div className="container">
        <div className="page-banner page-banner-panel">
          <p className="eyebrow">Learn free</p>
          <h1>Free Resources</h1>
          <p>
            Notes, YouTube videos, and demo class links to explore cybersecurity
            before you enroll.
          </p>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2.5rem' }}>
            Loading resources…
          </p>
        )}

        {error && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2.5rem' }}>
            Resources are unavailable right now. Please check back soon.
          </p>
        )}

        {!loading && !error && groups.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2.5rem' }}>
            No resources added yet. Check back soon.
          </p>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="resource-grid" style={{ marginTop: '2.5rem' }}>
            {groups.map((group) => (
              <div key={group.name} className="resource-block info-card">
                <h3>{group.name}</h3>
                <div className="resource-links">
                  {group.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      target={item.href?.startsWith('http') ? '_blank' : undefined}
                      rel={item.href?.startsWith('http') ? 'noreferrer' : undefined}
                    >
                      <span className="tag">{item.tag}</span>
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
