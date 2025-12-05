import { fetchEntries, fetchFromCMS, resolveCategoryLink } from './blog.helpers'
import { mapBlogAuthor, mapBlogCategory, mapBlogPost } from './blog.mappers'
import { cmsApi } from '../../services/api'
import type {
  GetBlogAuthorParams,
  GetBlogCategoryBySlugParams,
  GetBlogPostBySlugParams,
  GetBlogPostParams,
  GetBlogPostsParams
} from './blog.types'
import type { CMSEntry, CMSListResponse } from './cms.types'
import type { BlogAuthor, BlogCategory, BlogPost, PaginatedBlogPosts } from '../../shared/types/blog.domain'

const blogClient = cmsApi.injectEndpoints({
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

        return {
          posts: [...currentCache.posts, ...newPosts],
          total: newItems.total,
          hasMore: newItems.hasMore
        }
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.skip !== previousArg?.skip
      },
      query: ({ category, author, limit = 20, skip = 0 }) => ({
        url: '/blog/posts',
        params: { category, author, limit, skip }
      }),
      transformResponse: async (listResponse: CMSListResponse, _meta, { category, author, skip = 0 }) => {
        try {
          const ids = listResponse.items.map((item) => item.sys.id)
          const totalAvailable = listResponse.total

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

          return {
            posts: filteredPosts,
            total: totalAvailable,
            hasMore
          }
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
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
      transformResponse: async (response: CMSEntry) => {
        try {
          if (response.fields.category) {
            response.fields.category = await resolveCategoryLink(response.fields.category)
          }

          const post = mapBlogPost(response)

          if (!post) {
            throw {
              status: 'CUSTOM_ERROR',
              error: 'Failed to map blog post: missing required fields'
            }
          }

          return post
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'BlogPost', id: arg.id }] : [])
    }),

    getBlogCategories: build.query<BlogCategory[], void>({
      query: () => ({ url: '/blog/categories' }),
      transformResponse: async (listResponse: CMSListResponse) => {
        try {
          const ids = listResponse.items.map((item) => item.sys.id)
          const fullEntries = await fetchEntries(ids)
          return fullEntries.map((entry) => mapBlogCategory(entry)).filter((cat): cat is BlogCategory => cat !== null)
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
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
            const fields = item.fields as { slug?: string; title?: string }
            const entrySlug = fields.slug || fields.title?.toLowerCase().replace(/\s+/g, '-')
            return entrySlug === slug
          })

          if (!categoryEntry) {
            throw {
              status: 'CUSTOM_ERROR',
              error: `Category with slug "${slug}" not found`
            }
          }

          const response = await fetchFromCMS(`/entries/${categoryEntry.sys.id}`)
          const entryResponse = response as CMSEntry

          const category = mapBlogCategory(entryResponse)

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
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'Categories', id: arg.slug }] : [])
    }),

    getBlogPostBySlug: build.query<BlogPost, GetBlogPostBySlugParams>({
      query: () => ({ url: '/blog/posts' }),
      transformResponse: async (listResponse: CMSListResponse, _meta, { categorySlug, postSlug }) => {
        try {
          const postEntry = listResponse.items.find((item) => {
            const fields = item.fields as { slug?: string; title?: string }
            const entrySlug = fields.slug || fields.title?.toLowerCase().replace(/\s+/g, '-')
            return entrySlug === postSlug
          })

          if (!postEntry) {
            throw {
              status: 'CUSTOM_ERROR',
              error: `Post with slug "${postSlug}" not found`
            }
          }

          const response = await fetchFromCMS(`/entries/${postEntry.sys.id}`)
          const entryResponse = response as CMSEntry

          if (entryResponse.fields.category) {
            entryResponse.fields.category = await resolveCategoryLink(entryResponse.fields.category)
          }

          const post = mapBlogPost(entryResponse)

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

          return post
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: (result, _error, arg) => (result ? [{ type: 'BlogPost', id: `${arg.categorySlug}/${arg.postSlug}` }] : [])
    }),

    getBlogAuthors: build.query<BlogAuthor[], void>({
      query: () => ({ url: '/blog/authors' }),
      transformResponse: async (listResponse: CMSListResponse) => {
        try {
          const ids = listResponse.items.map((item) => item.sys.id)
          const fullEntries = await fetchEntries(ids)
          return fullEntries.map((entry) => mapBlogAuthor(entry)).filter((auth): auth is BlogAuthor => auth !== null)
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
