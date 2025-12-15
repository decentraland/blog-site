// Cloudflare Pages Function - Middleware for SEO and SPA routing
// This intercepts requests from crawlers and serves pre-rendered HTML with correct meta tags
// Also handles SPA routing fallback (replaces _redirects)

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
  'headless',
  'curl',
  'wget'
]

const CMS_BASE_URL = 'https://cms.decentraland.org/spaces/ea2ybdmmn1kv/environments/master'
const DEFAULT_IMAGE = 'https://decentraland.org/static/background-v3@1x-f3aaf66f210e3bf6a747de9951036ba3.jpg'
const DEFAULT_TITLE = 'Decentraland Blog'
const DEFAULT_DESCRIPTION = 'Stay up to date with Decentraland announcements, updates, community highlights, and more.'

function isCrawler(userAgent) {
  const ua = (userAgent || '').toLowerCase()
  return CRAWLER_USER_AGENTS.some((crawler) => ua.includes(crawler))
}

async function fetchImageUrl(assetId) {
  try {
    const response = await fetch(`${CMS_BASE_URL}/assets/${assetId}`)
    if (!response.ok) return null

    const data = await response.json()
    return data.fields?.file?.url || null
  } catch {
    return null
  }
}

async function fetchFirstBlogPost() {
  try {
    // Use the correct blog API endpoint
    const response = await fetch(`${CMS_BASE_URL}/blog/posts?limit=1`)
    if (!response.ok) {
      console.error('[SEO] Blog API error:', response.status)
      return null
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      console.log('[SEO] No blog posts found')
      return null
    }

    const fields = data.items[0].fields || {}
    console.log('[SEO] Found blog post:', fields.title)

    // Get the image URL from the asset
    let imageUrl = DEFAULT_IMAGE
    if (fields.image?.sys?.id) {
      const assetUrl = await fetchImageUrl(fields.image.sys.id)
      if (assetUrl) {
        imageUrl = assetUrl
      }
    }

    return {
      title: fields.title || DEFAULT_TITLE,
      description: fields.description || DEFAULT_DESCRIPTION,
      imageUrl
    }
  } catch (error) {
    console.error('[SEO] Error fetching blog post:', error)
    return null
  }
}

function generateHTML(post, originalHTML, url) {
  const title = post?.title || DEFAULT_TITLE
  const description = post?.description || DEFAULT_DESCRIPTION
  const imageUrl = post?.imageUrl || DEFAULT_IMAGE

  let html = originalHTML

  // Replace all meta tags
  html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
  html = html.replace(/<meta name="description" content="[^"]*"[^>]*>/i, `<meta name="description" content="${description}">`)
  html = html.replace(/<meta property="og:title" content="[^"]*"[^>]*>/i, `<meta property="og:title" content="${title}">`)
  html = html.replace(/<meta property="og:description" content="[^"]*"[^>]*>/i, `<meta property="og:description" content="${description}">`)
  html = html.replace(/<meta property="og:image" content="[^"]*"[^>]*>/i, `<meta property="og:image" content="${imageUrl}">`)
  html = html.replace(/<meta property="og:url" content="[^"]*"[^>]*>/i, `<meta property="og:url" content="${url}">`)
  html = html.replace(/<meta name="twitter:title" content="[^"]*"[^>]*>/i, `<meta name="twitter:title" content="${title}">`)
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"[^>]*>/i,
    `<meta name="twitter:description" content="${description}">`
  )
  html = html.replace(/<meta name="twitter:image" content="[^"]*"[^>]*>/i, `<meta name="twitter:image" content="${imageUrl}">`)

  return html
}

function isStaticAsset(pathname) {
  // Check if the request is for a static asset
  const staticExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.json',
    '.xml',
    '.txt',
    '.map'
  ]
  return staticExtensions.some((ext) => pathname.endsWith(ext)) || pathname.startsWith('/assets/')
}

async function serveSPAFallback(env, request) {
  const url = new URL(request.url)

  // First try to serve the requested asset
  const assetResponse = await env.ASSETS.fetch(request)
  if (assetResponse.status !== 404) {
    console.log('[Middleware] Asset found:', url.pathname)
    return assetResponse
  }

  // If not found, serve index.html for SPA routing
  console.log('[Middleware] SPA fallback for:', url.pathname)
  const indexRequest = new Request(new URL('/index.html', request.url).toString())
  const indexResponse = await env.ASSETS.fetch(indexRequest)

  return new Response(indexResponse.body, {
    status: 200,
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'no-cache'
    }
  })
}

async function onRequest(context) {
  const { request, env } = context
  const userAgent = request.headers.get('user-agent') || ''
  const url = new URL(request.url)

  console.log('[Middleware] Request:', url.pathname)

  // For static assets, try to serve them directly
  if (isStaticAsset(url.pathname)) {
    console.log('[Middleware] Static asset:', url.pathname)
    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404) {
      return response
    }
  }

  // Check conditions for SEO interception
  const isCrawlerRequest = isCrawler(userAgent)
  const isSEOTest = url.searchParams.get('seo') === 'true'
  const isBlogRoute = url.pathname === '/blog' || url.pathname === '/blog/' || url.pathname.startsWith('/blog/')

  console.log('[Middleware] isCrawler:', isCrawlerRequest, 'isSEOTest:', isSEOTest, 'isBlogRoute:', isBlogRoute)

  // For crawlers or SEO test on blog routes, intercept and modify HTML
  if (isBlogRoute && (isCrawlerRequest || isSEOTest)) {
    console.log('[Middleware] SEO interception for:', url.pathname)

    try {
      // Fetch the index.html using ASSETS binding
      const assetRequest = new Request(new URL('/index.html', request.url).toString())
      const response = await env.ASSETS.fetch(assetRequest)

      if (!response.ok) {
        console.log('[Middleware] Failed to fetch index.html')
        return serveSPAFallback(env, request)
      }

      const originalHTML = await response.text()
      const post = await fetchFirstBlogPost()
      const html = generateHTML(post, originalHTML, request.url)

      return new Response(html, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
          'cache-control': 'public, max-age=3600',
          'x-seo-middleware': 'active',
          'x-seo-post-title': post?.title || 'default'
        }
      })
    } catch (error) {
      console.error('[Middleware] Error:', error)
      return serveSPAFallback(env, request)
    }
  }

  // For all other requests, serve SPA fallback (index.html)
  return serveSPAFallback(env, request)
}

export { onRequest }
