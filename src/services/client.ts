import { createApi, fakeBaseQuery, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../config'

const CMS_BASE_URL = getEnv('CMS_BASE_URL')
if (!CMS_BASE_URL) {
  throw new Error('CMS_BASE_URL environment variable is not set')
}

// In development, use the Vite proxy to avoid CORS issues
// In production, use the direct CMS URL
const cmsBaseUrl = import.meta.env.DEV ? '/api/cms' : CMS_BASE_URL

/**
 * CMS Client - For blog posts, categories, and authors from Contentful
 * Uses fetchBaseQuery with Vite proxy in development to avoid CORS
 */
const cmsClient = createApi({
  reducerPath: 'cmsClient',
  baseQuery: fetchBaseQuery({ baseUrl: cmsBaseUrl }),
  tagTypes: ['BlogPosts', 'BlogPost', 'Categories', 'Authors'],
  keepUnusedDataFor: 300, // Cache for 5 minutes
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

/**
 * Algolia Client - For search functionality
 * Uses fakeBaseQuery since we use Algolia SDK directly
 */
const algoliaClient = createApi({
  reducerPath: 'algoliaClient',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['SearchResults'],
  keepUnusedDataFor: 300, // Cache for 5 minutes
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

export { algoliaClient, cmsBaseUrl, cmsClient }
