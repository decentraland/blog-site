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
// ENTRY CACHES - For assets, categories, authors, and resolved posts
// Prevents duplicate requests when resolving references
// ============================================================================

const assetsCache = new Map<string, CMSEntry>()
const assetsCachePromises = new Map<string, Promise<CMSEntry>>()

const entriesCache = new Map<string, CMSEntry>()
const entriesCachePromises = new Map<string, Promise<CMSEntry>>()

// Cache for fully resolved posts - keyed by post ID
// This allows reusing posts across different category views
const resolvedPostsCache = new Map<string, CMSEntry>()

// Get a resolved post from cache by ID
const getResolvedPostFromCache = (postId: string): CMSEntry | undefined => {
  return resolvedPostsCache.get(postId)
}

// Save a resolved post to cache
const cacheResolvedPost = (post: CMSEntry): void => {
  if (post?.sys?.id) {
    resolvedPostsCache.set(post.sys.id, post)
  }
}

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

// Local cache for resolved categories/authors with their images
const resolvedCategoriesCache = new Map<string, CMSEntry>()
const resolvedAuthorsCache = new Map<string, CMSEntry>()

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

// Helper to fetch and cache an entry by ID
const fetchAndCacheEntry = async (entryId: string): Promise<CMSEntry> => {
  // Return from cache if available
  if (entriesCache.has(entryId)) {
    return entriesCache.get(entryId)!
  }

  // If already fetching, wait for that promise
  if (entriesCachePromises.has(entryId)) {
    return entriesCachePromises.get(entryId)!
  }

  // Start fetching
  const entryPromise = fetchFromCMS(`/entries/${entryId}`)
    .then(async (fetched) => {
      const cmsEntry = fetched as CMSEntry
      if (cmsEntry.fields?.image) {
        cmsEntry.fields.image = await resolveAssetLink(cmsEntry.fields.image)
      }
      entriesCache.set(entryId, cmsEntry)
      entriesCachePromises.delete(entryId)
      return cmsEntry
    })
    .catch(() => {
      entriesCachePromises.delete(entryId)
      throw new Error(`Failed to fetch entry ${entryId}`)
    })

  entriesCachePromises.set(entryId, entryPromise)
  return entryPromise
}

const resolveCategoryLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  const entry = value as CMSEntry

  // If it's a Link reference, resolve from caches
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    const entryId = link.sys.id

    // Check our local resolved cache first (already has image resolved)
    if (resolvedCategoriesCache.has(entryId)) {
      return resolvedCategoriesCache.get(entryId)!
    }

    // Try RTK Query cache
    const categoriesMap = getCategoriesFromCache()
    const category = categoriesMap.get(entryId)
    if (category) {
      // Resolve image and cache the result
      if (category.fields?.image) {
        category.fields.image = await resolveAssetLink(category.fields.image)
      }
      resolvedCategoriesCache.set(entryId, category)
      return category
    }

    // Use local cache for fetching
    try {
      const fetched = await fetchAndCacheEntry(entryId)
      resolvedCategoriesCache.set(entryId, fetched)
      return fetched
    } catch {
      return value
    }
  }

  // If it already has fields, it's already resolved
  if (entry?.sys?.id && entry?.fields) {
    // Check if we already resolved this
    if (resolvedCategoriesCache.has(entry.sys.id)) {
      return resolvedCategoriesCache.get(entry.sys.id)!
    }
    if (entry.fields.image) {
      entry.fields.image = await resolveAssetLink(entry.fields.image)
    }
    resolvedCategoriesCache.set(entry.sys.id, entry)
    return entry
  }

  // If it has an ID but no fields, try to resolve from cache
  if (entry?.sys?.id) {
    if (resolvedCategoriesCache.has(entry.sys.id)) {
      return resolvedCategoriesCache.get(entry.sys.id)!
    }
    const categoriesMap = getCategoriesFromCache()
    const category = categoriesMap.get(entry.sys.id)
    if (category) {
      if (category.fields?.image) {
        category.fields.image = await resolveAssetLink(category.fields.image)
      }
      resolvedCategoriesCache.set(entry.sys.id, category)
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

  // If it's a Link reference, resolve from caches
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    const entryId = link.sys.id

    // Check our local resolved cache first (already has image resolved)
    if (resolvedAuthorsCache.has(entryId)) {
      return resolvedAuthorsCache.get(entryId)!
    }

    // Try RTK Query cache
    const authorsMap = getAuthorsFromCache()
    const author = authorsMap.get(entryId)
    if (author) {
      // Resolve image and cache the result
      if (author.fields?.image) {
        author.fields.image = await resolveAssetLink(author.fields.image)
      }
      resolvedAuthorsCache.set(entryId, author)
      return author
    }

    // Use local cache for fetching
    try {
      const fetched = await fetchAndCacheEntry(entryId)
      resolvedAuthorsCache.set(entryId, fetched)
      return fetched
    } catch {
      return value
    }
  }

  // If it already has fields, just resolve the image if needed
  if (entry?.sys?.id && entry?.fields) {
    // Check if we already resolved this
    if (resolvedAuthorsCache.has(entry.sys.id)) {
      return resolvedAuthorsCache.get(entry.sys.id)!
    }
    if (entry.fields.image) {
      entry.fields.image = await resolveAssetLink(entry.fields.image)
    }
    resolvedAuthorsCache.set(entry.sys.id, entry)
    return entry
  }

  // If it has an ID but no fields, try to resolve from cache
  if (entry?.sys?.id) {
    if (resolvedAuthorsCache.has(entry.sys.id)) {
      return resolvedAuthorsCache.get(entry.sys.id)!
    }
    const authorsMap = getAuthorsFromCache()
    const author = authorsMap.get(entry.sys.id)
    if (author) {
      if (author.fields?.image) {
        author.fields.image = await resolveAssetLink(author.fields.image)
      }
      resolvedAuthorsCache.set(entry.sys.id, author)
      return author
    }
    try {
      const fetched = await fetchAndCacheEntry(entry.sys.id)
      resolvedAuthorsCache.set(entry.sys.id, fetched)
      return fetched
    } catch {
      return value
    }
  }

  return value
}

export {
  cacheResolvedPost,
  fetchFromCMS,
  getResolvedPostFromCache,
  initializeHelpers,
  resolveAssetLink,
  resolveAuthorLink,
  resolveCategoryLink
}
