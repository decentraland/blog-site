/**
 * Vercel Serverless Function for SEO
 *
 * This function serves pre-rendered HTML with correct meta tags for crawlers.
 *
 * Testing:
 * - GET /api/seo?path=/blog/category/post-slug
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const CRAWLER_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slackbot',
  'opengraph'
]

const CMS_BASE_URL = 'https://cms.decentraland.zone/spaces/ea2ybdmmn1kv/environments/master'
const DEFAULT_IMAGE =
  'https://cms-images.decentraland.org/ea2ybdmmn1kv/7tYISdowuJYIbSIDqij87H/f3524d454d8e29702792a6b674f5550d/GI_Landscape.Small.png'
const DEFAULT_TITLE = 'Decentraland Blog'
const DEFAULT_DESCRIPTION = 'Stay up to date with Decentraland announcements, updates, community highlights, and more.'
const SITE_NAME = 'Decentraland'

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
  sys: {
    type: string
    linkType: string
    id: string
  }
}

interface CMSAssetFields {
  title?: string
  file?: {
    url?: string
    contentType?: string
    details?: {
      image?: {
        width?: number
        height?: number
      }
    }
  }
}

interface CMSEntry {
  sys: {
    id: string
    type: string
  }
  fields?: Record<string, unknown>
}

interface CMSListResponse {
  items: CMSEntry[]
  total: number
}

function isCrawler(userAgent: string): boolean {
  const ua = (userAgent || '').toLowerCase()
  return CRAWLER_USER_AGENTS.some((crawler) => ua.includes(crawler))
}

// Resolve an asset link to get the full URL
async function resolveAsset(assetLink: CMSLink): Promise<string | null> {
  try {
    const response = await fetch(`${CMS_BASE_URL}/assets/${assetLink.sys.id}`)
    if (!response.ok) return null

    const data = (await response.json()) as { fields?: CMSAssetFields }
    const fileUrl = data.fields?.file?.url
    if (fileUrl) {
      return fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl
    }
    return null
  } catch {
    return null
  }
}

// Resolve an entry link (for author/category)
async function resolveEntry(entryLink: CMSLink): Promise<CMSEntry | null> {
  try {
    const response = await fetch(`${CMS_BASE_URL}/entries/${entryLink.sys.id}`)
    if (!response.ok) return null
    return (await response.json()) as CMSEntry
  } catch {
    return null
  }
}

// Helper to get slug from fields
function getEntrySlug(fields: Record<string, unknown>, fallbackId: string): string {
  // Check for slug field first (most reliable)
  if (typeof fields.slug === 'string' && fields.slug) {
    return fields.slug
  }
  // Check for id field (some entries use this)
  if (typeof fields.id === 'string' && fields.id) {
    return fields.id
  }
  // Fallback to sys.id
  return fallbackId
}

async function fetchBlogPost(postSlug: string): Promise<SEOData | null> {
  try {
    // Fetch posts (limit 100 to find the post)
    const response = await fetch(`${CMS_BASE_URL}/blog/posts?limit=200`)
    if (!response.ok) return null

    const data = (await response.json()) as CMSListResponse
    if (!data.items || data.items.length === 0) return null

    // Find the post by slug
    const postEntry = data.items.find((item) => {
      const fields = item.fields as Record<string, unknown>
      return getEntrySlug(fields, item.sys.id) === postSlug
    })

    if (!postEntry) return null

    const fields = postEntry.fields as Record<string, unknown>

    // Resolve the image
    let imageUrl = DEFAULT_IMAGE
    if (fields.image && typeof fields.image === 'object') {
      const resolvedImage = await resolveAsset(fields.image as CMSLink)
      if (resolvedImage) {
        imageUrl = resolvedImage
      }
    }

    // Resolve author
    let authorName: string | undefined
    if (fields.author && typeof fields.author === 'object') {
      const authorEntry = await resolveEntry(fields.author as CMSLink)
      if (authorEntry?.fields) {
        authorName = (authorEntry.fields as Record<string, unknown>).title as string
      }
    }

    // Resolve category
    let categoryName: string | undefined
    if (fields.category && typeof fields.category === 'object') {
      const categoryEntry = await resolveEntry(fields.category as CMSLink)
      if (categoryEntry?.fields) {
        categoryName = (categoryEntry.fields as Record<string, unknown>).title as string
      }
    }

    return {
      title: (fields.title as string) || DEFAULT_TITLE,
      description: (fields.description as string) || DEFAULT_DESCRIPTION,
      imageUrl,
      author: authorName,
      publishedDate: fields.publishedDate as string,
      category: categoryName
    }
  } catch (error) {
    console.error('[SEO] Error fetching blog post:', error)
    return null
  }
}

async function fetchCategory(categorySlug: string): Promise<SEOData | null> {
  try {
    const response = await fetch(`${CMS_BASE_URL}/blog/categories`)
    if (!response.ok) return null

    const data = (await response.json()) as CMSListResponse
    if (!data.items || data.items.length === 0) return null

    // Find the category by slug
    const categoryEntry = data.items.find((item) => {
      const fields = item.fields as Record<string, unknown>
      return getEntrySlug(fields, item.sys.id) === categorySlug
    })

    if (!categoryEntry) return null

    const fields = categoryEntry.fields as Record<string, unknown>

    // Resolve the image
    let imageUrl = DEFAULT_IMAGE
    if (fields.image && typeof fields.image === 'object') {
      const resolvedImage = await resolveAsset(fields.image as CMSLink)
      if (resolvedImage) {
        imageUrl = resolvedImage
      }
    }

    return {
      title: (fields.title as string) || DEFAULT_TITLE,
      description: (fields.description as string) || DEFAULT_DESCRIPTION,
      imageUrl
    }
  } catch (error) {
    console.error('[SEO] Error fetching category:', error)
    return null
  }
}

async function fetchAuthor(authorSlug: string): Promise<SEOData | null> {
  try {
    const response = await fetch(`${CMS_BASE_URL}/blog/authors`)
    if (!response.ok) return null

    const data = (await response.json()) as CMSListResponse
    if (!data.items || data.items.length === 0) return null

    // Find the author by slug
    const authorEntry = data.items.find((item) => {
      const fields = item.fields as Record<string, unknown>
      return getEntrySlug(fields, item.sys.id) === authorSlug
    })

    if (!authorEntry) return null

    const fields = authorEntry.fields as Record<string, unknown>

    // Resolve the image
    let imageUrl = DEFAULT_IMAGE
    if (fields.image && typeof fields.image === 'object') {
      const resolvedImage = await resolveAsset(fields.image as CMSLink)
      if (resolvedImage) {
        imageUrl = resolvedImage
      }
    }

    return {
      title: (fields.title as string) ? `Posts by ${fields.title}` : DEFAULT_TITLE,
      description: (fields.description as string) || DEFAULT_DESCRIPTION,
      imageUrl
    }
  } catch (error) {
    console.error('[SEO] Error fetching author:', error)
    return null
  }
}

async function fetchFirstBlogPost(): Promise<SEOData | null> {
  try {
    const response = await fetch(`${CMS_BASE_URL}/blog/posts?limit=1`)
    if (!response.ok) return null

    const data = (await response.json()) as CMSListResponse
    if (!data.items || data.items.length === 0) return null

    const fields = data.items[0].fields as Record<string, unknown>

    // Resolve the image
    let imageUrl = DEFAULT_IMAGE
    if (fields.image && typeof fields.image === 'object') {
      const resolvedImage = await resolveAsset(fields.image as CMSLink)
      if (resolvedImage) {
        imageUrl = resolvedImage
      }
    }

    return {
      title: DEFAULT_TITLE,
      description: (fields.description as string) || DEFAULT_DESCRIPTION,
      imageUrl
    }
  } catch (error) {
    console.error('[SEO] Error fetching first blog post:', error)
    return null
  }
}

function parseRoute(pathname: string): RouteInfo {
  const path = pathname.replace(/\/$/, '')

  if (path === '/blog' || path === '') {
    return { type: 'blog' }
  }

  if (path === '/blog/search') {
    return { type: 'search' }
  }

  const authorMatch = path.match(/^\/blog\/author\/([^/]+)$/)
  if (authorMatch) {
    return { type: 'author', authorSlug: authorMatch[1] }
  }

  const postMatch = path.match(/^\/blog\/([^/]+)\/([^/]+)$/)
  if (postMatch) {
    return { type: 'post', categorySlug: postMatch[1], postSlug: postMatch[2] }
  }

  const categoryMatch = path.match(/^\/blog\/([^/]+)$/)
  if (categoryMatch) {
    return { type: 'category', categorySlug: categoryMatch[1] }
  }

  return { type: 'unknown' }
}

async function fetchSEOData(pathname: string, query: string | null): Promise<SEOData | null> {
  const route = parseRoute(pathname)

  switch (route.type) {
    case 'post':
      return await fetchBlogPost(route.postSlug!)
    case 'category':
      return await fetchCategory(route.categorySlug!)
    case 'author':
      return await fetchAuthor(route.authorSlug!)
    case 'search':
      return {
        title: query ? `Search: ${query}` : 'Search',
        description: query ? `Search results for "${query}" in Decentraland Blog` : 'Search the Decentraland Blog',
        imageUrl: DEFAULT_IMAGE
      }
    case 'blog':
    default:
      return await fetchFirstBlogPost()
  }
}

function generateHTML(data: SEOData | null, originalHTML: string, url: string): string {
  const title = data?.title ? `${data.title} | ${SITE_NAME}` : DEFAULT_TITLE
  const description = data?.description || DEFAULT_DESCRIPTION
  const imageUrl = data?.imageUrl || DEFAULT_IMAGE
  const ogType = data?.author ? 'article' : 'website'

  let html = originalHTML

  html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
  html = html.replace(/<meta name="description" content="[^"]*"[^>]*>/i, `<meta name="description" content="${description}">`)
  html = html.replace(/<link rel="canonical" href="[^"]*"[^>]*>/i, `<link rel="canonical" href="${url}">`)

  html = html.replace(/<meta property="og:title" content="[^"]*"[^>]*>/i, `<meta property="og:title" content="${title}">`)
  html = html.replace(/<meta property="og:description" content="[^"]*"[^>]*>/i, `<meta property="og:description" content="${description}">`)
  html = html.replace(/<meta property="og:image" content="[^"]*"[^>]*>/i, `<meta property="og:image" content="${imageUrl}">`)
  html = html.replace(/<meta property="og:url" content="[^"]*"[^>]*>/i, `<meta property="og:url" content="${url}">`)
  html = html.replace(/<meta property="og:type" content="[^"]*"[^>]*>/i, `<meta property="og:type" content="${ogType}">`)

  html = html.replace(/<meta name="twitter:title" content="[^"]*"[^>]*>/i, `<meta name="twitter:title" content="${title}">`)
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"[^>]*>/i,
    `<meta name="twitter:description" content="${description}">`
  )
  html = html.replace(/<meta name="twitter:image" content="[^"]*"[^>]*>/i, `<meta name="twitter:image" content="${imageUrl}">`)

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

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const userAgent = req.headers['user-agent'] || ''
  const blogPath = (req.query.path as string) || '/blog'
  const searchQuery = req.query.q as string | null

  const isCrawlerRequest = isCrawler(userAgent)
  const isSEOTest = req.query.seo === 'true'

  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || ''
  const origin = `${protocol}://${host}`
  const actualUrl = `${origin}${blogPath}`

  console.log('[SEO] Request:', { blogPath, userAgent: userAgent.substring(0, 50), isCrawlerRequest, isSEOTest })

  if (!isCrawlerRequest && !isSEOTest) {
    res.redirect(307, actualUrl)
    return
  }

  try {
    const indexResponse = await fetch(`${origin}/index.html`)

    if (!indexResponse.ok) {
      console.error('[SEO] Failed to fetch index.html:', indexResponse.status)
      res.redirect(307, actualUrl)
      return
    }

    const originalHTML = await indexResponse.text()
    const seoData = await fetchSEOData(blogPath, searchQuery)

    console.log('[SEO] Data fetched:', {
      title: seoData?.title,
      hasImage: !!seoData?.imageUrl,
      imageUrl: seoData?.imageUrl?.substring(0, 50)
    })

    const html = generateHTML(seoData, originalHTML, actualUrl)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('X-SEO-Function', 'active')
    res.status(200).send(html)
  } catch (error) {
    console.error('[SEO Function] Error:', error)
    res.redirect(307, actualUrl)
  }
}

// eslint-disable-next-line import/no-default-export
export default handler
