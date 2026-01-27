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
 * - If AUTH_URL is relative and we're on localhost, use relative path (for Vite proxy)
 * - If AUTH_URL is relative and we're NOT on localhost (Vercel preview), use staging URL
 */
function resolveAuthUrl(): string {
  const authUrl = getEnv('AUTH_URL') ?? '/auth'

  // If it's an absolute URL, use it directly
  if (authUrl.startsWith('http')) {
    return authUrl
  }

  // For relative URLs, check if we're on localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  if (isLocalhost) {
    // Use relative path for Vite proxy in local development
    return authUrl
  }

  // On Vercel preview deploys (non-localhost, non-decentraland domain), use staging auth
  return 'https://decentraland.zone/auth'
}

/**
 * Redirects to the authentication URL with the specified redirect path.
 * @param path - The path to redirect to after authentication
 * @param queryParams - Optional query parameters to append to the path
 */
function redirectToAuth(path: string, queryParams?: Record<string, string>): void {
  const redirectTo = buildAuthRedirectUrl(path, queryParams)
  const authUrl = resolveAuthUrl()

  // Clear stale wagmi state to ensure fresh reconnection on return
  clearWagmiState()

  window.location.replace(`${authUrl}/login?redirectTo=${encodeURIComponent(redirectTo)}`)
}

export { buildAuthRedirectUrl, redirectToAuth }
