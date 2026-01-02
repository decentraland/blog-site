import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { Typography } from 'decentraland-ui2'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { useGetBlogPostsQuery } from '../features/blog/blog.client'
import { ErrorContainer } from './BlogPage.styled'
import type { PostOrPlaceholder } from '../shared/types/blog.domain'

const POSTS_INITIAL_LOAD = 7
const POSTS_PER_LOAD = 6

// Helper to create placeholder posts
const createPlaceholders = (count: number, batchId: number): PostOrPlaceholder[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder-${batchId}-${i}`,
    isPlaceholder: true as const
  }))
}

export const BlogPage = () => {
  const [currentSkip, setCurrentSkip] = useState(0)
  const [showPlaceholders, setShowPlaceholders] = useState(false)

  const isMobile = useMobileMediaQuery()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)
  const batchIdRef = useRef(0)

  // Use RTK Query with pagination - cache handles accumulation via merge
  const { data, isLoading, error, isFetching } = useGetBlogPostsQuery({
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

  // Show placeholders when fetching more (not initial)
  useEffect(() => {
    if (isFetching && currentSkip > 0) {
      batchIdRef.current += 1
      setShowPlaceholders(true)
    } else if (!isFetching) {
      setShowPlaceholders(false)
    }
  }, [isFetching, currentSkip])

  // Load more function
  const loadMore = useCallback(() => {
    if (isFetching || !hasMore || !data) {
      return
    }
    // Next skip is current number of posts
    setCurrentSkip(data.posts.length)
  }, [isFetching, hasMore, data])

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!data?.posts.length || !hasMore) {
      return
    }

    const options = {
      root: null,
      rootMargin: '400px',
      threshold: 0
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && !isFetching && hasMore) {
        loadMore()
      }
    }, options)

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [data?.posts.length, hasMore, isFetching, loadMore])

  const isLoadingInitial = isLoading && currentSkip === 0

  return (
    <PageLayout showBlogNavigation activeCategory="all_articles">
      {error ? (
        <ErrorContainer>
          <Typography color="error">Failed to load posts. Please try again later.</Typography>
        </ErrorContainer>
      ) : (
        <>
          <PostList posts={displayPosts} loading={isLoadingInitial} hasMainPost={!isMobile} />
          {hasMore && data?.posts.length && <div ref={loadMoreTriggerRef} style={{ height: 1 }} />}
        </>
      )}
    </PageLayout>
  )
}
