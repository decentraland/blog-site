import { cmsBaseUrl } from '../../services/client'
import type { SlugFields } from './blog.types'
import type { CMSEntry, CMSListResponse, CMSQueryParams, CMSReference } from './cms.types'

// ============================================================================
// SLUG EXTRACTION - Unified logic for getting slug from CMS entries
// ============================================================================

/**
 * Extracts slug from CMS entry fields.
 * Priority: fields.id > fields.slug > slugified title > sys.id fallback
 */
const getEntrySlug = (fields: SlugFields, sysId?: string): string => {
  return fields.id || fields.slug || fields.title?.toLowerCase().replace(/\s+/g, '-') || sysId || ''
}

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
      .then(asset => {
        const cmsAsset = asset as CMSEntry
        assetsCache.set(assetId, cmsAsset)
        assetsCachePromises.delete(assetId)
        return cmsAsset
      })
      .catch(() => {
        assetsCachePromises.delete(assetId)
        return value as CMSEntry
      })

    assetsCachePromises.set(assetId, assetPromise)
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

  const state = storeRef.getState() as { cmsClient?: { queries?: Record<string, { data?: CMSListResponse }> } }
  const queries = state.cmsClient?.queries || {}

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

  const state = storeRef.getState() as { cmsClient?: { queries?: Record<string, { data?: CMSListResponse }> } }
  const queries = state.cmsClient?.queries || {}

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
    .then(async fetched => {
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

// ============================================================================
// BATCH PREFETCH - Fire all reference fetches in parallel to avoid waterfalls
// ============================================================================

/**
 * Extracts all linked Asset and Entry IDs from a list of CMS entries
 * and prefetches them in parallel, populating the caches before per-post resolution.
 * This turns a cascading waterfall (post → entry → asset) into a single parallel wave.
 */
const prefetchReferences = async (items: CMSEntry[]): Promise<void> => {
  const assetIds = new Set<string>()
  const entryIds = new Set<string>()

  // Collect all linked IDs from the response
  for (const item of items) {
    if (!item.fields) continue

    // Direct asset links (post image)
    const image = item.fields.image as CMSReference | undefined
    if (image?.sys?.type === 'Link' && image.sys.linkType === 'Asset') {
      assetIds.add(image.sys.id)
    }

    // Entry links (category, author) — these will also have image assets
    const category = item.fields.category as CMSReference | undefined
    if (category?.sys?.type === 'Link' && category.sys.linkType === 'Entry') {
      entryIds.add(category.sys.id)
    }

    const author = item.fields.author as CMSReference | undefined
    if (author?.sys?.type === 'Link' && author.sys.linkType === 'Entry') {
      entryIds.add(author.sys.id)
    }
  }

  // Filter out already-cached IDs
  const uncachedAssetIds = [...assetIds].filter(id => !assetsCache.has(id) && !assetsCachePromises.has(id))
  const uncachedEntryIds = [...entryIds].filter(
    id => !entriesCache.has(id) && !entriesCachePromises.has(id) && !resolvedCategoriesCache.has(id) && !resolvedAuthorsCache.has(id)
  )

  // Fire all fetches in parallel (entries first, then their image assets)
  const entryPromises = uncachedEntryIds.map(id => {
    const promise = fetchFromCMS(`/entries/${id}`)
      .then(fetched => {
        const cmsEntry = fetched as CMSEntry
        entriesCache.set(id, cmsEntry)
        entriesCachePromises.delete(id)

        // Collect any nested image asset IDs from the fetched entry
        const entryImage = cmsEntry.fields?.image as CMSReference | undefined
        if (entryImage?.sys?.type === 'Link' && entryImage.sys.linkType === 'Asset') {
          assetIds.add(entryImage.sys.id)
        }

        return cmsEntry
      })
      .catch(() => {
        entriesCachePromises.delete(id)
        return null
      })

    entriesCachePromises.set(id, promise as Promise<CMSEntry>)
    return promise
  })

  const assetPromises = uncachedAssetIds.map(id => {
    const promise = fetchFromCMS(`/assets/${id}`)
      .then(asset => {
        const cmsAsset = asset as CMSEntry
        assetsCache.set(id, cmsAsset)
        assetsCachePromises.delete(id)
        return cmsAsset
      })
      .catch(() => {
        assetsCachePromises.delete(id)
        return null
      })

    assetsCachePromises.set(id, promise as Promise<CMSEntry>)
    return promise
  })

  // Wait for entries first (they may reveal more asset IDs)
  await Promise.all(entryPromises)

  // Now fetch any newly discovered asset IDs from entries (e.g. category/author images)
  const newAssetIds = [...assetIds].filter(id => !assetsCache.has(id) && !assetsCachePromises.has(id))
  const secondWavePromises = newAssetIds.map(id => {
    const promise = fetchFromCMS(`/assets/${id}`)
      .then(asset => {
        const cmsAsset = asset as CMSEntry
        assetsCache.set(id, cmsAsset)
        assetsCachePromises.delete(id)
        return cmsAsset
      })
      .catch(() => {
        assetsCachePromises.delete(id)
        return null
      })

    assetsCachePromises.set(id, promise as Promise<CMSEntry>)
    return promise
  })

  // Wait for all assets (both waves)
  await Promise.all([...assetPromises, ...secondWavePromises])

  // Now resolve image references inside cached entries so that downstream code
  // (fetchAndCacheEntry, resolveCategoryLink, resolveAuthorLink) finds fully
  // resolved entries when it hits the cache.
  for (const entryId of uncachedEntryIds) {
    const entry = entriesCache.get(entryId)
    if (!entry?.fields?.image) continue

    const imageLink = entry.fields.image as CMSReference | undefined
    if (imageLink?.sys?.type === 'Link' && imageLink.sys.linkType === 'Asset') {
      const resolvedAsset = assetsCache.get(imageLink.sys.id)
      if (resolvedAsset) {
        entry.fields.image = resolvedAsset
        entriesCache.set(entryId, entry)
      }
    }
  }
}

// ============================================================================
// URL RESOLVERS - Simple functions that return just URLs/slugs from references
// ============================================================================

const resolveAssetUrl = async (assetId: string): Promise<string> => {
  if (!assetId) return ''

  const resolved = await resolveAssetLink({ sys: { type: 'Link', linkType: 'Asset', id: assetId } })
  const asset = resolved as CMSEntry
  const url = (asset?.fields?.file as { url?: string })?.url || ''
  const fullUrl = url.startsWith('//') ? `https:${url}` : url

  // Optimize Contentful image URLs with WebP and quality params
  if (fullUrl && (fullUrl.includes('cms-images.') || fullUrl.includes('images.ctfassets.net'))) {
    const contentType = (asset?.fields?.file as { contentType?: string })?.contentType || ''
    if (!contentType.includes('svg')) {
      const separator = fullUrl.includes('?') ? '&' : '?'
      return `${fullUrl}${separator}fm=webp&q=80`
    }
  }

  return fullUrl
}

const resolveEntrySlug = async (entryId: string): Promise<string> => {
  if (!entryId) return ''

  // Return from cache if available
  if (entriesCache.has(entryId)) {
    const entry = entriesCache.get(entryId)
    return (entry?.fields?.id as string) || (entry?.fields?.slug as string) || ''
  }

  // If already fetching, wait for that promise
  if (entriesCachePromises.has(entryId)) {
    const entry = await entriesCachePromises.get(entryId)
    return (entry?.fields?.id as string) || (entry?.fields?.slug as string) || ''
  }

  try {
    const entryPromise = fetchFromCMS(`/entries/${entryId}`)
    entriesCachePromises.set(entryId, entryPromise as Promise<CMSEntry>)

    const entry = (await entryPromise) as CMSEntry
    entriesCache.set(entryId, entry)
    entriesCachePromises.delete(entryId)

    return (entry?.fields?.id as string) || (entry?.fields?.slug as string) || ''
  } catch {
    entriesCachePromises.delete(entryId)
    return ''
  }
}

export {
  fetchFromCMS,
  getEntrySlug,
  initializeHelpers,
  prefetchReferences,
  resolveAssetLink,
  resolveAssetUrl,
  resolveAuthorLink,
  resolveCategoryLink,
  resolveEntrySlug
}
