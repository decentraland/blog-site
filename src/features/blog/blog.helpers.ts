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

  const finalUrl = url.toString()

  if (import.meta.env.DEV && endpoint.includes('/blog/posts')) {
    console.log('[fetchFromCMS] Requesting URL:', finalUrl)
  }

  const response = await fetch(finalUrl)

  if (!response.ok) {
    throw new Error(`CMS API error: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()

  if (import.meta.env.DEV && endpoint.includes('/blog/posts')) {
    const listResponse = json as CMSListResponse
    console.log('[fetchFromCMS] Response:', {
      url: finalUrl,
      total: listResponse.total,
      itemsCount: listResponse.items.length,
      firstItemId: listResponse.items[0]?.sys?.id,
      lastItemId: listResponse.items[listResponse.items.length - 1]?.sys?.id
    })
  }

  return json
}

// Category and asset caches - fetch once and reuse
let categoriesCache: Promise<Map<string, CMSEntry>> | null = null
const assetsCache = new Map<string, unknown>()
const authorsCache = new Map<string, Promise<unknown>>()

const getCategoriesMap = async (): Promise<Map<string, CMSEntry>> => {
  if (!categoriesCache) {
    categoriesCache = (async () => {
      try {
        const listResponse = await fetchFromCMS('/blog/categories')
        const listResponseTyped = listResponse as CMSListResponse
        const ids = listResponseTyped.items.map((item) => item.sys.id)

        const categoryPromises = ids.map(async (id) => {
          const entry = await fetchFromCMS(`/entries/${id}`)
          const cmsEntry = entry as CMSEntry

          if (cmsEntry.fields.image) {
            cmsEntry.fields.image = await resolveAssetLink(cmsEntry.fields.image)
          }

          return cmsEntry
        })

        const categories = await Promise.all(categoryPromises)
        const map = new Map<string, CMSEntry>()

        for (const category of categories) {
          map.set(category.sys.id, category)
        }

        return map
      } catch (error) {
        return new Map()
      }
    })()
  }

  return categoriesCache
}

// Helper to resolve asset links
const resolveAssetLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Asset') {
    if (assetsCache.has(link.sys.id)) {
      return assetsCache.get(link.sys.id)
    }

    try {
      const asset = await fetchFromCMS(`/assets/${link.sys.id}`)
      assetsCache.set(link.sys.id, asset)
      return asset
    } catch (error) {
      return value
    }
  }
  return value
}

// Helper to resolve category links using the category map
const resolveCategoryLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  const entry = value as CMSEntry

  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    const categoriesMap = await getCategoriesMap()
    const category = categoriesMap.get(link.sys.id)
    if (category) {
      return category
    }
  }

  if (entry?.sys?.id && entry?.fields) {
    return value
  }

  if (entry?.sys?.id) {
    const categoriesMap = await getCategoriesMap()
    const category = categoriesMap.get(entry.sys.id)
    if (category) {
      return category
    }
  }

  return value
}

// Helper to resolve author links
const resolveAuthorLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  const entry = value as CMSEntry

  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    if (authorsCache.has(link.sys.id)) {
      return authorsCache.get(link.sys.id)
    }

    const authorPromise = (async () => {
      try {
        const entry = await fetchFromCMS(`/entries/${link.sys.id}`)
        const cmsEntry = entry as CMSEntry

        if (cmsEntry.fields.image) {
          cmsEntry.fields.image = await resolveAssetLink(cmsEntry.fields.image)
        }

        return cmsEntry
      } catch (error) {
        return value
      }
    })()

    authorsCache.set(link.sys.id, authorPromise)
    return authorPromise
  }

  if (entry?.sys?.id && entry?.fields) {
    return value
  }

  if (entry?.sys?.id) {
    if (authorsCache.has(entry.sys.id)) {
      return authorsCache.get(entry.sys.id)
    }

    const authorPromise = (async () => {
      try {
        const fetchedEntry = await fetchFromCMS(`/entries/${entry.sys.id}`)
        const cmsEntry = fetchedEntry as CMSEntry

        if (cmsEntry.fields.image) {
          cmsEntry.fields.image = await resolveAssetLink(cmsEntry.fields.image)
        }

        return cmsEntry
      } catch (error) {
        return value
      }
    })()

    authorsCache.set(entry.sys.id, authorPromise)
    return authorPromise
  }

  return value
}

// Helper function to fetch multiple entries in parallel
const fetchEntries = async (ids: string[]) => {
  const allPromises = ids.map(async (id) => {
    try {
      const response = await fetchFromCMS(`/entries/${id}`)
      const entryResponse = response as CMSEntry

      if (entryResponse.fields.category) {
        entryResponse.fields.category = await resolveCategoryLink(entryResponse.fields.category)
      }

      if (entryResponse.fields.author) {
        entryResponse.fields.author = await resolveAuthorLink(entryResponse.fields.author)
      }

      if (entryResponse.fields.image) {
        entryResponse.fields.image = await resolveAssetLink(entryResponse.fields.image)
      }

      return entryResponse
    } catch (error) {
      return null
    }
  })

  const results = await Promise.all(allPromises)
  return results.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
}

export { fetchEntries, fetchFromCMS, getCategoriesMap, resolveAssetLink, resolveAuthorLink, resolveCategoryLink }
