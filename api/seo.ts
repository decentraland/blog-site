/**
 * Vercel Serverless Function for SEO
 *
 * This function serves pre-rendered HTML with correct meta tags for crawlers.
 *
 * Testing:
 * - GET /api/seo?path=/blog/category/post-slug&seo=true
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

// =============================================================================
// Constants
// =============================================================================

const CRAWLER_USER_AGENTS = [
  // Search engines
  'googlebot',
  'bingbot',
  'yandex',
  'baiduspider',
  'duckduckbot',
  'applebot',
  // Social networks
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'redditbot',
  'tumblr',
  'vkshare',
  // Messaging apps
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slackbot',
  'slack-imgproxy',
  'viber',
  'skypeuripreview',
  // Other services
  'embedly',
  'quora',
  'outbrain',
  'rogerbot',
  'showyoubot',
  'w3c_validator',
  'opengraph'
]

const CMS_BASE_URL = 'https://cms.decentraland.zone/spaces/ea2ybdmmn1kv/environments/master'

const DEFAULTS = {
  title: 'Decentraland Blog',
  description: 'Stay up to date with Decentraland announcements, updates, community highlights, and more.',
  image: 'https://cms-images.decentraland.org/ea2ybdmmn1kv/7tYISdowuJYIbSIDqij87H/f3524d454d8e29702792a6b674f5550d/GI_Landscape.Small.png',
  siteName: 'Decentraland'
} as const

// =============================================================================
// Types
// =============================================================================

interface SEOData {
  title: string
  description: string
  imageUrl: string
  author?: string
  publishedDate?: string
  category?: string
}

interface RouteInfo {
  type: 'blog' | 'post' | 'category' | 'author' | 'search' | 'unknown'
  categorySlug?: string
  postSlug?: string
  authorSlug?: string
}

interface CMSLink {
  sys: { type: string; linkType: string; id: string }
}

interface CMSEntry {
  sys: { id: string; type: string }
  fields?: Record<string, unknown>
}

interface CMSListResponse {
  items: CMSEntry[]
  total: number
}

// =============================================================================
// CMS Helpers
// =============================================================================

const fetchJSON = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url)
    return response.ok ? ((await response.json()) as T) : null
  } catch {
    return null
  }
}

const resolveAssetUrl = async (assetLink: CMSLink): Promise<string | null> => {
  const data = await fetchJSON<{ fields?: { file?: { url?: string } } }>(`${CMS_BASE_URL}/assets/${assetLink.sys.id}`)
  const url = data?.fields?.file?.url
  return url ? (url.startsWith('//') ? `https:${url}` : url) : null
}

const resolveEntryField = async (entryLink: CMSLink, field: string): Promise<string | undefined> => {
  const entry = await fetchJSON<CMSEntry>(`${CMS_BASE_URL}/entries/${entryLink.sys.id}`)
  return entry?.fields?.[field] as string | undefined
}

const getSlug = (fields: Record<string, unknown>, fallbackId: string): string =>
  (fields.slug as string) || (fields.id as string) || fallbackId

const resolveImage = async (fields: Record<string, unknown>): Promise<string> => {
  if (fields.image && typeof fields.image === 'object') {
    const resolved = await resolveAssetUrl(fields.image as CMSLink)
    if (resolved) return resolved
  }
  return DEFAULTS.image
}

// =============================================================================
// Data Fetchers
// =============================================================================

const findEntryBySlug = async (endpoint: string, slug: string): Promise<CMSEntry | null> => {
  const data = await fetchJSON<CMSListResponse>(`${CMS_BASE_URL}${endpoint}`)
  return data?.items.find((item) => getSlug(item.fields as Record<string, unknown>, item.sys.id) === slug) ?? null
}

const fetchBlogPost = async (postSlug: string): Promise<SEOData | null> => {
  const data = await fetchJSON<CMSListResponse>(`${CMS_BASE_URL}/blog/posts?limit=200`)
  const entry = data?.items.find((item) => getSlug(item.fields as Record<string, unknown>, item.sys.id) === postSlug)
  if (!entry?.fields) return null

  const fields = entry.fields as Record<string, unknown>
  const [imageUrl, author, category] = await Promise.all([
    resolveImage(fields),
    fields.author ? resolveEntryField(fields.author as CMSLink, 'title') : undefined,
    fields.category ? resolveEntryField(fields.category as CMSLink, 'title') : undefined
  ])

  return {
    title: (fields.title as string) || DEFAULTS.title,
    description: (fields.description as string) || DEFAULTS.description,
    imageUrl,
    author,
    category,
    publishedDate: fields.publishedDate as string
  }
}

const fetchCategory = async (categorySlug: string): Promise<SEOData | null> => {
  const entry = await findEntryBySlug('/blog/categories', categorySlug)
  if (!entry?.fields) return null

  const fields = entry.fields as Record<string, unknown>
  return {
    title: (fields.title as string) || DEFAULTS.title,
    description: (fields.description as string) || DEFAULTS.description,
    imageUrl: await resolveImage(fields)
  }
}

const fetchAuthor = async (authorSlug: string): Promise<SEOData | null> => {
  const entry = await findEntryBySlug('/blog/authors', authorSlug)
  if (!entry?.fields) return null

  const fields = entry.fields as Record<string, unknown>
  const title = fields.title as string
  return {
    title: title ? `Posts by ${title}` : DEFAULTS.title,
    description: (fields.description as string) || DEFAULTS.description,
    imageUrl: await resolveImage(fields)
  }
}

const fetchDefaultSEO = async (): Promise<SEOData | null> => {
  const data = await fetchJSON<CMSListResponse>(`${CMS_BASE_URL}/blog/posts?limit=1`)
  if (!data?.items[0]?.fields) return null

  const fields = data.items[0].fields as Record<string, unknown>
  return {
    title: DEFAULTS.title,
    description: (fields.description as string) || DEFAULTS.description,
    imageUrl: await resolveImage(fields)
  }
}

// =============================================================================
// Route Parsing
// =============================================================================

const ROUTE_PATTERNS: Array<{ pattern: RegExp; handler: (match: RegExpMatchArray) => RouteInfo }> = [
  { pattern: /^\/blog\/author\/([^/]+)$/, handler: (m) => ({ type: 'author', authorSlug: m[1] }) },
  { pattern: /^\/blog\/search$/, handler: () => ({ type: 'search' }) },
  { pattern: /^\/blog\/([^/]+)\/([^/]+)$/, handler: (m) => ({ type: 'post', categorySlug: m[1], postSlug: m[2] }) },
  { pattern: /^\/blog\/([^/]+)$/, handler: (m) => ({ type: 'category', categorySlug: m[1] }) },
  { pattern: /^\/blog\/?$/, handler: () => ({ type: 'blog' }) }
]

const parseRoute = (pathname: string): RouteInfo => {
  const path = pathname.replace(/\/$/, '') || '/blog'
  for (const { pattern, handler } of ROUTE_PATTERNS) {
    const match = path.match(pattern)
    if (match) return handler(match)
  }
  return { type: 'unknown' }
}

// =============================================================================
// SEO Data Resolution
// =============================================================================

const fetchSEOData = async (pathname: string, searchQuery: string | null): Promise<SEOData | null> => {
  const route = parseRoute(pathname)

  switch (route.type) {
    case 'post':
      return fetchBlogPost(route.postSlug!)
    case 'category':
      return fetchCategory(route.categorySlug!)
    case 'author':
      return fetchAuthor(route.authorSlug!)
    case 'search':
      return {
        title: searchQuery ? `Search: ${searchQuery}` : 'Search',
        description: searchQuery ? `Search results for "${searchQuery}" in Decentraland Blog` : 'Search the Decentraland Blog',
        imageUrl: DEFAULTS.image
      }
    default:
      return fetchDefaultSEO()
  }
}

// =============================================================================
// HTML Generation
// =============================================================================

const replaceMetaTag = (html: string, pattern: RegExp, replacement: string): string => html.replace(pattern, replacement)

const generateHTML = (data: SEOData | null, originalHTML: string, url: string): string => {
  const title = data?.title ? `${data.title} | ${DEFAULTS.siteName}` : DEFAULTS.title
  const description = data?.description || DEFAULTS.description
  const imageUrl = data?.imageUrl || DEFAULTS.image
  const ogType = data?.author ? 'article' : 'website'

  let html = originalHTML

  // Basic meta tags
  html = replaceMetaTag(html, /<title>.*?<\/title>/i, `<title>${title}</title>`)
  html = replaceMetaTag(html, /<meta name="description" content="[^"]*"[^>]*>/i, `<meta name="description" content="${description}">`)
  html = replaceMetaTag(html, /<link rel="canonical" href="[^"]*"[^>]*>/i, `<link rel="canonical" href="${url}">`)

  // Open Graph
  html = replaceMetaTag(html, /<meta property="og:title" content="[^"]*"[^>]*>/i, `<meta property="og:title" content="${title}">`)
  html = replaceMetaTag(
    html,
    /<meta property="og:description" content="[^"]*"[^>]*>/i,
    `<meta property="og:description" content="${description}">`
  )
  html = replaceMetaTag(html, /<meta property="og:image" content="[^"]*"[^>]*>/i, `<meta property="og:image" content="${imageUrl}">`)
  html = replaceMetaTag(html, /<meta property="og:url" content="[^"]*"[^>]*>/i, `<meta property="og:url" content="${url}">`)
  html = replaceMetaTag(html, /<meta property="og:type" content="[^"]*"[^>]*>/i, `<meta property="og:type" content="${ogType}">`)

  // Twitter Card
  html = replaceMetaTag(html, /<meta name="twitter:title" content="[^"]*"[^>]*>/i, `<meta name="twitter:title" content="${title}">`)
  html = replaceMetaTag(
    html,
    /<meta name="twitter:description" content="[^"]*"[^>]*>/i,
    `<meta name="twitter:description" content="${description}">`
  )
  html = replaceMetaTag(html, /<meta name="twitter:image" content="[^"]*"[^>]*>/i, `<meta name="twitter:image" content="${imageUrl}">`)

  // Article meta (for posts)
  if (data?.author && data?.publishedDate) {
    const articleMeta = `
    <meta property="article:author" content="${data.author}">
    <meta property="article:published_time" content="${data.publishedDate}">
    ${data.category ? `<meta property="article:section" content="${data.category}">` : ''}
  </head>`
    html = html.replace('</head>', articleMeta)
  }

  return html
}

// =============================================================================
// Request Handler
// =============================================================================

const isCrawler = (userAgent: string): boolean => {
  const ua = userAgent.toLowerCase()
  return CRAWLER_USER_AGENTS.some((crawler) => ua.includes(crawler))
}

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const userAgent = req.headers['user-agent'] || ''
  const blogPath = (req.query.path as string) || '/blog'
  const searchQuery = req.query.q as string | null
  const isSEOTest = req.query.seo === 'true'

  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || ''
  const origin = `${protocol}://${host}`
  const actualUrl = `${origin}${blogPath}`

  // Redirect non-crawlers to actual URL
  if (!isCrawler(userAgent) && !isSEOTest) {
    res.redirect(307, actualUrl)
    return
  }

  try {
    const indexResponse = await fetch(`${origin}/index.html`)
    if (!indexResponse.ok) {
      res.redirect(307, actualUrl)
      return
    }

    const [originalHTML, seoData] = await Promise.all([indexResponse.text(), fetchSEOData(blogPath, searchQuery)])

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('X-SEO-Function', 'active')
    res.status(200).send(generateHTML(seoData, originalHTML, actualUrl))
  } catch (error) {
    console.error('[SEO Function] Error:', error)
    res.redirect(307, actualUrl)
  }
}

// eslint-disable-next-line import/no-default-export
export default handler
