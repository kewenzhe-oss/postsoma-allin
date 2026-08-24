export const SITE_ORIGIN = 'https://www.205033.xyz'
export const SITE_URL = `${SITE_ORIGIN}/`
export const ABOUT_URL = `${SITE_ORIGIN}/about/`
export const SOURCE_REPOSITORY_URL = 'https://github.com/postsoma-2050/Poker'
export const BRAND_NAME = 'POSTSOMA · ALLIN'
export const BRAND_SIGNATURE = 'POSTSOMA-2050'

export const PUBLIC_ROUTES = Object.freeze([
  Object.freeze({ path: '/', url: SITE_URL, lastModified: '2026-08-24', changeFrequency: 'weekly', priority: 1 }),
  Object.freeze({ path: '/about/', url: ABOUT_URL, lastModified: '2026-08-24', changeFrequency: 'monthly', priority: 0.7 })
])

export const PRIVATE_INDEX_PATHS = Object.freeze(['/room/', '/api/', '/ws/'])

export const AI_CRAWLER_TOKENS = Object.freeze([
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-User',
  'anthropic-ai',
  'Applebot',
  'Applebot-Extended',
  'Googlebot',
  'Google-Extended',
  'Amazonbot',
  'Amzn-SearchBot',
  'Bytespider',
  'CCBot',
  'Diffbot'
])

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`
const WEBSITE_ID = `${SITE_ORIGIN}/#website`
const SOFTWARE_ID = `${SITE_ORIGIN}/#software`
const HOME_ID = `${SITE_ORIGIN}/#home`
const FIVE_QUESTIONS_ID = `${SITE_ORIGIN}/#five-question-process`
const ABOUT_ID = `${ABOUT_URL}#about`

const localized = (locale, en, zh) => locale === 'zh-CN' ? zh : en

const organizationSchema = () => ({
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: BRAND_NAME,
  alternateName: BRAND_SIGNATURE,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_ORIGIN}/app_icon.png`,
    width: 1024,
    height: 1024
  }
})

const websiteSchema = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: BRAND_NAME,
  alternateName: BRAND_SIGNATURE,
  inLanguage: ['en', 'zh-CN'],
  publisher: { '@id': ORGANIZATION_ID }
})

const softwareSchema = (locale) => ({
  '@type': 'SoftwareApplication',
  '@id': SOFTWARE_ID,
  name: BRAND_NAME,
  alternateName: BRAND_SIGNATURE,
  url: SITE_URL,
  applicationCategory: 'EducationalApplication',
  applicationSubCategory: 'Poker decision-thinking tool',
  operatingSystem: 'Web browser',
  browserRequirements: 'Requires JavaScript and a modern web browser',
  isAccessibleForFree: true,
  inLanguage: ['en', 'zh-CN'],
  description: localized(
    locale,
    'A poker decision-thinking tool that helps players examine Hand, Context, Range, Price, and Risk before choosing an action.',
    '一款扑克决策思考工具，帮助用户在行动前依次检查 Hand、Context、Range、Price 与 Risk。'
  ),
  featureList: [
    'Five-question poker decision framework',
    'Versioned heads-up preflop range reference',
    'Pot odds and required-equity Price Builder',
    'Hand and board Explorer',
    'Private heads-up friend rooms',
    'Bring Your Own Key AI free-play sandbox'
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  publisher: { '@id': ORGANIZATION_ID },
  codeRepository: SOURCE_REPOSITORY_URL
})

const fiveQuestionSchema = (locale) => ({
  '@type': 'HowTo',
  '@id': FIVE_QUESTIONS_ID,
  name: localized(locale, 'Understand a poker decision with five questions', '用五个问题看懂一次扑克决定'),
  description: localized(
    locale,
    'A repeatable thinking process for examining a poker spot before looking for an answer.',
    '在寻找答案前，用固定顺序检查扑克局面的可迁移思考流程。'
  ),
  inLanguage: locale,
  step: [
    ['Hand', 'What do I have?', '我拿到什么？'],
    ['Context', 'What spot am I in?', '我处于什么局面？'],
    ['Range', 'What could we each have?', '我与对手可能有什么？'],
    ['Price', 'What does this price require?', '这个价格要求什么？'],
    ['Risk', 'What could distort the decision?', '哪些风险会让判断失真？']
  ].map(([name, en, zh], index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name,
    text: localized(locale, en, zh),
    url: `${SITE_URL}#${name.toLowerCase()}`
  }))
})

