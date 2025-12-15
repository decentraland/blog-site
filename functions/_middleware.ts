// Cloudflare Pages Function - Middleware for SEO
// This intercepts requests from crawlers and serves pre-rendered HTML with correct meta tags

const CRAWLER_USER_AGENTS = [
  // Search engines
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'sogou',
  'exabot',
  'ia_archiver',

  // Social media
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'redditbot',
  'vkshare',

  // Messaging apps
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slackbot',
  'skypeuripreview',

  // Other crawlers
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'rogerbot',
  'w3c_validator',

  // Testing tools (for debugging)
  'opengraph',
  'metatags',
  'prerender',
  'headless',
  'phantom',
  'selenium'
]

const CMS_BASE_URL = 'https://cms.decentraland.org/spaces/ea2ybdmmn1kv/environments/master'

interface BlogPost {
  title: string
  description: string
  image?: {
    url: string
    width?: number
    height?: number
  }
  author?: string
  publishedDate?: string
}

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return CRAWLER_USER_AGENTS.some((crawler) => ua.includes(crawler))
}

async function fetchFirstBlogPost(): Promise<BlogPost | null> {
  try {
    console.log('[SEO Middleware] Fetching first blog post from CMS...')
    const response = await fetch(`${CMS_BASE_URL}/entries?content_type=blog&order=-fields.publishedDate&limit=1`)

    if (!response.ok) {
      console.log('[SEO Middleware] CMS response not ok:', response.status)
      return null
    }

    const data = (await response.json()) as {
      items?: Array<{
        fields?: {
          title?: string
          description?: string
          image?: { sys?: { id?: string } }
        }
      }>
      includes?: {
        Asset?: Array<{
          sys?: { id?: string }
          fields?: {
            file?: {
              url?: string
              details?: { image?: { width?: number; height?: number } }
            }
          }
        }>
      }
    }

    if (!data.items || data.items.length === 0) {
      console.log('[SEO Middleware] No blog posts found')
      return null
    }

    const post = data.items[0]
    const fields = post.fields

    // Get image from includes
    let imageUrl = 'https://decentraland.org/static/background-v3@1x-f3aaf66f210e3bf6a747de9951036ba3.jpg'
    let imageWidth = 1200
    let imageHeight = 630

    if (fields?.image?.sys?.id && data.includes?.Asset) {
      const asset = data.includes.Asset.find((a) => a.sys?.id === fields.image?.sys?.id)
      if (asset?.fields?.file?.url) {
        imageUrl = asset.fields.file.url.startsWith('//') ? `https:${asset.fields.file.url}` : asset.fields.file.url
        imageWidth = asset.fields.file.details?.image?.width || 1200
        imageHeight = asset.fields.file.details?.image?.height || 630
      }
    }

    const blogPost = {
      title: fields?.title || 'Decentraland',
      description: fields?.description || 'Stay up to date with Decentraland announcements, updates, community highlights, and more.',
      image: {
        url: imageUrl,
        width: imageWidth,
        height: imageHeight
      }
    }

    console.log('[SEO Middleware] Fetched post:', blogPost.title)
    return blogPost
  } catch (error) {
    console.error('[SEO Middleware] Error fetching blog post:', error)
    return null
  }
}

function generateHTML(post: BlogPost | null, originalHTML: string, url: string): string {
  const title = post?.title || 'Decentraland'
  const description = post?.description || 'Stay up to date with Decentraland announcements, updates, community highlights, and more.'
  const imageUrl = post?.image?.url || 'https://decentraland.org/static/background-v3@1x-f3aaf66f210e3bf6a747de9951036ba3.jpg'
  const imageWidth = post?.image?.width || 1200
  const imageHeight = post?.image?.height || 630

  // Replace meta tags in original HTML
  let html = originalHTML

  // Replace title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)

  // Replace meta description
  html = html.replace(/<meta name="description" content=".*?".*?\/?>/i, `<meta name="description" content="${description}" />`)

  // Replace OG tags
  html = html.replace(/<meta property="og:title" content=".*?".*?\/?>/i, `<meta property="og:title" content="${title}" />`)
  html = html.replace(
    /<meta property="og:description" content=".*?".*?\/?>/i,
    `<meta property="og:description" content="${description}" />`
  )
  html = html.replace(/<meta property="og:image" content=".*?".*?\/?>/i, `<meta property="og:image" content="${imageUrl}" />`)
  html = html.replace(/<meta property="og:url" content=".*?".*?\/?>/i, `<meta property="og:url" content="${url}" />`)

  // Add og:image dimensions if not present
  if (!html.includes('og:image:width')) {
    html = html.replace(
      /<meta property="og:image" content=".*?".*?\/?>/i,
      `$&\n  <meta property="og:image:width" content="${imageWidth}" />\n  <meta property="og:image:height" content="${imageHeight}" />`
    )
  }

  // Replace Twitter tags
  html = html.replace(/<meta name="twitter:title" content=".*?".*?\/?>/i, `<meta name="twitter:title" content="${title}" />`)
  html = html.replace(
    /<meta name="twitter:description" content=".*?".*?\/?>/i,
    `<meta name="twitter:description" content="${description}" />`
  )
  html = html.replace(/<meta name="twitter:image" content=".*?".*?\/?>/i, `<meta name="twitter:image" content="${imageUrl}" />`)

  return html
}

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context
  const userAgent = request.headers.get('user-agent') || ''
  const url = new URL(request.url)

  console.log('[SEO Middleware] Request:', url.pathname, '| User-Agent:', userAgent.substring(0, 100))

  // Check if this is a crawler or a request to /blog with ?seo=true for testing
  const isCrawlerRequest = isCrawler(userAgent)
  const isSEOTest = url.searchParams.get('seo') === 'true'
  const isBlogRoute = url.pathname === '/blog' || url.pathname === '/blog/'

  // Only intercept for blog routes when it's a crawler OR testing with ?seo=true
  if (!isBlogRoute || (!isCrawlerRequest && !isSEOTest)) {
    console.log('[SEO Middleware] Skipping - not a crawler or not blog route')
    return next()
  }

  console.log('[SEO Middleware] Intercepting request for SEO')

  try {
    // Get the original response
    const response = await next()
    const originalHTML = await response.text()

    // Fetch blog data
    const post = await fetchFirstBlogPost()

    // Generate HTML with correct meta tags
    const html = generateHTML(post, originalHTML, request.url)

    console.log('[SEO Middleware] Serving modified HTML with SEO tags')

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=3600', // Cache for 1 hour
        'x-seo-middleware': 'active' // Header to verify middleware is working
      }
    })
  } catch (error) {
    console.error('[SEO Middleware] Error:', error)
    return next()
  }
}
