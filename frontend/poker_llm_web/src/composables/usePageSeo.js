import { watchEffect } from 'vue'
import { BRAND_NAME } from '@/seo/siteMetadata.js'

const ensureMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
    document.head.appendChild(element)
  }
  return element
}

const setMetaContent = (selector, attributes, content) => {
  const element = ensureMeta(selector, attributes)
  if (content == null || content === '') {
    element.remove()
    return
  }
  element.setAttribute('content', content)
}

const setCanonical = (url) => {
  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!url) {
    canonical?.remove()
    return
  }
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
}

const setStructuredData = (data) => {
  let script = document.getElementById('postsoma-structured-data')
  if (!data) {
    script?.remove()
    return
  }
  if (!script) {
    script = document.createElement('script')
    script.id = 'postsoma-structured-data'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data)
}

export const applyPageSeo = (page) => {
  if (typeof document === 'undefined' || !page) return

  document.title = page.title
  setMetaContent('meta[name="description"]', { name: 'description' }, page.description)
  setMetaContent('meta[name="robots"]', { name: 'robots' }, page.robots)
  setMetaContent('meta[property="og:type"]', { property: 'og:type' }, page.type || 'website')
  setMetaContent('meta[property="og:site_name"]', { property: 'og:site_name' }, BRAND_NAME)
  setMetaContent('meta[property="og:url"]', { property: 'og:url' }, page.canonical)
  setMetaContent('meta[property="og:title"]', { property: 'og:title' }, page.title)
  setMetaContent('meta[property="og:description"]', { property: 'og:description' }, page.description)
  setMetaContent('meta[property="og:image"]', { property: 'og:image' }, page.image)
  setMetaContent('meta[property="og:image:alt"]', { property: 'og:image:alt' }, page.imageAlt)
  setMetaContent('meta[name="twitter:card"]', { name: 'twitter:card' }, page.image ? 'summary' : null)
  setMetaContent('meta[name="twitter:title"]', { name: 'twitter:title' }, page.title)
  setMetaContent('meta[name="twitter:description"]', { name: 'twitter:description' }, page.description)
  setMetaContent('meta[name="twitter:image"]', { name: 'twitter:image' }, page.image)
  setCanonical(page.canonical)
  setStructuredData(page.structuredData)
}

export const usePageSeo = (pageRef) => {
  watchEffect(() => {
    applyPageSeo(pageRef.value)
  })
}