export const buildHomeStructuredData = (locale = 'en') => ({
  '@context': 'https://schema.org',
  '@graph': [
    organizationSchema(),
    websiteSchema(),
    softwareSchema(locale),
    {
      '@type': 'WebPage',
      '@id': HOME_ID,
      url: SITE_URL,
      name: localized(locale, 'Poker Decision Thinking Tool', '扑克决策思考工具'),
      description: localized(
        locale,
        'Understand the spot before searching for an answer. Use Hand, Context, Range, Price, and Risk to build a repeatable poker decision habit.',
        '先看懂局面，再寻找答案。用 Hand、Context、Range、Price、Risk 建立可重复的扑克决策习惯。'
      ),
      inLanguage: locale,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': SOFTWARE_ID },
      mainEntity: { '@id': FIVE_QUESTIONS_ID }
    },
    fiveQuestionSchema(locale)
  ]
})

export const buildAboutStructuredData = (locale = 'en') => ({
  '@context': 'https://schema.org',
  '@graph': [
    organizationSchema(),
    websiteSchema(),
    softwareSchema(locale),
    {
      '@type': 'AboutPage',
      '@id': ABOUT_ID,
      url: ABOUT_URL,
      name: localized(locale, 'About POSTSOMA · ALLIN', '关于 POSTSOMA · ALLIN'),
      description: localized(
        locale,
        'Mission, methodology, evidence boundaries, privacy notes, source provenance, and citation guidance for POSTSOMA · ALLIN.',
        'POSTSOMA · ALLIN 的使命、方法论、证据边界、隐私说明、数据来源与引用指南。'
      ),
      inLanguage: locale,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': SOFTWARE_ID },
      publisher: { '@id': ORGANIZATION_ID }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${ABOUT_URL}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: localized(locale, 'Home', '首页'),
          item: SITE_URL
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: localized(locale, 'About', '关于'),
          item: ABOUT_URL
        }
      ]
    }
  ]
})

export const getPageSeo = ({ routeName, locale = 'en' }) => {
  if (routeName === 'About') {
    return {
      title: localized(locale, 'About the Method & Evidence | POSTSOMA · ALLIN', '方法与证据边界 | POSTSOMA · ALLIN'),
      description: localized(
        locale,
        'Read the POSTSOMA · ALLIN mission, five-question methodology, evidence limits, privacy notes, source provenance, and citation guide.',
        '了解 POSTSOMA · ALLIN 的使命、五问方法、证据限制、隐私说明、来源与引用指南。'
      ),
      canonical: ABOUT_URL,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      image: `${SITE_ORIGIN}/app_icon.png`,
      imageAlt: BRAND_NAME,
      type: 'website',
      structuredData: buildAboutStructuredData(locale)
    }
  }

  if (routeName === 'Room') {
    return {
      title: localized(locale, 'Private Poker Room | POSTSOMA · ALLIN', '私人扑克房间 | POSTSOMA · ALLIN'),
      description: localized(locale, 'A private free-play room.', '私人自由对局房间。'),
      canonical: null,
      robots: 'noindex, nofollow, noarchive, nosnippet',
      image: null,
      structuredData: null
    }
  }

  return {
    title: localized(locale, 'Poker Decision Thinking Tool | POSTSOMA · ALLIN', '扑克决策思考工具 | POSTSOMA · ALLIN'),
    description: localized(
      locale,
      'Understand the spot before searching for an answer. Use Hand, Context, Range, Price, and Risk to build a repeatable poker decision habit.',
      '先看懂局面，再寻找答案。用 Hand、Context、Range、Price、Risk 建立可重复的扑克决策习惯。'
    ),
    canonical: SITE_URL,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    image: `${SITE_ORIGIN}/app_icon.png`,
    imageAlt: BRAND_NAME,
    type: 'website',
    structuredData: buildHomeStructuredData(locale)
  }
}
