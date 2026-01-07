import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { Typography } from 'decentraland-ui2'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { useInfiniteBlogPosts } from '../features/blog/useInfiniteBlogPosts'
import { ErrorContainer } from './BlogPage.styled'

export const BlogPage = () => {
  const isMobile = useMobileMediaQuery()
  const { posts, isLoadingInitial, error } = useInfiniteBlogPosts()

  return (
    <PageLayout showBlogNavigation activeCategory="all_articles">
      {error ? (
        <ErrorContainer>
          <Typography color="error">Failed to load posts. Please try again later.</Typography>
        </ErrorContainer>
      ) : (
        <PostList posts={posts} loading={isLoadingInitial} hasMainPost={!isMobile} />
      )}
    </PageLayout>
  )
}
