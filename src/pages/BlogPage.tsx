import { useMemo } from 'react'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { Typography } from 'decentraland-ui2'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { SEO } from '../components/SEO'
import { useInfiniteBlogPosts } from '../features/blog/useInfiniteBlogPosts'
import { ErrorContainer } from './BlogPage.styled'
import type { BlogPost } from '../shared/types/blog.domain'

const DEFAULT_DESCRIPTION = 'Stay up to date with Decentraland announcements, updates, community highlights, and more.'

export const BlogPage = () => {
  const isMobile = useMobileMediaQuery()
  const { posts, isLoadingInitial, error } = useInfiniteBlogPosts()

  const firstPost = useMemo(() => {
    const post = posts.find((p): p is BlogPost => !('isPlaceholder' in p))
    return post
  }, [posts])

  return (
    <PageLayout showBlogNavigation activeCategory="all_articles">
      <SEO
        title="Blog"
        description={firstPost?.description || DEFAULT_DESCRIPTION}
        image={
          firstPost?.image
            ? {
                url: firstPost.image.url,
                width: firstPost.image.width,
                height: firstPost.image.height,
                alt: firstPost.title
              }
            : undefined
        }
      />
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
