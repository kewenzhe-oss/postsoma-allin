/**
 * PostSoma Poker Lab (poker_lab) - Unified Dual-Engine Telemetry Config
 * Cognitive Layer: Judgment
 * Inventory Source: ~/.config/postsoma/ga4-inventory.json
 */

export const GA_ROLLUP_ID =
  import.meta.env.VITE_GA_ROLLUP_ID || 'G-NZ2V582QTN'

export const GA_PROJECT_ID =
  import.meta.env.VITE_GA_PROJECT_ID ||
  import.meta.env.VITE_GA_ID ||
  'G-W4RG20D3C6'

export const GA_PROJECT_NAME =
  import.meta.env.VITE_GA_PROJECT_NAME || 'poker_lab'

export const GA_COGNITIVE_LAYER =
  import.meta.env.VITE_GA_COGNITIVE_LAYER || 'Judgment'

export const UMAMI_WEBSITE_ID =
  import.meta.env.VITE_UMAMI_WEBSITE_ID ||
  'c2e32422-cfa1-4182-a9e7-1610e352f737'

export const UMAMI_SCRIPT_URL =
  import.meta.env.VITE_UMAMI_SCRIPT_URL ||
  'https://pulse.postsoma-2050.website/pulse.js'

export const CROSS_DOMAIN_LIST = [
  'www.205033.xyz',
  '205033.xyz',
  'postsoma-2050.website',
  'postsoma-2050.com',
  'www.postsoma-2050.com',
  'www.205011.xyz',
  '205011.xyz',
  'www.205022.xyz',
  '205022.xyz',
  'www.205044.xyz',
  '205044.xyz',
  'www.205055.xyz',
  '205055.xyz',
  'www.205077.xyz',
  '205077.xyz',
  'recipelab.cc',
  'quantbrews.win',
  'postsomabooks.qzz.io',
  'www.readselah.org',
  'readselah.org',
  'prayselah.org'
]

export function isLocalHostname(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local')
  )
}

export function isValidGaId(id) {
  return Boolean(
    id &&
      id !== 'PENDING' &&
      !id.startsWith('G-XXXXXXXX') &&
      id.startsWith('G-')
  )
}
