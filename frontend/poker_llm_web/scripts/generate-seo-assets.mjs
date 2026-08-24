import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  AI_CRAWLER_TOKENS,
  PRIVATE_INDEX_PATHS,
  PUBLIC_ROUTES,
  SITE_ORIGIN
} from '../src/seo/siteMetadata.js'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(scriptDir, '../public')

const groups = Object.freeze({
  discovery: Object.freeze([
    'OAI-SearchBot',
    'PerplexityBot',
    'Claude-User',
    'Applebot',
    'Googlebot',
    'Amzn-SearchBot'
  ]),
  userRetrieval: Object.freeze(['ChatGPT-User', 'Perplexity-User']),
  extendedUse: Object.freeze([
    'GPTBot',
    'ClaudeBot',
    'anthropic-ai',
    'Applebot-Extended',
    'Google-Extended',
    'Amazonbot',
    'Bytespider',
    'CCBot',
    'Diffbot'
  ])
})

const listedTokens = Object.values(groups).flat()
if (
  listedTokens.length !== AI_CRAWLER_TOKENS.length ||
  listedTokens.some((token) => !AI_CRAWLER_TOKENS.includes(token))
) {
  throw new Error('Crawler groups must match AI_CRAWLER_TOKENS exactly')
}

const ruleBlock = (tokens) => [
  ...tokens.map((token) => `User-agent: ${token}`),
  'Allow: /',
  ...PRIVATE_INDEX_PATHS.map((path) => `Disallow: ${path}`)
].join('\n')

const robots = [
  '# POSTSOMA · ALLIN — public crawler policy',
  `# Canonical origin: ${SITE_ORIGIN}/`,
  '',
  ruleBlock(['*']),
  '',
  '# Search and answer-engine discovery',
  ruleBlock(groups.discovery),
  '',
  '# User-triggered retrieval. Operators may apply additional runtime policies.',
  ruleBlock(groups.userRetrieval),
  '',
  '# Model-development, dataset, and extended-use controls',
  ruleBlock(groups.extendedUse),
  '',
  `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
  ''
].join('\n')

const sitemapEntries = PUBLIC_ROUTES.map((route) => [
  '  <url>',
  `    <loc>${route.url}</loc>`,
  `    <lastmod>${route.lastModified}</lastmod>`,
  `    <changefreq>${route.changeFrequency}</changefreq>`,
  `    <priority>${route.priority.toFixed(1)}</priority>`,
  '  </url>'
].join('\n')).join('\n')

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  sitemapEntries,
  '</urlset>',
  ''
].join('\n')

await Promise.all([
  writeFile(resolve(publicDir, 'robots.txt'), robots, 'utf8'),
  writeFile(resolve(publicDir, 'sitemap.xml'), sitemap, 'utf8')
])

console.log(`Generated robots.txt and sitemap.xml for ${SITE_ORIGIN}`)
