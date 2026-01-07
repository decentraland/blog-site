import { algoliasearch } from 'algoliasearch'
import { getEnv } from '../../config'
import { algoliaClient } from '../../services/client'
import { resolveAssetUrl, resolveEntrySlug } from '../blog/blog.helpers'
import type { AlgoliaHit, SearchBlogPostsParams, SearchBlogPostsResponse, SearchBlogResult } from './search.types'
import type { SearchResult } from '../../shared/types/blog.domain'

const algoliaAppId = getEnv('ALGOLIA_APP_ID') || ''
const algoliaApiKey = getEnv('ALGOLIA_API_KEY') || ''
const algoliaIndex = getEnv('ALGOLIA_BLOG_INDEX') || 'decentraland-blog'

const searchClient = algoliaClient.injectEndpoints({
  endpoints: (build) => ({
    searchBlogPosts: build.query<SearchBlogPostsResponse, SearchBlogPostsParams>({
      queryFn: async ({ query, hitsPerPage = 10, page = 0 }) => {
        try {
          if (query.length < 3) {
            return {
              data: {
                results: [],
                total: 0,
                hasMore: false
              }
            }
          }

          const client = algoliasearch(algoliaAppId, algoliaApiKey)
          const searchResponse = await client.searchSingleIndex({
            indexName: algoliaIndex,
            searchParams: {
              query,
              hitsPerPage,
              page
            }
          })

          const hits = (searchResponse.hits || []) as AlgoliaHit[]

          // Resolve all assets and categories in parallel
          const searchResults: SearchResult[] = await Promise.all(
            hits.map(async (hit: AlgoliaHit) => {
              // Get asset ID from imageObject reference
              const imgObj = hit.imageObject as { sys?: { id?: string } } | undefined
              const assetId = imgObj?.sys?.id || ''

              // Get category ID from categoryObject reference
              const catObj = hit.categoryObject as { sys?: { id?: string } } | undefined
              const categoryId = catObj?.sys?.id || ''

              // Resolve asset URL and category slug in parallel
              const [imageUrl, categorySlug] = await Promise.all([resolveAssetUrl(assetId), resolveEntrySlug(categoryId)])

              return {
                url: `/blog/${categorySlug}/${hit.id}`,
                image: imageUrl,
                title: hit._highlightResult?.title?.value || hit.title,
                description: hit._highlightResult?.description?.value || hit.description
              }
            })
          )

          return {
            data: {
              results: searchResults,
              total: (searchResponse.nbHits as number) || 0,
              hasMore: (page + 1) * hitsPerPage < ((searchResponse.nbHits as number) || 0)
            }
          }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      },
      providesTags: (_result, _error, arg) => [{ type: 'SearchResults', id: arg.query }]
    }),
    searchBlog: build.query<SearchBlogResult[], SearchBlogPostsParams>({
      queryFn: async ({ query, hitsPerPage = 10, page = 0 }) => {
        try {
          if (query.length < 3) {
            return { data: [] }
          }

          const client = algoliasearch(algoliaAppId, algoliaApiKey)
          const searchResponse = await client.searchSingleIndex({
            indexName: algoliaIndex,
            searchParams: {
              query,
              hitsPerPage,
              page
            }
          })

          const hits = (searchResponse.hits || []) as AlgoliaHit[]

          const searchResults: SearchBlogResult[] = await Promise.all(
            hits.map(async (hit: AlgoliaHit) => {
              const imgObj = hit.imageObject as { sys?: { id?: string } } | undefined
              const assetId = imgObj?.sys?.id || ''

              const catObj = hit.categoryObject as { sys?: { id?: string } } | undefined
              const categoryId = catObj?.sys?.id || ''

              const [imageUrl, categorySlug] = await Promise.all([resolveAssetUrl(assetId), resolveEntrySlug(categoryId)])

              return {
                id: hit.id,
                categoryId: categorySlug,
                url: `/blog/${categorySlug}/${hit.id}`,
                image: imageUrl,
                highlightedTitle: hit._highlightResult?.title?.value || hit.title,
                highlightedDescription: hit._highlightResult?.description?.value || hit.description
              }
            })
          )

          return { data: searchResults }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      },
      providesTags: (_result, _error, arg) => [{ type: 'SearchResults', id: arg.query }]
    })
  }),
  overrideExisting: false
})

const { useLazySearchBlogPostsQuery, useSearchBlogPostsQuery, useSearchBlogQuery } = searchClient

export { searchClient, useLazySearchBlogPostsQuery, useSearchBlogPostsQuery, useSearchBlogQuery }
