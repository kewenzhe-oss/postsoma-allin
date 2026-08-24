import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { buildAboutStructuredData, getPageSeo } from '../src/seo/siteMetadata.js'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(scriptDir, '../dist')
const indexPath = resolve(distDir, 'index.html')

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const replaceMeta = (html, attribute, key, content) => {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>`, 'i')
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

const aboutSeo = getPageSeo({ routeName: 'About', locale: 'en' })
let html = await readFile(indexPath, 'utf8')

html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(aboutSeo.title)}</title>`)
html = replaceMeta(html, 'name', 'description', aboutSeo.description)
html = replaceMeta(html, 'name', 'robots', aboutSeo.robots)
html = replaceMeta(html, 'property', 'og:url', aboutSeo.canonical)
html = replaceMeta(html, 'property', 'og:title', aboutSeo.title)
html = replaceMeta(html, 'property', 'og:description', aboutSeo.description)
html = replaceMeta(html, 'name', 'twitter:title', aboutSeo.title)
html = replaceMeta(html, 'name', 'twitter:description', aboutSeo.description)
html = html.replace(
  /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?\s*>/i,
  `<link rel="canonical" href="${aboutSeo.canonical}" />`
)
html = html.replace(
  /<script\s+id="postsoma-structured-data"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
  `<script id="postsoma-structured-data" type="application/ld+json">${JSON.stringify(buildAboutStructuredData('en'))}</script>`
)

const aboutFallback = `<!-- POSTSOMA_FALLBACK_START -->
      <noscript>
        <main>
          <h1>Understand the method, evidence, and limits.</h1>
          <p>POSTSOMA · ALLIN helps people ask better questions before a poker decision. It is not a solver, an authoritative strategy database, or a real-money poker service.</p>
          <h2>Five-question method</h2>
          <ol>
            <li>Hand — What do I have?</li>
            <li>Context — What spot am I in?</li>
            <li>Range — What could we each have?</li>
            <li>Price — What does this price require?</li>
            <li>Risk — What could distort the decision?</li>
          </ol>
          <p>Read the complete machine knowledge at <a href="/llms-full.txt">llms-full.txt</a>.</p>
        </main>
      </noscript>
      <!-- POSTSOMA_FALLBACK_END -->`

html = html.replace(
  /<!-- POSTSOMA_FALLBACK_START -->[\s\S]*?<!-- POSTSOMA_FALLBACK_END -->/,
  aboutFallback
)

const aboutDir = resolve(distDir, 'about')
await mkdir(aboutDir, { recursive: true })
await writeFile(resolve(aboutDir, 'index.html'), html, 'utf8')

console.log('Generated static SEO entry: dist/about/index.html')
