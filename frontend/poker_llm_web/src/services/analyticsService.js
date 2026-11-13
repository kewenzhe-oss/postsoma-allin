/**
 * PostSoma Poker Lab (poker_lab) - Unified Dual-Engine Telemetry Service
 * GA4 Dual-Track (Global Roll-up + Project Property) & Self-Hosted Umami
 */

import {
  GA_ROLLUP_ID,
  GA_PROJECT_ID,
  GA_PROJECT_NAME,
  GA_COGNITIVE_LAYER,
  UMAMI_WEBSITE_ID,
  UMAMI_SCRIPT_URL,
  CROSS_DOMAIN_LIST,
  isLocalHostname,
  isValidGaId
} from '@/config/analytics'

let isInitialized = false
let lastTrackedPath = null

function sanitizePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return '/'
  const [pathname] = rawPath.split('?')
  if (pathname.startsWith('/room/')) {
    return '/room/[redacted]'
  }
  return pathname || '/'
}

function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl
  try {
    const parsed = new URL(rawUrl, window.location.origin)
    if (parsed.pathname.startsWith('/room/')) {
      parsed.pathname = '/room/[redacted]'
      parsed.search = ''
      parsed.hash = ''
    }
    return parsed.toString()
  } catch {
    return sanitizePath(rawUrl)
  }
}

export function initAnalytics() {
  if (typeof window === 'undefined') return
  if (isLocalHostname(window.location.hostname)) {
    return
  }
  if (isInitialized) return

  const hasRollup = isValidGaId(GA_ROLLUP_ID)
  const hasProject = isValidGaId(GA_PROJECT_ID) && GA_PROJECT_ID !== GA_ROLLUP_ID
  const primaryGaId = hasRollup ? GA_ROLLUP_ID : hasProject ? GA_PROJECT_ID : ''

  if (primaryGaId && !document.getElementById('postsoma-ga4-gtag')) {
    const gtagScript = document.createElement('script')
    gtagScript.id = 'postsoma-ga4-gtag'
    gtagScript.async = true
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryGaId)}`
    document.head.appendChild(gtagScript)

    window.dataLayer = window.dataLayer || []
    const gtag = function (...args) {
      window.dataLayer.push(args)
    }
    window.gtag = window.gtag || gtag

    window.gtag('js', new Date())
    window.gtag('set', 'linker', { domains: CROSS_DOMAIN_LIST })
    window.gtag('set', {
      project_name: GA_PROJECT_NAME,
      cognitive_layer: GA_COGNITIVE_LAYER
    })

    if (hasRollup) {
      window.gtag('config', GA_ROLLUP_ID, {
        project_name: GA_PROJECT_NAME,
        cognitive_layer: GA_COGNITIVE_LAYER,
        send_page_view: false
      })
    }

    if (hasProject) {
      window.gtag('config', GA_PROJECT_ID, {
        project_name: GA_PROJECT_NAME,
        cognitive_layer: GA_COGNITIVE_LAYER,
        send_page_view: false
      })
    }
  }

  if (UMAMI_WEBSITE_ID && UMAMI_SCRIPT_URL && !document.getElementById('postsoma-umami-script')) {
    window.__postsomaUmamiBeforeSend = (_type, payload) => {
      if (!payload || typeof payload !== 'object') return payload
      const next = { ...payload }
      if (typeof next.url === 'string') {
        next.url = sanitizePath(next.url)
      }
      if (typeof next.referrer === 'string' && next.referrer.includes('/room/')) {
        next.referrer = sanitizeUrl(next.referrer)
      }
      return next
    }

    const umamiScript = document.createElement('script')
    umamiScript.id = 'postsoma-umami-script'
    umamiScript.defer = true
    umamiScript.src = UMAMI_SCRIPT_URL
    umamiScript.setAttribute('data-website-id', UMAMI_WEBSITE_ID)
    umamiScript.setAttribute('data-before-send', '__postsomaUmamiBeforeSend')
    document.head.appendChild(umamiScript)
  }

  isInitialized = true
}

export function trackPageView(path, title) {
  if (typeof window === 'undefined') return
  if (isLocalHostname(window.location.hostname)) return

  const safePath = sanitizePath(path)
  if (lastTrackedPath === safePath) return
  lastTrackedPath = safePath

  const pageTitle = title || document.title

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: safePath,
      page_location: sanitizeUrl(window.location.href),
      page_title: pageTitle,
      project_name: GA_PROJECT_NAME,
      cognitive_layer: GA_COGNITIVE_LAYER
    })
  }
}
