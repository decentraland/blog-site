import { BLOCKS } from '@contentful/rich-text-types'
import { resolveAssetLink, resolveAuthorLink, resolveCategoryLink } from './blog.helpers'
import { mapBlogAuthor, mapBlogCategory, mapBlogPost, mapContentfulAsset } from './blog.mappers'
import { postsUpserted } from './blog.slice'
import { store } from '../../app/store'
import { cmsClient } from '../../services/client'
import type {
  GetBlogAuthorParams,
  GetBlogCategoryBySlugParams,
  GetBlogPostBySlugParams,
  GetBlogPostParams,
  GetBlogPostPreviewParams,
  GetBlogPostsParams
} from './blog.types'
import type { CMSEntry, CMSListResponse } from './cms.types'
import type { BlogAuthor, BlogCategory, BlogPost, ContentfulAsset, PaginatedBlogPosts } from '../../shared/types/blog.domain'

// Helper to check if a post is already in the normalized store
const getPostFromStore = (postId: string): BlogPost | undefined => {
  const state = store.getState()
  return state.blog.entities[postId]
}

// Helper to resolve all references (category, author, image) in a CMS entry
const resolveEntryReferences = async (entry: CMSEntry): Promise<CMSEntry> => {
  const resolvedEntry = { ...entry, fields: { ...entry.fields } }

  // Resolve all references in parallel for better performance
  const [category, author, image] = await Promise.all([
    resolvedEntry.fields.category ? resolveCategoryLink(resolvedEntry.fields.category) : undefined,
    resolvedEntry.fields.author ? resolveAuthorLink(resolvedEntry.fields.author) : undefined,
    resolvedEntry.fields.image ? resolveAssetLink(resolvedEntry.fields.image) : undefined
  ])

  if (category) resolvedEntry.fields.category = category
  if (author) resolvedEntry.fields.author = author
  if (image) resolvedEntry.fields.image = image

  return resolvedEntry
}

// Helper to resolve only image references (for categories/authors that don't have nested refs)
const resolveImageOnly = async (entry: CMSEntry): Promise<CMSEntry> => {
  const resolvedEntry = { ...entry, fields: { ...entry.fields } }

  if (resolvedEntry.fields.image) {
    resolvedEntry.fields.image = await resolveAssetLink(resolvedEntry.fields.image)
  }

  return resolvedEntry
}

const normalizeCmsError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const msg = (error as { error?: unknown }).error
    if (typeof msg === 'string') {
      return msg
    }
  }
  return 'Unknown error'
}

interface DocumentNode {
  nodeType: string
  data?: { target?: { sys?: { id?: string } } }
  content?: DocumentNode[]
}

// Extract all embedded asset IDs from a rich text document
const extractEmbeddedAssetIds = (node: DocumentNode): string[] => {
  const ids: string[] = []

  if (node.nodeType === BLOCKS.EMBEDDED_ASSET && node.data?.target?.sys?.id) {
    ids.push(node.data.target.sys.id)
  }

  if (node.content) {
    for (const child of node.content) {
      ids.push(...extractEmbeddedAssetIds(child))
    }
  }

  return ids
}

// Resolve body assets and return a map of id -> ContentfulAsset
const resolveBodyAssets = async (body: DocumentNode): Promise<Record<string, ContentfulAsset>> => {
  const assetIds = extractEmbeddedAssetIds(body)
  const uniqueIds = [...new Set(assetIds)]

  if (uniqueIds.length === 0) {
    return {}
  }

  const resolvedAssets = await Promise.all(
    uniqueIds.map(async (id) => {
      const resolved = await resolveAssetLink({ sys: { type: 'Link', linkType: 'Asset', id } })
      const asset = mapContentfulAsset(resolved as CMSEntry)
      return { id, asset }
    })
  )

  const assetsMap: Record<string, ContentfulAsset> = {}
  for (const { id, asset } of resolvedAssets) {
    if (asset) {
      assetsMap[id] = asset
    }
  }

  return assetsMap
}

