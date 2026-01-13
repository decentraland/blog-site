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
 * Clears wagmi localStorage state before redirecting to auth.
 *
 * This is necessary because wagmi trusts its stored state. If the user was
 * disconnected before going to auth, wagmi has saved {connections: [], current: null}.
 * When returning from auth (even though MetaMask is now authorized), wagmi loads
 * this "disconnected" state and doesn't re-check authorization.
 *
 * The auth site doesn't update our wagmi state (it may use different config/storage),
 * so we clear it before redirecting to ensure a fresh reconnection on return.
 */
function clearWagmiState(): void {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('wagmi.')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

/**
 * Redirects to the authentication URL with the specified redirect path.
 * @param path - The path to redirect to after authentication
 * @param queryParams - Optional query parameters to append to the path
 */
function redirectToAuth(path: string, queryParams?: Record<string, string>): void {
  const redirectTo = buildAuthRedirectUrl(path, queryParams)
  const authUrl = getEnv('AUTH_URL')

  // Clear stale wagmi state to ensure fresh reconnection on return
  clearWagmiState()

  window.location.replace(`${authUrl}/login?redirectTo=${encodeURIComponent(redirectTo)}`)
}

export { buildAuthRedirectUrl, redirectToAuth }
