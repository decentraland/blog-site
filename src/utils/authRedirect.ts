import { clearWagmiState } from '@dcl/core-web3'
import { getEnv } from '../config'

/**
 * Gets the basename based on the current host.
 * Returns "/blog" for decentraland domains, empty string otherwise.
 */
function getBasename(): string {
  return /^decentraland.(zone|org|today)$/.test(window.location.host) ? '/blog' : ''
}

/**
 * Builds a redirect URL for authentication.
 * @param path - The path to redirect to after authentication (may include query params)
 * @param queryParams - Optional query parameters to append to the path
 * @returns The full redirect URL with basename
 */
function buildAuthRedirectUrl(path: string, queryParams?: Record<string, string>): string {
  const basename = getBasename()

  // Parse the path, handling cases where it already includes query params
  const url = new URL(path, window.location.origin)
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  // Remove the origin, keep only pathname + search
  const pathWithQuery = url.pathname + url.search
  return `${basename}${pathWithQuery}`
}

/**
 * Resolves the auth URL based on environment and host.
 * - If AUTH_URL is absolute (http/https), use it directly
 * - If AUTH_URL is relative: use same origin + path so Vercel rewrite /auth -> decentraland.zone/auth applies
 */
function resolveAuthUrl(): string {
  const authUrl = getEnv('AUTH_URL') ?? '/auth'

  if (authUrl.startsWith('http')) {
    return authUrl
  }

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  if (isLocalhost) {
    return authUrl
  }

  return `${window.location.origin}${authUrl.startsWith('/') ? '' : '/'}${authUrl}`
}

/**
 * Resolves the path to redirect to after login from the current URL.
 * If the URL has a redirectTo query param, uses it; otherwise uses pathname + search.
 */
function getRedirectPathFromCurrentUrl(): string {
  const pathname = window.location.pathname
  const search = window.location.search
  const searchParams = new URLSearchParams(search)
  const currentRedirectTo = searchParams.get('redirectTo')
  return currentRedirectTo ?? `${pathname}${search}`
}

/**
 * Redirects to the authentication URL with the specified redirect path.
 * When path is omitted, resolves it from the current URL (respecting redirectTo query param).
 * @param path - Optional path to redirect to after authentication (defaults to current URL)
 * @param queryParams - Optional query parameters to append to the path
 */
function redirectToAuth(path?: string, queryParams?: Record<string, string>): void {
  const redirectPath = path ?? getRedirectPathFromCurrentUrl()
  const redirectTo = buildAuthRedirectUrl(redirectPath, queryParams)
  const authUrl = resolveAuthUrl()

  clearWagmiState()

  window.location.replace(`${authUrl}/login?redirectTo=${encodeURIComponent(redirectTo)}`)
}

export { buildAuthRedirectUrl, redirectToAuth }