const blogClient = cmsClient.injectEndpoints({
  endpoints: (build) => ({
    getBlogPosts: build.query<PaginatedBlogPosts, GetBlogPostsParams>({
      serializeQueryArgs: ({ queryArgs }) => {
        // Cache by category/author only - pagination is handled via merge
        return `posts-${queryArgs.category || 'all'}-${queryArgs.author || 'all'}`
      },
      merge: (currentCache, newItems, { arg }) => {
        // For skip=0, only replace if cache is empty or we're explicitly refreshing
        if (arg.skip === 0) {
          // If we have more posts in cache than what came back, keep the accumulated cache
          if (currentCache.posts.length > newItems.posts.length) {
            return currentCache
          }
          return newItems
        }

        // Merge new posts, avoiding duplicates
        const existingIds = new Set(currentCache.posts.map((p) => p.id))
        const newPosts = newItems.posts.filter((p) => !existingIds.has(p.id))

        return {
          posts: [...currentCache.posts, ...newPosts],
          total: newItems.total,
          hasMore: newItems.hasMore,
          nextCmsSkip: newItems.nextCmsSkip // Always use the latest CMS skip
        }
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        // Only refetch if skip changed AND we're requesting more data
        if (!previousArg) return true
        return currentArg?.skip !== previousArg?.skip && (currentArg?.skip ?? 0) > (previousArg?.skip ?? 0)
      },
      query: ({ category, author, limit = 20, skip = 0 }) => ({
        url: '/blog/posts',
        params: { category, author, limit, skip }
      }),
      transformResponse: async (listResponse: CMSListResponse, _meta, { category, author, skip = 0 }) => {
        try {
          const totalAvailable = listResponse.total

          // Map each entry, using cached posts from normalized store when available
          const batchPosts = await Promise.all(
            listResponse.items.map(async (item) => {
              const postId = item.sys?.id
              if (postId) {
                // Check if post already exists in normalized store
                const cachedPost = getPostFromStore(postId)
                if (cachedPost) {
                  return cachedPost
                }
              }

              // Post not in store, resolve references and map
              try {
                const resolvedEntry = await resolveEntryReferences(item)
                return mapBlogPost(resolvedEntry)
              } catch {
                return null
              }
            })
          )

          const validPosts = batchPosts.filter((post): post is BlogPost => post !== null)

          // Upsert all valid posts to normalized store
          if (validPosts.length > 0) {
            store.dispatch(postsUpserted(validPosts))
          }

          let filteredPosts = validPosts
          if (category) {
            filteredPosts = filteredPosts.filter((post: BlogPost) => post.category.id === category)
          }
          if (author) {
            filteredPosts = filteredPosts.filter((post: BlogPost) => post.author.id === author)
          }

          const nextCmsSkip = skip + listResponse.items.length
          const hasMore = listResponse.items.length === 0 ? false : nextCmsSkip < totalAvailable

          return {
            posts: filteredPosts,
            total: totalAvailable,
            hasMore,
            nextCmsSkip // Track the CMS-level skip for proper pagination
          }
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: normalizeCmsError(error)
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
      query: ({ id }) => ({ url: `/entries/${id}` }),
      transformResponse: async (response: CMSEntry, _meta, { id }) => {
        try {
          // Check if post already exists in normalized store (with body assets)
          const cachedPost = getPostFromStore(id)
          if (cachedPost && cachedPost.bodyAssets && Object.keys(cachedPost.bodyAssets).length > 0) {
            return cachedPost
          }

          const resolvedEntry = await resolveEntryReferences(response)
          const post = mapBlogPost(resolvedEntry)

          if (!post) {
            throw {
              status: 'CUSTOM_ERROR',
              error: 'Failed to map blog post: missing required fields'
            }
          }

          // Resolve embedded assets in the body
          if (post.body) {
            post.bodyAssets = await resolveBodyAssets(post.body as unknown as DocumentNode)
          }

          // Upsert to normalized store
          store.dispatch(postsUpserted([post]))

          return post
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: normalizeCmsError(error)
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'BlogPost', id: arg.id }] : [])
    }),

    getBlogCategories: build.query<BlogCategory[], void>({
      query: () => ({ url: '/blog/categories' }),
      transformResponse: async (listResponse: CMSListResponse) => {
        try {
          // Categories only have image references, resolve them in parallel
          const resolvedEntries = await Promise.all(listResponse.items.map((item) => resolveImageOnly(item)))
          return resolvedEntries.map((entry) => mapBlogCategory(entry)).filter((cat): cat is BlogCategory => cat !== null)
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: normalizeCmsError(error)
          }
        }
      },
      providesTags: ['Categories']
    }),

    getBlogCategoryBySlug: build.query<BlogCategory, GetBlogCategoryBySlugParams>({
      query: () => ({ url: '/blog/categories' }),
      transformResponse: async (listResponse: CMSListResponse, _meta, { slug }) => {
        try {
          const categoryEntry = listResponse.items.find((item) => {
            const fields = item.fields as { id?: string; slug?: string; title?: string }
            const entrySlug = fields.id || fields.slug || fields.title?.toLowerCase().replace(/\s+/g, '-')
            return entrySlug === slug
          })

          if (!categoryEntry) {
            throw {
              status: 'CUSTOM_ERROR',
              error: `Category with slug "${slug}" not found`
            }
          }

          // The API response already includes all fields, just resolve the image
          const resolvedEntry = await resolveImageOnly(categoryEntry)
          const category = mapBlogCategory(resolvedEntry)

          if (!category) {
            throw {
              status: 'CUSTOM_ERROR',
              error: 'Failed to map category: missing required fields'
            }
          }

          return category
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: normalizeCmsError(error)
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'Categories', id: arg.slug }] : [])
    }),

    getBlogPostBySlug: build.query<BlogPost, GetBlogPostBySlugParams>({
      query: ({ categorySlug, postSlug }) => ({
        url: '/blog/posts',
        params: { slug: postSlug, category: categorySlug, limit: 1 }
      }),
      transformResponse: async (listResponse: CMSListResponse, _meta, { categorySlug, postSlug }) => {
        try {
          const postEntry = listResponse.items[0]

          if (!postEntry) {
            throw {
              status: 'CUSTOM_ERROR',
              error: `Post with slug "${postSlug}" not found`
            }
          }

          const postId = postEntry.sys?.id

          // Check if post already exists in normalized store (with body assets)
          if (postId) {
            const cachedPost = getPostFromStore(postId)
            if (cachedPost && cachedPost.bodyAssets && Object.keys(cachedPost.bodyAssets).length > 0) {
              // Verify category matches
              if (cachedPost.category.slug === categorySlug) {
                return cachedPost
              }
            }
          }

          // Resolve references and map
          const resolvedEntry = await resolveEntryReferences(postEntry)
          const post = mapBlogPost(resolvedEntry)

          if (!post) {
            throw {
              status: 'CUSTOM_ERROR',
              error: 'Failed to map post: missing required fields'
            }
          }

          if (post.category.slug !== categorySlug) {
            throw {
              status: 'CUSTOM_ERROR',
              error: `Post found but category slug mismatch. Expected "${categorySlug}", got "${post.category.slug}"`
            }
          }

          // Resolve embedded assets in the body
          if (post.body) {
            post.bodyAssets = await resolveBodyAssets(post.body as unknown as DocumentNode)
          }

          // Upsert to normalized store
          store.dispatch(postsUpserted([post]))

          return post
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: normalizeCmsError(error)
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'BlogPost', id: `${arg.categorySlug}/${arg.postSlug}` }] : [])
    }),

    getBlogAuthors: build.query<BlogAuthor[], void>({
      query: () => ({ url: '/blog/authors' }),
      transformResponse: async (listResponse: CMSListResponse) => {
        try {
          // Authors only have image references, resolve them in parallel
          const resolvedEntries = await Promise.all(listResponse.items.map((item) => resolveImageOnly(item)))
          return resolvedEntries.map((entry) => mapBlogAuthor(entry)).filter((auth): auth is BlogAuthor => auth !== null)
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: ['Authors']
    }),

    getBlogAuthor: build.query<BlogAuthor, GetBlogAuthorParams>({
      query: ({ id }) => ({ url: `/entries/${id}` }),
      transformResponse: (response: CMSEntry) => {
        const author = mapBlogAuthor(response)

        if (!author) {
          throw {
            status: 'CUSTOM_ERROR',
            error: 'Failed to map author: missing required fields'
          }
        }

        return author
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'Authors', id: arg.id }] : [])
    }),

    getBlogPostPreview: build.query<BlogPost, GetBlogPostPreviewParams>({
      queryFn: async ({ id, env, token, previewBaseUrl, spaceId }) => {
        try {
          const previewUrl = `${previewBaseUrl}/spaces/${spaceId}/environments/${env}/entries?content_type=blog_post&fields.id=${id}&access_token=${token}`

          const response = await fetch(previewUrl)
          if (!response.ok) {
            return { error: { status: response.status, data: `Failed to fetch preview: ${response.statusText}` } as const }
          }

          const data = (await response.json()) as CMSListResponse
          if (!data.items || data.items.length === 0) {
            return { error: { status: 'CUSTOM_ERROR', error: `Preview post with id "${id}" not found` } as const }
          }

          const entry = data.items[0]
          const resolvedEntry = await resolveEntryReferences(entry)
          const post = mapBlogPost(resolvedEntry)

          if (!post) {
            return { error: { status: 'CUSTOM_ERROR', error: 'Failed to map preview post: missing required fields' } as const }
          }

          if (post.body) {
            post.bodyAssets = await resolveBodyAssets(post.body as unknown as DocumentNode)
          }

          return { data: post }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: normalizeCmsError(error) } as const }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'BlogPost', id: `preview-${arg.id}` }] : [])
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
  useGetBlogAuthorQuery,
  useGetBlogPostPreviewQuery
} = blogClient

export {
  blogClient,
  useGetBlogAuthorQuery,
  useGetBlogAuthorsQuery,
  useGetBlogCategoriesQuery,
  useGetBlogCategoryBySlugQuery,
  useGetBlogPostBySlugQuery,
  useGetBlogPostPreviewQuery,
  useGetBlogPostQuery,
  useGetBlogPostsQuery
}
