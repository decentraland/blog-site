/**
 * Vercel Edge Function for SEO
 *
 * This function intercepts requests from crawlers (Google, Facebook, Twitter, etc.)
 * and serves pre-rendered HTML with correct meta tags for SEO.
 *
 * Testing:
 * - Add ?seo=true to any /blog URL to test the SEO response
 * - Example: https://your-domain.vercel.app/blog?seo=true
 */

const CRAWLER_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slackbot',
  'embedly',
  'opengraph',
  'metatags',
  'prerender',
  'headless'
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

function isCrawler(userAgent: string): boolean {
  const ua = (userAgent || '').toLowerCase()
  return CRAWLER_USER_AGENTS.some((crawler) => ua.includes(crawler))
}

async function fetchBlogPost(categorySlug: string, postSlug: string): Promise<SEOData | null> {
  try {
    const response = await fetch(`${CMS_BASE_URL}/blog/posts?category=${categorySlug}&slug=${postSlug}&limit=1`)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.items || data.items.length === 0) return null

    const item = data.items[0]
    const fields = item.fields || {}

    return {
      title: fields.title || DEFAULT_TITLE,
      description: fields.description || DEFAULT_DESCRIPTION,
      imageUrl: fields.image?.url || DEFAULT_IMAGE,
      author: fields.author?.title,
      publishedDate: fields.publishedDate,
      category: fields.category?.title
    }
  } catch (error) {
    console.error('[SEO] Error fetching blog post:', error)
    return null
  }
}

async function fetchCategory(categorySlug: string): Promise<SEOData | null> {
  try {
    const response = await fetch(`${CMS_BASE_URL}/blog/categories?slug=${categorySlug}&limit=1`)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.items || data.items.length === 0) return null

    const item = data.items[0]
    const fields = item.fields || {}

    return {
      title: fields.title || DEFAULT_TITLE,
      description: fields.description || DEFAULT_DESCRIPTION,
      imageUrl: fields.image?.url || DEFAULT_IMAGE
    }
  } catch (error) {
    console.error('[SEO] Error fetching category:', error)
    return null
  }
}

async function fetchAuthor(authorSlug: string): Promise<SEOData | null> {
  try {
    const response = await fetch(`${CMS_BASE_URL}/blog/authors?slug=${authorSlug}&limit=1`)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.items || data.items.length === 0) return null

    const item = data.items[0]
    const fields = item.fields || {}

    return {
      title: fields.title ? `Posts by ${fields.title}` : DEFAULT_TITLE,
      description: fields.description || DEFAULT_DESCRIPTION,
      imageUrl: fields.image?.url || DEFAULT_IMAGE
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

    const data = await response.json()
    if (!data.items || data.items.length === 0) return null

    const item = data.items[0]
    const fields = item.fields || {}

    return {
      title: DEFAULT_TITLE,
      description: fields.description || DEFAULT_DESCRIPTION,
      imageUrl: fields.image?.url || DEFAULT_IMAGE
    }
  } catch (error) {
    console.error('[SEO] Error fetching first blog post:', error)
    return null
  }
}

function parseRoute(pathname: string): RouteInfo {
  // Remove /api/seo prefix and trailing slash
  const path = pathname.replace(/^\/api\/seo/, '').replace(/\/$/, '') || '/blog'

  // /blog - main blog page
  if (path === '/blog' || path === '') {
    return { type: 'blog' }
  }

  // /blog/search - search page
  if (path === '/blog/search') {
    return { type: 'search' }
  }

  // /blog/author/:authorSlug - author page
  const authorMatch = path.match(/^\/blog\/author\/([^/]+)$/)
  if (authorMatch) {
    return { type: 'author', authorSlug: authorMatch[1] }
  }

  // /blog/:categorySlug/:postSlug - post page
  const postMatch = path.match(/^\/blog\/([^/]+)\/([^/]+)$/)
  if (postMatch) {
    return { type: 'post', categorySlug: postMatch[1], postSlug: postMatch[2] }
  }

  // /blog/:categorySlug - category page
  const categoryMatch = path.match(/^\/blog\/([^/]+)$/)
  if (categoryMatch) {
    return { type: 'category', categorySlug: categoryMatch[1] }
  }

  return { type: 'unknown' }
}

