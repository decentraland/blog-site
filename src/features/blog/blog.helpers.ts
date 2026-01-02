import { cmsBaseUrl } from '../../services/api'
import type { CMSEntry, CMSListResponse, CMSQueryParams, CMSReference } from './cms.types'

// Helper function to fetch from CMS API
const fetchFromCMS = async (endpoint: string, params?: CMSQueryParams): Promise<unknown> => {
  const baseUrl = cmsBaseUrl
  const url = new URL(`${baseUrl}${endpoint}`, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`CMS API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// ============================================================================
// ASSET CACHE - Only for assets that are not in RTK Query
// Assets are many and small, it makes sense to cache them in memory
// ============================================================================

const assetsCache = new Map<string, CMSEntry>()
const assetsCachePromises = new Map<string, Promise<CMSEntry>>()

const resolveAssetLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Asset') {
    const assetId = link.sys.id

    // Return from cache if available
    if (assetsCache.has(assetId)) {
      return assetsCache.get(assetId)
    }

    // If already fetching, wait for that promise
    if (assetsCachePromises.has(assetId)) {
      return assetsCachePromises.get(assetId)
    }

    // Start fetching
    const assetPromise = fetchFromCMS(`/assets/${assetId}`)
      .then((asset) => {
        const cmsAsset = asset as CMSEntry
        assetsCache.set(assetId, cmsAsset)
        assetsCachePromises.delete(assetId)
        return cmsAsset
      })
      .catch(() => {
        assetsCachePromises.delete(assetId)
        return value as CMSEntry
      })

    assetsCachePromises.set(assetId, assetPromise as Promise<CMSEntry>)
    return assetPromise
  }

  return value
}

// ============================================================================
// CATEGORY RESOLVER - Uses RTK Query cache via store
// ============================================================================

// Store reference will be set by initializeHelpers
let storeRef: { getState: () => unknown; dispatch: (action: unknown) => unknown } | null = null

const initializeHelpers = (store: { getState: () => unknown; dispatch: (action: unknown) => unknown }) => {
  storeRef = store
}

// Helper to get categories from RTK Query cache
const getCategoriesFromCache = (): Map<string, CMSEntry> => {
  if (!storeRef) {
    return new Map()
  }

  const state = storeRef.getState() as { cmsApi?: { queries?: Record<string, { data?: CMSListResponse }> } }
  const queries = state.cmsApi?.queries || {}

  // Look for getBlogCategories query result
  const categoriesQuery = Object.entries(queries).find(([key]) => key.startsWith('getBlogCategories'))

  if (categoriesQuery && categoriesQuery[1]?.data) {
    const items = categoriesQuery[1].data as unknown as CMSEntry[]
    const map = new Map<string, CMSEntry>()
    for (const item of items) {
      if (item?.sys?.id) {
        map.set(item.sys.id, item)
      }
    }
    return map
  }

  return new Map()
}

// Helper to get authors from RTK Query cache
const getAuthorsFromCache = (): Map<string, CMSEntry> => {
  if (!storeRef) {
    return new Map()
  }

  const state = storeRef.getState() as { cmsApi?: { queries?: Record<string, { data?: CMSListResponse }> } }
  const queries = state.cmsApi?.queries || {}

  // Look for getBlogAuthors query result
  const authorsQuery = Object.entries(queries).find(([key]) => key.startsWith('getBlogAuthors'))

  if (authorsQuery && authorsQuery[1]?.data) {
    const items = authorsQuery[1].data as unknown as CMSEntry[]
    const map = new Map<string, CMSEntry>()
    for (const item of items) {
      if (item?.sys?.id) {
        map.set(item.sys.id, item)
      }
    }
    return map
  }

  return new Map()
}

const resolveCategoryLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  const entry = value as CMSEntry

  // If it's a Link reference, resolve from RTK Query cache
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    const categoriesMap = getCategoriesFromCache()
    const category = categoriesMap.get(link.sys.id)
    if (category) {
      return category
    }

    // If not in cache, fetch directly (fallback)
    try {
      const fetched = await fetchFromCMS(`/entries/${link.sys.id}`)
      const cmsEntry = fetched as CMSEntry
      if (cmsEntry.fields?.image) {
        cmsEntry.fields.image = await resolveAssetLink(cmsEntry.fields.image)
      }
      return cmsEntry
    } catch {
      return value
    }
  }

  // If it already has fields, it's already resolved
  if (entry?.sys?.id && entry?.fields) {
    if (entry.fields.image) {
      entry.fields.image = await resolveAssetLink(entry.fields.image)
    }
    return value
  }

  // If it has an ID but no fields, try to resolve from cache
  if (entry?.sys?.id) {
    const categoriesMap = getCategoriesFromCache()
    const category = categoriesMap.get(entry.sys.id)
    if (category) {
      return category
    }
  }

  return value
}

// ============================================================================
// AUTHOR RESOLVER - Uses RTK Query cache via store
// ============================================================================

const resolveAuthorLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  const entry = value as CMSEntry

  // If it's a Link reference, resolve from RTK Query cache
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    const authorsMap = getAuthorsFromCache()
    const author = authorsMap.get(link.sys.id)
    if (author) {
      return author
    }

    // If not in cache, fetch directly (fallback)
    try {
      const fetched = await fetchFromCMS(`/entries/${link.sys.id}`)
      const cmsEntry = fetched as CMSEntry
      if (cmsEntry.fields?.image) {
        cmsEntry.fields.image = await resolveAssetLink(cmsEntry.fields.image)
      }
      return cmsEntry
    } catch {
      return value
    }
  }

  // If it already has fields, just resolve the image if needed
  if (entry?.sys?.id && entry?.fields) {
    if (entry.fields.image) {
      entry.fields.image = await resolveAssetLink(entry.fields.image)
    }
    return entry
  }

  // If it has an ID but no fields, try to resolve from cache
  if (entry?.sys?.id) {
    const authorsMap = getAuthorsFromCache()
    const author = authorsMap.get(entry.sys.id)
    if (author) {
      return author
    }
  }

  return value
}

export { fetchFromCMS, initializeHelpers, resolveAssetLink, resolveAuthorLink, resolveCategoryLink }
