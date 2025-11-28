import { mapBlogAuthor, mapBlogCategory, mapBlogPost } from './blog.mappers'
import { getEnv } from '../../config'
import { api } from '../../services/api'
import type {
  GetBlogAuthorParams,
  GetBlogCategoryBySlugParams,
  GetBlogPostBySlugParams,
  GetBlogPostParams,
  GetBlogPostsParams
} from './blog.types'
import type { CMSEntry, CMSListResponse, CMSQueryParams, CMSReference } from './cms.types'
import type { BlogAuthor, BlogCategory, BlogPost, PaginatedBlogPosts } from '../../shared/types/blog.domain'

const CMS_BASE_URL = getEnv('CMS_BASE_URL')
if (!CMS_BASE_URL) {
  throw new Error('CMS_BASE_URL is not set')
}

// Helper function to fetch from CMS API
async function fetchFromCMS(endpoint: string, params?: CMSQueryParams): Promise<unknown> {
  const url = new URL(`${CMS_BASE_URL}${endpoint}`)

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

async function getCategoriesMap(): Promise<Map<string, CMSEntry>> {
  if (!categoriesCache) {
    categoriesCache = (async () => {
      try {
        const listResponse = await fetchFromCMS('/blog/categories')
        const listResponseTyped = listResponse as CMSListResponse
        const ids = listResponseTyped.items.map((item) => item.sys.id)

        // Fetch all category entries
        const categoryPromises = ids.map(async (id) => {
          const entry = await fetchFromCMS(`/entries/${id}`)
          const cmsEntry = entry as CMSEntry

          // Resolve the category's image asset if it's a link
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
async function resolveAssetLink(value: unknown): Promise<unknown> {
  const link = value as CMSReference
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Asset') {
    // Check cache first
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
async function resolveCategoryLink(value: unknown): Promise<unknown> {
  const link = value as CMSReference
  const entry = value as CMSEntry

  // Case 1: It's a Link object - resolve it from the categories map
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    const categoriesMap = await getCategoriesMap()
    const category = categoriesMap.get(link.sys.id)
    if (category) {
      return category
    }
  }

  // Case 2: It's already a CMSEntry with sys and fields - return as-is
  if (entry?.sys?.id && entry?.fields) {
    return value
  }

  // Case 3: It's a partial/malformed object (e.g., { metadata: {...} }) - try to get from cache
  // This can happen when CMS returns incomplete references
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
async function resolveAuthorLink(value: unknown): Promise<unknown> {
  const link = value as CMSReference
  const entry = value as CMSEntry

  // Case 1: It's a Link object - fetch and cache it
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    // Check cache first
    if (authorsCache.has(link.sys.id)) {
      return authorsCache.get(link.sys.id)
    }

    // Create and cache the promise to avoid duplicate fetches
    const authorPromise = (async () => {
      try {
        const entry = await fetchFromCMS(`/entries/${link.sys.id}`)
        const cmsEntry = entry as CMSEntry

        // Resolve the author's image asset if it's a link
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

  // Case 2: It's already a CMSEntry with sys and fields - return as-is
  if (entry?.sys?.id && entry?.fields) {
    return value
  }

  // Case 3: It's a partial/malformed object - try to fetch it
  if (entry?.sys?.id) {
    // Check cache first
    if (authorsCache.has(entry.sys.id)) {
      return authorsCache.get(entry.sys.id)
    }

    // Fetch it
    const authorPromise = (async () => {
      try {
        const fetchedEntry = await fetchFromCMS(`/entries/${entry.sys.id}`)
        const cmsEntry = fetchedEntry as CMSEntry

        // Resolve the author's image asset if it's a link
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
async function fetchEntries(ids: string[]) {
  // Fetch all entries in parallel
  const allPromises = ids.map(async (id) => {
    try {
      const response = await fetchFromCMS(`/entries/${id}`)
      const entryResponse = response as CMSEntry

      // Resolve the category link if it exists (for blog posts)
      if (entryResponse.fields.category) {
        entryResponse.fields.category = await resolveCategoryLink(entryResponse.fields.category)
      }

      // Resolve the author link if it exists (for blog posts)
      if (entryResponse.fields.author) {
        entryResponse.fields.author = await resolveAuthorLink(entryResponse.fields.author)
      }

      // Resolve the image asset if it's a link
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

const blogClient = api.injectEndpoints({
  endpoints: (build) => ({
    getBlogPosts: build.query<PaginatedBlogPosts, GetBlogPostsParams>({
      serializeQueryArgs: ({ queryArgs }) => {
        return `posts-${queryArgs.category || 'all'}-${queryArgs.author || 'all'}`
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.skip === 0) {
          return newItems
        }

        const existingIds = new Set(currentCache.posts.map((p) => p.id))
        const newPosts = newItems.posts.filter((p) => !existingIds.has(p.id))

        if (import.meta.env.DEV) {
          console.log('[RTK Query Merge]:', {
            currentPostsCount: currentCache.posts.length,
            newPostsReceived: newItems.posts.length,
            newPostsAdded: newPosts.length,
            duplicatesSkipped: newItems.posts.length - newPosts.length
          })
        }

        return {
          posts: [...currentCache.posts, ...newPosts],
          total: newItems.total,
          hasMore: newItems.hasMore
        }
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.skip !== previousArg?.skip
      },
      queryFn: async ({ category, author, limit = 20, skip = 0 }) => {
        try {
          if (import.meta.env.DEV) {
            console.log('[getBlogPosts] API Request:', { skip, limit, category, author })
          }

          const listResponse = await fetchFromCMS('/blog/posts', {
            limit,
            skip
          })

          const listResponseTyped = listResponse as CMSListResponse
          const ids = listResponseTyped.items.map((item) => item.sys.id)
          const totalAvailable = listResponseTyped.total

          const fullEntries = await fetchEntries(ids)

          const batchPosts = fullEntries
            .map((entry) => {
              try {
                const post = mapBlogPost(entry)
                return post
              } catch (error) {
                return null
              }
            })
            .filter((post): post is BlogPost => post !== null)

          let filteredPosts = batchPosts
          if (category) {
            filteredPosts = filteredPosts.filter((post: BlogPost) => post.category.id === category)
          }
          if (author) {
            filteredPosts = filteredPosts.filter((post: BlogPost) => post.author.id === author)
          }

          const hasMore = ids.length === 0 ? false : skip + ids.length < totalAvailable

          if (import.meta.env.DEV) {
            console.log('[getBlogPosts] Response:', {
              skip,
              limit,
              idsReturned: ids.length,
              postsMapped: batchPosts.length,
              postsFiltered: filteredPosts.length,
              totalAvailable,
              hasMore
            })
          }

          return {
            data: {
              posts: filteredPosts,
              total: totalAvailable,
              hasMore
            }
          }
        } catch (error) {
          console.error('Error fetching blog posts:', error)
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      },
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.posts.map(({ id }) => ({
                type: 'BlogPosts' as const,
                id
              })),
              { type: 'BlogPosts', id: 'LIST' }
            ]
          : [{ type: 'BlogPosts', id: 'LIST' }]
    }),

    getBlogPost: build.query<BlogPost, GetBlogPostParams>({
      queryFn: async ({ id }) => {
        try {
          const response = await fetchFromCMS(`/entries/${id}`)
          const entryResponse = response as CMSEntry

          // Resolve the category link if it exists
          if (entryResponse.fields.category) {
            entryResponse.fields.category = await resolveCategoryLink(entryResponse.fields.category)
          }

          const post = mapBlogPost(entryResponse)

          if (!post) {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                error: 'Failed to map blog post: missing required fields'
              }
            }
          }

          return { data: post }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'BlogPost', id: arg.id }] : [])
    }),

    getBlogCategories: build.query<BlogCategory[], void>({
      queryFn: async () => {
        try {
          const listResponse = await fetchFromCMS('/blog/categories')
          const listResponseTyped = listResponse as CMSListResponse
          const ids = listResponseTyped.items.map((item) => item.sys.id)
          const fullEntries = await fetchEntries(ids)
          const categories = fullEntries.map((entry) => mapBlogCategory(entry)).filter((cat): cat is BlogCategory => cat !== null)

          return { data: categories }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      },
      providesTags: ['Categories']
    }),

    getBlogCategoryBySlug: build.query<BlogCategory, GetBlogCategoryBySlugParams>({
      queryFn: async ({ slug }) => {
        try {
          const listResponse = await fetchFromCMS('/blog/categories')
          const listResponseTyped = listResponse as CMSListResponse
          const categoryEntry = listResponseTyped.items.find((item) => {
            const fields = item.fields as { slug?: string; title?: string }
            const entrySlug = fields.slug || fields.title?.toLowerCase().replace(/\s+/g, '-')
            return entrySlug === slug
          })

          if (!categoryEntry) {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                error: `Category with slug "${slug}" not found`
              }
            }
          }

          const response = await fetchFromCMS(`/entries/${categoryEntry.sys.id}`)
          const entryResponse = response as CMSEntry

          const category = mapBlogCategory(entryResponse)

          if (!category) {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                error: 'Failed to map category: missing required fields'
              }
            }
          }

          return { data: category }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'Categories', id: arg.slug }] : [])
    }),

    getBlogPostBySlug: build.query<BlogPost, GetBlogPostBySlugParams>({
      queryFn: async ({ categorySlug, postSlug }) => {
        try {
          const listResponse = await fetchFromCMS('/blog/posts')
          const listResponseTyped = listResponse as CMSListResponse
          const postEntry = listResponseTyped.items.find((item) => {
            const fields = item.fields as { slug?: string; title?: string }
            const entrySlug = fields.slug || fields.title?.toLowerCase().replace(/\s+/g, '-')
            return entrySlug === postSlug
          })

          if (!postEntry) {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                error: `Post with slug "${postSlug}" not found`
              }
            }
          }

          const response = await fetchFromCMS(`/entries/${postEntry.sys.id}`)
          const entryResponse = response as CMSEntry

          // Resolve the category link if it exists
          if (entryResponse.fields.category) {
            entryResponse.fields.category = await resolveCategoryLink(entryResponse.fields.category)
          }

          const post = mapBlogPost(entryResponse)

          if (!post) {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                error: 'Failed to map post: missing required fields'
              }
            }
          }

          if (post.category.slug !== categorySlug) {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                error: `Post found but category slug mismatch. Expected "${categorySlug}", got "${post.category.slug}"`
              }
            }
          }

          return { data: post }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'BlogPost', id: `${arg.categorySlug}/${arg.postSlug}` }] : [])
    }),

    getBlogAuthors: build.query<BlogAuthor[], void>({
      queryFn: async () => {
        try {
          const listResponse = await fetchFromCMS('/blog/authors')
          const listResponseTyped = listResponse as CMSListResponse
          const ids = listResponseTyped.items.map((item) => item.sys.id)
          const fullEntries = await fetchEntries(ids)
          const authors = fullEntries.map((entry) => mapBlogAuthor(entry)).filter((auth): auth is BlogAuthor => auth !== null)

          return { data: authors }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      },
      providesTags: ['Authors']
    }),

    getBlogAuthor: build.query<BlogAuthor, GetBlogAuthorParams>({
      queryFn: async ({ id }) => {
        try {
          const response = await fetchFromCMS(`/entries/${id}`)
          const entryResponse = response as CMSEntry

          const author = mapBlogAuthor(entryResponse)

          if (!author) {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                error: 'Failed to map author: missing required fields'
              }
            }
          }

          return { data: author }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'Authors', id: arg.id }] : [])
    })
  }),
  overrideExisting: false
})

const {
  useGetBlogPostsQuery,
  useGetBlogPostQuery,
  useGetBlogCategoriesQuery,
  useGetBlogCategoryBySlugQuery,
  useGetBlogPostBySlugQuery,
  useGetBlogAuthorsQuery,
  useGetBlogAuthorQuery
} = blogClient

export {
  blogClient,
  useGetBlogAuthorQuery,
  useGetBlogAuthorsQuery,
  useGetBlogCategoriesQuery,
  useGetBlogCategoryBySlugQuery,
  useGetBlogPostBySlugQuery,
  useGetBlogPostQuery,
  useGetBlogPostsQuery
}
