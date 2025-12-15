// Cloudflare Pages Function - SPA Fallback Handler
// This serves index.html for all routes that don't match static files
// Equivalent to _redirects: /* /index.html 200

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)

  console.log('[SPA Fallback] Serving index.html for:', url.pathname)

  try {
    // Fetch the index.html
    const assetUrl = new URL('/index.html', request.url)
    const response = await fetch(assetUrl.toString())

    if (!response.ok) {
      return new Response('Not Found', { status: 404 })
    }

    const html = await response.text()

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8'
      }
    })
  } catch (error) {
    console.error('[SPA Fallback] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
