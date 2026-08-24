import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  AI_CRAWLER_TOKENS,
  ABOUT_URL,
  PRIVATE_INDEX_PATHS,
  PUBLIC_ROUTES,
  SITE_ORIGIN,
  SITE_URL
} from '../src/seo/siteMetadata.js'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(scriptDir, '..')
const shouldCheckDist = process.argv.includes('--dist')
const failures = []

const assert = (condition, message) => {
  if (!condition) failures.push(message)
}

const read = (path) => readFile(resolve(rootDir, path), 'utf8')

const [indexHtml, robots, sitemap, llms, llmsFull, router, aboutView, metadata, vercel] = await Promise.all([
  read('index.html'),
  read('public/robots.txt'),
  read('public/sitemap.xml'),
  read('public/llms.txt'),
  read('public/llms-full.txt'),
  read('src/router/index.js'),
  read('src/views/About.vue'),
  read('src/seo/siteMetadata.js'),
  read('vercel.json')
])

const controlledText = [indexHtml, robots, sitemap, llms, llmsFull, router, aboutView, metadata, vercel].join('\n')
for (const staleOrigin of ['postsoma-allin.com', 'prayselah.org']) {
  assert(!controlledText.includes(staleOrigin), `stale origin remains: ${staleOrigin}`)
}

assert(indexHtml.includes(`<link rel="canonical" href="${SITE_URL}"`), 'home canonical is missing or incorrect')
assert(indexHtml.includes(`content="${SITE_ORIGIN}/app_icon.png"`), 'absolute social image URL is missing')
assert(!indexHtml.includes('display: none'), 'hidden SEO fallback content must not be used')
assert(!indexHtml.includes('SearchAction'), 'SearchAction must not be added without real site search')
assert(!/AggregateRating|"Review"/.test(indexHtml), 'unverified rating/review schema detected')

const jsonLdMatch = indexHtml.match(/<script\s+id="postsoma-structured-data"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i)
assert(Boolean(jsonLdMatch), 'home JSON-LD script is missing')
let jsonLd = null
if (jsonLdMatch) {
  try {
    jsonLd = JSON.parse(jsonLdMatch[1])
  } catch (error) {
    failures.push(`home JSON-LD is invalid JSON: ${error.message}`)
  }
}

if (jsonLd) {
  const graph = Array.isArray(jsonLd['@graph']) ? jsonLd['@graph'] : []
  const ids = new Set(graph.map((item) => item?.['@id']).filter(Boolean))
  const refs = []
  const collectRefs = (value) => {
    if (Array.isArray(value)) return value.forEach(collectRefs)
    if (!value || typeof value !== 'object') return
    if (typeof value['@id'] === 'string' && Object.keys(value).length === 1) refs.push(value['@id'])
    Object.values(value).forEach(collectRefs)
  }
  graph.forEach(collectRefs)
  refs.forEach((ref) => assert(ids.has(ref), `JSON-LD @id reference has no graph target: ${ref}`))
  for (const type of ['Organization', 'WebSite', 'SoftwareApplication', 'WebPage', 'HowTo']) {
    assert(graph.some((item) => item?.['@type'] === type), `home JSON-LD is missing ${type}`)
  }
}

const robotGroups = robots.split(/\n\s*\n/).filter((block) => /^User-agent:/m.test(block))
for (const token of ['*', ...AI_CRAWLER_TOKENS]) {
  const group = robotGroups.find((block) => block.split('\n').some((line) => line.trim() === `User-agent: ${token}`))
  assert(Boolean(group), `robots.txt is missing User-agent: ${token}`)
  if (group) {
    PRIVATE_INDEX_PATHS.forEach((path) => {
      assert(group.includes(`Disallow: ${path}`), `robots group for ${token} does not exclude ${path}`)
    })
  }
}
assert(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`), 'robots sitemap URL is incorrect')

const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const expectedLocs = PUBLIC_ROUTES.map((route) => route.url)
assert(sitemapLocs.length === expectedLocs.length, 'sitemap URL count does not match PUBLIC_ROUTES')
expectedLocs.forEach((url) => assert(sitemapLocs.includes(url), `sitemap is missing ${url}`))
sitemapLocs.forEach((url) => assert(url.startsWith(`${SITE_ORIGIN}/`), `cross-origin sitemap URL: ${url}`))
PRIVATE_INDEX_PATHS.forEach((path) => assert(!sitemap.includes(path), `private path leaked into sitemap: ${path}`))

for (const requiredUrl of [SITE_URL, ABOUT_URL, `${SITE_ORIGIN}/llms-full.txt`, `${SITE_ORIGIN}/sitemap.xml`]) {
  assert(llms.includes(requiredUrl), `llms.txt is missing ${requiredUrl}`)
}
for (const requiredBoundary of ['hu-btn-rfi-100bb-v1', 'baseline-v1', 'pot-odds-v1', 'not solver-calibrated', 'stated exercise assumption']) {
  assert(llmsFull.toLowerCase().includes(requiredBoundary.toLowerCase()), `llms-full.txt is missing boundary: ${requiredBoundary}`)
}
for (const forbidden of ['/room/', '/api/', '/ws/']) {
  const publicUrl = `${SITE_ORIGIN}${forbidden}`
  assert(!llms.includes(publicUrl) && !llmsFull.includes(publicUrl), `private URL leaked into llms files: ${publicUrl}`)
}

assert(router.includes("path: '/about'"), 'About route is missing')
assert(router.includes("meta: { robots: 'noindex' }"), 'Room route noindex metadata is missing')
assert(/citation guide/i.test(aboutView) && aboutView.includes('引用指南'), 'About citation guide is incomplete')
assert(vercel.includes('X-Robots-Tag'), 'Vercel X-Robots-Tag headers are missing')
assert(vercel.includes('/about/index.html'), 'Vercel About static rewrite is missing')

const favicon = await readFile(resolve(rootDir, 'public/favicon.png'))
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
assert(pngSignature.every((byte, index) => favicon[index] === byte), 'favicon.png bytes are not PNG')

if (shouldCheckDist) {
  const distIndexPath = resolve(rootDir, 'dist/index.html')
  const distAboutPath = resolve(rootDir, 'dist/about/index.html')
  assert(existsSync(distIndexPath), 'dist/index.html is missing')
  assert(existsSync(distAboutPath), 'dist/about/index.html is missing')
  if (existsSync(distAboutPath)) {
    const distAbout = await readFile(distAboutPath, 'utf8')
    assert(distAbout.includes(`href="${ABOUT_URL}"`), 'built About canonical is incorrect')
    assert(distAbout.includes('AboutPage'), 'built About JSON-LD is missing AboutPage')
    assert(!distAbout.includes('SearchAction'), 'built About contains SearchAction')
  }
}

if (failures.length) {
  console.error('SEO/GEO checks failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`SEO/GEO checks passed (${AI_CRAWLER_TOKENS.length} explicit AI crawler tokens, ${expectedLocs.length} public sitemap URLs${shouldCheckDist ? ', dist verified' : ''}).`)
