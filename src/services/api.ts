import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from './baseQuery'

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['BlogPosts', 'BlogPost', 'Categories', 'Authors', 'SearchResults'],
  keepUnusedDataFor: 300, // Cache for 5 minutes (instead of 60 seconds)
  refetchOnFocus: false, // Don't refetch when window regains focus
  refetchOnReconnect: false, // Don't refetch when network reconnects
  endpoints: () => ({})
})
