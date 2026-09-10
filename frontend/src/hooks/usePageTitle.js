import { useEffect } from 'react'

/**
 * Sets document.title (and optionally the meta description) per page.
 * Fixes the bug where every route shared one static <title>/description.
 */
export default function usePageTitle(title, description) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Codedefenze.security` : 'Codedefenze.security'
    document.title = fullTitle

    if (description) {
      let tag = document.querySelector('meta[name="description"]')
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', 'description')
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', description)
    }
  }, [title, description])
}
