import { useParams } from 'react-router-dom'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { useGetBlogAuthorBySlugQuery } from '../features/blog/blog.client'
import { useInfiniteBlogPosts } from '../features/blog/useInfiniteBlogPosts'
import { OGType, useSEO } from '../hooks'
import { AuthorHeaderBox, AuthorImage, CenteredBox } from './AuthorPage.styled'
import type { BlogAuthor } from '../shared/types/blog.domain'

const BASE_URL = 'https://decentraland.org/blog'
const DEFAULT_DESCRIPTION = 'Stay up to date with Decentraland announcements, updates, community highlights, and more.'

const AuthorPostList = ({ author }: { author: BlogAuthor }) => {
  const { posts, isLoadingInitial, error } = useInfiniteBlogPosts({
    author: author.id
  })

  if (error) {
    return (
      <CenteredBox>
        <Typography color="error">Failed to load posts. Please try again later.</Typography>
      </CenteredBox>
    )
  }

  return (
    <>
      <AuthorHeaderBox>
        {author.image && <AuthorImage src={author.image.url} alt={author.title} />}

        <Typography variant="h5">{author.title}</Typography>
        <Typography variant="body1" color="textSecondary">
          {author.description}
        </Typography>
      </AuthorHeaderBox>

      <PostList posts={posts} loading={isLoadingInitial} hasMainPost={false} />
    </>
  )
}

export const AuthorPage = () => {
  const { authorSlug } = useParams<{ authorSlug: string }>()

  const {
    data: author,
    isLoading: isAuthorLoading,
    error: authorError
  } = useGetBlogAuthorBySlugQuery({
    slug: authorSlug || ''
  })

  const { SEO } = useSEO({
    title: author?.title ? `Posts by ${author.title}` : undefined,
    description: author?.description || DEFAULT_DESCRIPTION,
    url: `${BASE_URL}/author/${authorSlug}`,
    type: OGType.Profile,
    image: author?.image
      ? {
          url: author.image.url,
          alt: author.title
        }
      : undefined
  })

  if (authorError) {
    return (
      <PageLayout showBlogNavigation={true}>
        <CenteredBox>
          <Typography color="error">Failed to load author. Please try again later.</Typography>
        </CenteredBox>
      </PageLayout>
    )
  }

  return (
    <PageLayout showBlogNavigation={true}>
      <SEO />
      {isAuthorLoading ? (
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      ) : author ? (
        // key forces remount when author changes, resetting the infinite scroll hook
        <AuthorPostList key={author.id} author={author} />
      ) : null}
    </PageLayout>
  )
}