async function fetchSEOData(pathname: string, searchParams: URLSearchParams): Promise<SEOData | null> {
  const route = parseRoute(pathname)

  switch (route.type) {
    case 'post':
      return await fetchBlogPost(route.categorySlug!, route.postSlug!)
    case 'category':
      return await fetchCategory(route.categorySlug!)
    case 'author':
      return await fetchAuthor(route.authorSlug!)
    case 'search': {
      const query = searchParams.get('q')
      return {
        title: query ? `Search: ${query}` : 'Search',
        description: query ? `Search results for "${query}" in Decentraland Blog` : 'Search the Decentraland Blog',
        imageUrl: DEFAULT_IMAGE
      }
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

  // Update basic meta tags
  html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
  html = html.replace(/<meta name="description" content="[^"]*"[^>]*>/i, `<meta name="description" content="${description}">`)
  html = html.replace(/<link rel="canonical" href="[^"]*"[^>]*>/i, `<link rel="canonical" href="${url}">`)

  // Update Open Graph tags
  html = html.replace(/<meta property="og:title" content="[^"]*"[^>]*>/i, `<meta property="og:title" content="${title}">`)
  html = html.replace(/<meta property="og:description" content="[^"]*"[^>]*>/i, `<meta property="og:description" content="${description}">`)
  html = html.replace(/<meta property="og:image" content="[^"]*"[^>]*>/i, `<meta property="og:image" content="${imageUrl}">`)
  html = html.replace(/<meta property="og:url" content="[^"]*"[^>]*>/i, `<meta property="og:url" content="${url}">`)
  html = html.replace(/<meta property="og:type" content="[^"]*"[^>]*>/i, `<meta property="og:type" content="${ogType}">`)

  // Update Twitter Card tags
  html = html.replace(/<meta name="twitter:title" content="[^"]*"[^>]*>/i, `<meta name="twitter:title" content="${title}">`)
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"[^>]*>/i,
    `<meta name="twitter:description" content="${description}">`
  )
  html = html.replace(/<meta name="twitter:image" content="[^"]*"[^>]*>/i, `<meta name="twitter:image" content="${imageUrl}">`)

  // Add article-specific meta tags if applicable
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

async function handler(request: Request): Promise<Response> {
  const userAgent = request.headers.get('user-agent') || ''
  const url = new URL(request.url)
  const { pathname, searchParams, origin } = url

  const isCrawlerRequest = isCrawler(userAgent)
  const isSEOTest = searchParams.get('seo') === 'true'

  // Build the actual blog URL (remove /api/seo prefix)
  const blogPath = pathname.replace(/^\/api\/seo/, '') || '/blog'
  const actualUrl = `${origin}${blogPath}${url.search}`

  // If not a crawler and not testing, redirect to the actual blog URL
  if (!isCrawlerRequest && !isSEOTest) {
    return Response.redirect(actualUrl, 307)
  }

  try {
    // Fetch the index.html from the origin
    const indexResponse = await fetch(`${origin}/index.html`)

    if (!indexResponse.ok) {
      return Response.redirect(actualUrl, 307)
    }

    const originalHTML = await indexResponse.text()
    const seoData = await fetchSEOData(pathname, searchParams)
    const html = generateHTML(seoData, originalHTML, actualUrl)

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=3600',
        'x-seo-edge-function': 'active',
        'x-seo-route-type': parseRoute(pathname).type
      }
    })
  } catch (error) {
    console.error('[SEO Edge Function] Error:', error)
    return Response.redirect(actualUrl, 307)
  }
}

const config = {
  runtime: 'edge'
}

// eslint-disable-next-line import/no-default-export
export default handler
export { config }
