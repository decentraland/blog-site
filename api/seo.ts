/**
 * Vercel Serverless Function for SEO
 *
 * This function serves pre-rendered HTML with correct meta tags for crawlers.
 *
 * Testing:
 * - GET /api/seo?path=/blog/category/post-slug&seo=true
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// =============================================================================
// Constants
// =============================================================================

const CMS_BASE_URL = 'https://cms.decentraland.zone/spaces/ea2ybdmmn1kv/environments/master'

const DEFAULTS = {
  title: 'Decentraland Blog | Updates, Stories, and Community Moments',
  description: 'Updates from across Decentraland. Announcements, events, community moments, and everything in between.',
  image: 'https://cms-images.decentraland.org/ea2ybdmmn1kv/7tYISdowuJYIbSIDqij87H/f3524d454d8e29702792a6b674f5550d/GI_Landscape.Small.png',
  siteName: 'Decentraland'
} as const

// Allowlist of canonical origins used to build the returned absolute URLs (canonical, og:url).
// Host headers are attacker-controlled; relying on them enables open redirects and SSRF.
const ALLOWED_ORIGINS = new Set<string>(['https://decentraland.org', 'https://decentraland.zone', 'https://decentraland.today'])
const DEFAULT_ORIGIN = 'https://decentraland.org'

// Read the static HTML shell from disk once at cold start instead of looping back over HTTP.
// Falls back to an empty string if the build output is not available (e.g. local `vercel dev`
// before `vite build`); in that case the function will return a redirect.
const INDEX_HTML: string = (() => {
  try {
    return readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8')
  } catch {
    return ''
  }
})()

// =============================================================================
// Escaping helpers
// =============================================================================

const escapeHTML = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

// Only allow http(s) URLs; anything else (javascript:, data:, etc.) is dropped.
const safeUrl = (value: string, fallback: string): string => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    // fallthrough
  }
  return fallback
}

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
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
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
  const data = await fetchJSON<CMSListResponse>(`${CMS_BASE_URL}${endpoint}?fields.slug=${encodeURIComponent(slug)}&limit=1`)
  return data?.items[0] ?? null
}

const fetchBlogPost = async (postSlug: string): Promise<SEOData | null> => {
  // Filter server-side by slug instead of downloading up to 200 entries and `.find()`ing locally.
  const data = await fetchJSON<CMSListResponse>(`${CMS_BASE_URL}/blog/posts?fields.slug=${encodeURIComponent(postSlug)}&limit=1`)
  const entry = data?.items[0]
  if (!entry?.fields) return null

  const fields = entry.fields
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

  const fields = entry.fields
  return {
    title: (fields.title as string) || DEFAULTS.title,
    description: (fields.description as string) || DEFAULTS.description,
    imageUrl: await resolveImage(fields)
  }
}

const fetchAuthor = async (authorSlug: string): Promise<SEOData | null> => {
  const entry = await findEntryBySlug('/blog/authors', authorSlug)
  if (!entry?.fields) return null

  const fields = entry.fields
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

  const fields = data.items[0].fields
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
  { pattern: /^\/blog\/author\/([^/]+)$/, handler: m => ({ type: 'author', authorSlug: m[1] }) },
  { pattern: /^\/blog\/search$/, handler: () => ({ type: 'search' }) },
  { pattern: /^\/blog\/([^/]+)\/([^/]+)$/, handler: m => ({ type: 'post', categorySlug: m[1], postSlug: m[2] }) },
  { pattern: /^\/blog\/([^/]+)$/, handler: m => ({ type: 'category', categorySlug: m[1] }) },
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
  // Escape every interpolated value to prevent reflected/stored XSS via CMS fields or query strings.
  const rawTitle = data?.title ? `${data.title} | ${DEFAULTS.siteName}` : DEFAULTS.title
  const rawDescription = data?.description || DEFAULTS.description
  const rawImageUrl = safeUrl(data?.imageUrl || DEFAULTS.image, DEFAULTS.image)

  const title = escapeHTML(rawTitle)
  const description = escapeHTML(rawDescription)
  const imageUrl = escapeHTML(rawImageUrl)
  const safeCanonicalUrl = escapeHTML(url)
  const ogType = data?.author ? 'article' : 'website'

  let html = originalHTML

  // Basic meta tags
  html = replaceMetaTag(html, /<title>.*?<\/title>/i, `<title>${title}</title>`)
  html = replaceMetaTag(html, /<meta name="description" content="[^"]*"[^>]*>/i, `<meta name="description" content="${description}">`)
  html = replaceMetaTag(html, /<link rel="canonical" href="[^"]*"[^>]*>/i, `<link rel="canonical" href="${safeCanonicalUrl}">`)

  // Open Graph
  html = replaceMetaTag(html, /<meta property="og:title" content="[^"]*"[^>]*>/i, `<meta property="og:title" content="${title}">`)
  html = replaceMetaTag(
    html,
    /<meta property="og:description" content="[^"]*"[^>]*>/i,
    `<meta property="og:description" content="${description}">`
  )
  html = replaceMetaTag(html, /<meta property="og:image" content="[^"]*"[^>]*>/i, `<meta property="og:image" content="${imageUrl}">`)
  html = replaceMetaTag(html, /<meta property="og:url" content="[^"]*"[^>]*>/i, `<meta property="og:url" content="${safeCanonicalUrl}">`)
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
    const author = escapeHTML(data.author)
    const publishedDate = escapeHTML(data.publishedDate)
    const category = data.category ? escapeHTML(data.category) : ''
    const articleMeta = `
    <meta property="article:author" content="${author}">
    <meta property="article:published_time" content="${publishedDate}">
    ${category ? `<meta property="article:section" content="${category}">` : ''}
  </head>`
    html = html.replace('</head>', articleMeta)
  }

  // Preload hint for the hero image so the browser discovers it during HTML parse.
  // We intentionally do NOT inject an <img> into #root: `createRoot().render()` wipes
  // children, which would cause a flash + potential CLS regression.
  if (rawImageUrl) {
    html = html.replace('</head>', `<link rel="preload" as="image" href="${imageUrl}" fetchpriority="high" />\n</head>`)
  }

  return html
}

// =============================================================================
// Request Handler
// =============================================================================

// Only accept paths that start with `/blog` and contain no path traversal or protocol separators.
// This prevents `?path=//evil.com` style open redirect payloads and garbage input.
const sanitizeBlogPath = (raw: unknown): string => {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return '/blog'
  // Parse to strip query strings, fragments, and normalise the path.
  try {
    const parsed = new URL(value, 'https://localhost')
    const pathname = parsed.pathname
    if (!pathname.startsWith('/blog')) return '/blog'
    if (pathname.includes('..') || pathname.includes('//') || pathname.includes('\\')) return '/blog'
    return pathname
  } catch {
    return '/blog'
  }
}

const firstQueryValue = (raw: unknown): string | null => {
  if (Array.isArray(raw)) return typeof raw[0] === 'string' ? raw[0] : null
  return typeof raw === 'string' ? raw : null
}

const resolveOrigin = (req: VercelRequest): string => {
  const forwardedHost = req.headers['x-forwarded-host']
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host
  if (typeof host !== 'string' || !host) return DEFAULT_ORIGIN
  const candidate = `https://${host}`
  return ALLOWED_ORIGINS.has(candidate) ? candidate : DEFAULT_ORIGIN
}

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const blogPath = sanitizeBlogPath(req.query.path)
  const searchQuery = firstQueryValue(req.query.q)

  const origin = resolveOrigin(req)
  const actualUrl = `${origin}${blogPath}`

  // Security headers applied regardless of the response path.
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (!INDEX_HTML) {
    // Build output unavailable. Cannot redirect to actualUrl because vercel.json rewrites
    // /blog/* back to this function, which would create an infinite redirect loop.
    // Serve a minimal page that client-side redirects to home instead.
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res
      .status(200)
      .send('<!doctype html><html><head><meta charset="utf-8"></head><body><script>location.replace("/")</script></body></html>')
    return
  }

  try {
    const seoData = await fetchSEOData(blogPath, searchQuery)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    // Shorter stale window: timely blog announcements should not be served up to 24h stale.
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=14400')
    res.setHeader('Vary', 'Accept-Encoding')
    res.setHeader('X-SEO-Function', 'active')
    res.status(200).send(generateHTML(seoData, INDEX_HTML, actualUrl))
  } catch (error) {
    // CMS unreachable — serve INDEX_HTML with default meta tags rather than redirecting
    // to actualUrl (which would loop back to this function via vercel.json rewrite).
    console.error('[SEO Function] Error:', error)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.status(200).send(generateHTML(null, INDEX_HTML, actualUrl))
  }
}

// eslint-disable-next-line import/no-default-export
export default handler
