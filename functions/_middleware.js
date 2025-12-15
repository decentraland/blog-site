// Cloudflare Pages Function - Middleware for SEO
// This intercepts requests from crawlers and serves pre-rendered HTML with correct meta tags

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

function isCrawler(userAgent) {
  const ua = (userAgent || '').toLowerCase()
  return CRAWLER_USER_AGENTS.some((crawler) => ua.includes(crawler))
}

async function fetchFirstBlogPost() {
  try {
    const response = await fetch(`${CMS_BASE_URL}/entries?content_type=blog&order=-fields.publishedDate&limit=1`)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.items || data.items.length === 0) return null

    const fields = data.items[0].fields || {}

    let imageUrl = 'https://decentraland.org/static/background-v3@1x-f3aaf66f210e3bf6a747de9951036ba3.jpg'

    if (fields.image?.sys?.id && data.includes?.Asset) {
      const asset = data.includes.Asset.find((a) => a.sys?.id === fields.image.sys.id)
      if (asset?.fields?.file?.url) {
        imageUrl = asset.fields.file.url.startsWith('//') ? `https:${asset.fields.file.url}` : asset.fields.file.url
      }
    }

    return {
      title: fields.title || 'Decentraland',
      description: fields.description || 'Stay up to date with Decentraland announcements, updates, community highlights, and more.',
      imageUrl
    }
  } catch (error) {
    console.error('[SEO] Error fetching blog post:', error)
    return null
  }
}

function generateHTML(post, originalHTML, url) {
  const title = post?.title || 'Decentraland'
  const description = post?.description || 'Stay up to date with Decentraland announcements, updates, community highlights, and more.'
  const imageUrl = post?.imageUrl || 'https://decentraland.org/static/background-v3@1x-f3aaf66f210e3bf6a747de9951036ba3.jpg'

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

export async function onRequest(context) {
  const { request, next } = context
  const userAgent = request.headers.get('user-agent') || ''
  const url = new URL(request.url)

  console.log('[SEO] Request:', url.pathname, '| UA:', userAgent.substring(0, 50))

  // Check conditions
  const isCrawlerRequest = isCrawler(userAgent)
  const isSEOTest = url.searchParams.get('seo') === 'true'
  const isBlogRoute = url.pathname === '/blog' || url.pathname === '/blog/'

  if (!isBlogRoute || (!isCrawlerRequest && !isSEOTest)) {
    return next()
  }

  console.log('[SEO] Intercepting for SEO')

  try {
    const response = await next()
    const originalHTML = await response.text()
    const post = await fetchFirstBlogPost()
    const html = generateHTML(post, originalHTML, request.url)

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=3600',
        'x-seo-middleware': 'active'
      }
    })
  } catch (error) {
    console.error('[SEO] Error:', error)
    return next()
  }
}
