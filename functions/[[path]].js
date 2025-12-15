// Cloudflare Pages Function - SPA Fallback Handler
// This serves index.html for all routes that don't match static files
// Equivalent to _redirects: /* /index.html 200

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  console.log('[SPA Fallback] Request for:', url.pathname)

  try {
    // First, try to serve the requested asset
    const assetResponse = await env.ASSETS.fetch(request)

    // If the asset exists (not 404), return it
    if (assetResponse.status !== 404) {
      console.log('[SPA Fallback] Asset found:', url.pathname)
      return assetResponse
    }

    // If asset not found, serve index.html for SPA routing
    console.log('[SPA Fallback] Serving index.html for:', url.pathname)
    const indexRequest = new Request(new URL('/index.html', request.url).toString())
    const indexResponse = await env.ASSETS.fetch(indexRequest)

    // Return with correct content type
    return new Response(indexResponse.body, {
      status: 200,
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('[SPA Fallback] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
