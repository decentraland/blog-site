import { useParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { OGType, SEO } from '../components/SEO'
import { getEnv } from '../config'
import { useGetBlogAuthorBySlugQuery } from '../features/blog/blog.client'
import { useInfiniteBlogPosts } from '../features/blog/useInfiniteBlogPosts'
import type { BlogAuthor } from '../shared/types/blog.domain'
import { AuthorHeaderBox, AuthorImage, CenteredBox } from './AuthorPage.styled'

const AuthorPostList = ({ author }: { author: BlogAuthor }) => {
  const { t } = useTranslation()
  const { posts, isLoadingInitial, error } = useInfiniteBlogPosts({
    author: author.id
  })

  if (error) {
    return (
      <CenteredBox>
        <Typography color="error">{t('error.load_posts')}</Typography>
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
  const { t } = useTranslation()
  const { authorSlug } = useParams<{ authorSlug: string }>()

  const {
    data: author,
    isLoading: isAuthorLoading,
    error: authorError
  } = useGetBlogAuthorBySlugQuery({
    slug: authorSlug || ''
  })

  const baseUrl = getEnv('BLOG_BASE_URL') || ''

  if (authorError) {
    return (
      <PageLayout showBlogNavigation={true}>
        <CenteredBox>
          <Typography color="error">{t('error.load_author')}</Typography>
        </CenteredBox>
      </PageLayout>
    )
  }

  return (
    <PageLayout showBlogNavigation={true}>
      <SEO
        title={author?.title ? t('blog.posts_by', { author: author.title }) : undefined}
        description={author?.description || t('blog.default_description')}
        url={`${baseUrl}/author/${authorSlug}`}
        type={OGType.PROFILE}
        image={
          author?.image
            ? {
                url: author.image.url,
                alt: author.title
              }
            : undefined
        }
      />
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
