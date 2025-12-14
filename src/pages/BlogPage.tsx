import { useCallback, useState } from 'react'
import { useInfiniteScroll } from '@dcl/hooks'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { Typography } from 'decentraland-ui2'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { useGetBlogPostsQuery } from '../features/blog/blog.client'
import { useSEO } from '../hooks'
import { ErrorContainer } from './BlogPage.styled'

const POSTS_INITIAL_LOAD = 7
const POSTS_PER_LOAD = 6

const DEFAULT_DESCRIPTION = 'Stay up to date with Decentraland announcements, updates, community highlights, and more.'

export const BlogPage = () => {
  const [offset, setOffset] = useState(0)

  const isMobile = useMobileMediaQuery()

  const limit = offset === 0 ? POSTS_INITIAL_LOAD : POSTS_PER_LOAD

  const { data, isLoading, error, isFetching } = useGetBlogPostsQuery({ limit, skip: offset }, { refetchOnMountOrArgChange: true })

  // Use first post data for SEO if available
  const firstPost = data?.posts?.[0]
  const { SEO } = useSEO({
    title: firstPost?.title,
    description: firstPost?.description || DEFAULT_DESCRIPTION,
    image: firstPost?.image
      ? {
          url: firstPost.image.url,
          width: firstPost.image.width,
          height: firstPost.image.height,
          alt: firstPost.title
        }
      : undefined,
    author: firstPost?.author?.title,
    publishedTime: firstPost?.publishedDate
  })

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
      <SEO />
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
