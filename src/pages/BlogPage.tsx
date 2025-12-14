import { useCallback, useState } from 'react'
import { useInfiniteScroll } from '@dcl/hooks'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { Typography } from 'decentraland-ui2'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { SEO } from '../components/SEO'
import { useGetBlogPostsQuery } from '../features/blog/blog.client'
import { ErrorContainer } from './BlogPage.styled'

const POSTS_INITIAL_LOAD = 7
const POSTS_PER_LOAD = 6

export const BlogPage = () => {
  const [offset, setOffset] = useState(0)

  const isMobile = useMobileMediaQuery()

  const limit = offset === 0 ? POSTS_INITIAL_LOAD : POSTS_PER_LOAD

  const { data, isLoading, error, isFetching } = useGetBlogPostsQuery({ limit, skip: offset }, { refetchOnMountOrArgChange: true })

  const handleLoadMore = useCallback(() => {
    if (!data?.hasMore || isLoading || isFetching) {
      return
    }

    setOffset((prev) => prev + limit)
  }, [data?.hasMore, isLoading, isFetching, limit])

  const isLoadingInitial = isLoading && offset === 0
  const showLoadingMore = isFetching && offset > 0

  useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore: data?.hasMore ?? false,
    isLoading: isLoading || isFetching,
    threshold: 800
  })

  const skeletonCount = isLoadingInitial ? 7 : showLoadingMore ? 6 : 0

  return (
    <PageLayout showBlogNavigation activeCategory="all_articles">
      <SEO description="Stay up to date with Decentraland announcements, updates, community highlights, and more." />
      {error ? (
        <ErrorContainer>
          <Typography color="error">Failed to load posts. Please try again later.</Typography>
        </ErrorContainer>
      ) : (
        <PostList
          posts={data?.posts ?? []}
          loading={isLoadingInitial}
          hasMainPost={!isMobile}
          skeletonCount={skeletonCount}
          showLoadingAtEnd={data?.hasMore ?? false}
        />
      )}
    </PageLayout>
  )
}
