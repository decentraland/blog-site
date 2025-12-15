/**
 * Cloudflare Pages Function - Middleware for SEO and SPA routing
 *
 * This middleware intercepts requests from crawlers (Google, Facebook, Twitter, etc.)
 * and serves pre-rendered HTML with correct meta tags for SEO.
 * It also handles SPA routing fallback (replaces _redirects).
 *
 * How it works:
 * 1. Detects if the request is from a crawler (via User-Agent)
 * 2. For crawlers on /blog routes: fetches blog data from CMS and injects meta tags
 * 3. For regular users: serves the SPA normally
 *
 * Testing:
 * - Add ?seo=true to any /blog URL to test the SEO response
 * - Example: https://your-domain.pages.dev/blog?seo=true
 *
 * ============================================================================
 * MIGRATION TO VERCEL
 * ============================================================================
 *
 * To migrate from Cloudflare Pages to Vercel, you need to:
 *
 * 1. Delete this file (functions/_middleware.js)
 *
 * 2. Create middleware.ts in the project root:
 *
 *    ```typescript
 *    // middleware.ts
 *    import { NextRequest, NextResponse } from 'next/server'
 *
 *    const CRAWLER_USER_AGENTS = [
 *      'googlebot', 'bingbot', 'facebookexternalhit', 'twitterbot',
 *      'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot', 'slackbot'
 *    ]
 *
 *    function isCrawler(userAgent: string): boolean {
 *      const ua = userAgent.toLowerCase()
 *      return CRAWLER_USER_AGENTS.some(crawler => ua.includes(crawler))
 *    }
 *
 *    export async function middleware(request: NextRequest) {
 *      const userAgent = request.headers.get('user-agent') || ''
 *      const { pathname, searchParams } = request.nextUrl
 *
 *      const isCrawlerRequest = isCrawler(userAgent)
 *      const isSEOTest = searchParams.get('seo') === 'true'
 *      const isBlogRoute = pathname.startsWith('/blog')
 *
 *      if (isBlogRoute && (isCrawlerRequest || isSEOTest)) {
 *        // Fetch blog data and return modified HTML
 *        // Use the same fetchFirstBlogPost() and generateHTML() logic
 *        const post = await fetchFirstBlogPost()
 *        const html = await fetchAndModifyHTML(request.url, post)
 *        return new NextResponse(html, {
 *          headers: { 'content-type': 'text/html;charset=UTF-8' }
 *        })
 *      }
 *
 *      return NextResponse.next()
 *    }
 *
 *    export const config = {
 *      matcher: ['/blog/:path*']
 *    }
 *    ```
 *
 * 3. Update vercel.json to handle SPA routing:
 *
 *    ```json
 *    {
 *      "rewrites": [
 *        { "source": "/((?!api|_next|assets|favicon.ico).*)", "destination": "/" }
 *      ]
 *    }
 *    ```
 *
 * 4. Key differences between Cloudflare and Vercel:
 *    - Cloudflare: Uses env.ASSETS.fetch() to get static files
 *    - Vercel: Uses fetch() to get files from the deployment URL
 *    - Cloudflare: exports { onRequest }
 *    - Vercel: exports { middleware } and config.matcher
 *
 * ============================================================================
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
  const assetResponse = await env.ASSETS.fetch(request)
  if (assetResponse.status !== 404) {
    return assetResponse
  }

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

  if (isStaticAsset(url.pathname)) {
    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404) {
      return response
    }
  }

  const isCrawlerRequest = isCrawler(userAgent)
  const isSEOTest = url.searchParams.get('seo') === 'true'
  const isBlogRoute = url.pathname === '/blog' || url.pathname === '/blog/' || url.pathname.startsWith('/blog/')

  if (isBlogRoute && (isCrawlerRequest || isSEOTest)) {
    try {
      const assetRequest = new Request(new URL('/index.html', request.url).toString())
      const response = await env.ASSETS.fetch(assetRequest)

      if (!response.ok) {
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

  return serveSPAFallback(env, request)
}

export { onRequest }
