import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteScroll } from '@dcl/hooks'
import type { PostOrPlaceholder } from '../../shared/types/blog.domain'
import { useGetBlogPostsQuery } from './blog.client'

const POSTS_INITIAL_LOAD = 7
const POSTS_PER_LOAD = 6

interface UseInfiniteBlogPostsParams {
  category?: string
  author?: string
}

interface UseInfiniteBlogPostsResult {
  posts: PostOrPlaceholder[]
  isLoading: boolean
  isLoadingInitial: boolean
  isFetching: boolean
  hasMore: boolean
  error: unknown
}

// Helper to create placeholder posts
const createPlaceholders = (count: number, batchId: number): PostOrPlaceholder[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder-${batchId}-${i}`,
    isPlaceholder: true as const
  }))
}

function useInfiniteBlogPosts({ category, author }: UseInfiniteBlogPostsParams = {}): UseInfiniteBlogPostsResult {
  const [currentSkip, setCurrentSkip] = useState(0)
  const [showPlaceholders, setShowPlaceholders] = useState(false)
  const batchIdRef = useRef(0)

  // Use RTK Query with pagination - cache handles accumulation via merge
  // Backend handles category/author filtering, so we request real page sizes
  const { data, isLoading, error, isFetching } = useGetBlogPostsQuery({
    category,
    author,
    limit: currentSkip === 0 ? POSTS_INITIAL_LOAD : POSTS_PER_LOAD,
    skip: currentSkip
  })

  // Build display posts: cached posts + placeholders when loading more
  const displayPosts = useMemo<PostOrPlaceholder[]>(() => {
    const posts = data?.posts ?? []
    if (showPlaceholders && isFetching) {
      return [...posts, ...createPlaceholders(POSTS_PER_LOAD, batchIdRef.current)]
    }
    return posts
  }, [data?.posts, showPlaceholders, isFetching])

  const hasMore = data?.hasMore ?? true
  const isLoadingInitial = isLoading && currentSkip === 0

  // Reset skip when filters change
  useEffect(() => {
    setCurrentSkip(0)
    setShowPlaceholders(false)
    batchIdRef.current = 0
  }, [category, author])

  // Show placeholders when fetching more (not initial)
  useEffect(() => {
    if (isFetching && currentSkip > 0) {
      batchIdRef.current += 1
      setShowPlaceholders(true)
    } else if (!isFetching) {
      setShowPlaceholders(false)
    }
  }, [isFetching, currentSkip])

  // Load more function - use nextCmsSkip to properly paginate
  const loadMore = useCallback(() => {
    if (isFetching || !hasMore || !data) {
      return
    }
    // Use the CMS-level skip for proper pagination
    setCurrentSkip(data.nextCmsSkip)
  }, [isFetching, hasMore, data])

  // Use @dcl/hooks infinite scroll
  useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isFetching
  })

  return {
    posts: displayPosts,
    isLoading,
    isLoadingInitial,
    isFetching,
    hasMore,
    error
  }
}

export { useInfiniteBlogPosts, type UseInfiniteBlogPostsParams, type UseInfiniteBlogPostsResult }
