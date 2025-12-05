/* eslint-env serviceworker */
// Decentraland Blog - Service Worker for API Caching
// Cache version - increment to invalidate all caches
const CACHE_VERSION = 'dcl-blog-v1'
const API_CACHE = `${CACHE_VERSION}-api`
const ASSET_CACHE = `${CACHE_VERSION}-assets`

// Cache duration in milliseconds
const API_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const ASSET_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Patterns to match for caching
const API_PATTERNS = [/\/api\/cms\//, /cms\.decentraland\.org/, /contentful/]

const ASSET_PATTERNS = [/\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/, /\/assets\//, /images\.ctfassets\.net/]

// Install event - cleanup old caches
self.addEventListener('install', () => {
  console.log('[SW] Installing service worker...')
  self.skipWaiting()
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old cache versions
            return cacheName.startsWith('dcl-blog-') && !cacheName.startsWith(CACHE_VERSION)
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  return self.clients.claim()
})

// Helper: Check if URL matches any pattern
function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url))
}

// Helper: Check if cached response is still fresh
function isFresh(response, maxAge) {
  if (!response) return false

  const cachedTime = response.headers.get('sw-cache-time')
  if (!cachedTime) return false

  const age = Date.now() - parseInt(cachedTime, 10)
  return age < maxAge
}

// Helper: Add timestamp to response headers
async function addCacheTimestamp(response) {
  const headers = new Headers(response.headers)
  headers.set('sw-cache-time', Date.now().toString())

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

// Strategy: Stale-While-Revalidate for API calls
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  // Fetch from network
  const fetchPromise = fetch(request)
    .then(async (response) => {
      // Only cache successful responses
      if (response && response.status === 200) {
        const responseToCache = await addCacheTimestamp(response.clone())
        cache.put(request, responseToCache)
      }
      return response
    })
    .catch((error) => {
      console.error('[SW] Fetch failed:', error)
      // Return cached response even if stale on network error
      return cachedResponse
    })

  // Return cached response if available and fresh, otherwise wait for network
  if (cachedResponse && isFresh(cachedResponse, maxAge)) {
    // Return cache immediately, update in background
    fetchPromise.catch(() => {}) // Prevent unhandled rejection
    return cachedResponse
  }

  // Wait for network response
  return fetchPromise
}

// Strategy: Cache First for assets
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  // Return cached if fresh
  if (cachedResponse && isFresh(cachedResponse, maxAge)) {
    return cachedResponse
  }

  // Fetch from network and cache
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const responseToCache = await addCacheTimestamp(response.clone())
      cache.put(request, responseToCache)
    }
    return response
  } catch (error) {
    console.error('[SW] Asset fetch failed:', error)
    // Return stale cache if available
    return cachedResponse || new Response('Network error', { status: 503 })
  }
}

// Fetch event - intercept and cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = request.url

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Handle API requests with stale-while-revalidate
  if (matchesPattern(url, API_PATTERNS)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE, API_CACHE_DURATION))
    return
  }

  // Handle assets with cache-first
  if (matchesPattern(url, ASSET_PATTERNS)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE, ASSET_CACHE_DURATION))
    return
  }

  // For everything else, just fetch from network
})

// Message event - allow cache control from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Clearing cache:', cacheName)
            return caches.delete(cacheName)
          })
        )
      })
    )
  }
})
