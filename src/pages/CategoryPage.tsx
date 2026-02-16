import { useParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { CategoryHero } from '../components/Blog/CategoryHero'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { SEO } from '../components/SEO'
import { getEnv } from '../config'
import { useGetBlogCategoryBySlugQuery } from '../features/blog/blog.client'
import { useInfiniteBlogPosts } from '../features/blog/useInfiniteBlogPosts'
import type { BlogCategory } from '../shared/types/blog.domain'
import { CenteredBox } from './CategoryPage.styled'

const CategoryPostList = ({ category }: { category: BlogCategory }) => {
  const { t } = useTranslation()
  const isMobile = useMobileMediaQuery()
  const { posts, isLoadingInitial, error } = useInfiniteBlogPosts({
    category: category.id
  })

  if (error) {
    return (
      <CenteredBox>
        <Typography color="error">{t('error.load_posts')}</Typography>
      </CenteredBox>
    )
  }

  return <PostList posts={posts} loading={isLoadingInitial} hasMainPost={!isMobile} />
}

export const CategoryPage = () => {
  const { t } = useTranslation()
  const { categorySlug } = useParams<{ categorySlug: string }>()

  const {
    data: category,
    isLoading: isCategoryLoading,
    error: categoryError
  } = useGetBlogCategoryBySlugQuery({
    slug: categorySlug || ''
  })

  const baseUrl = getEnv('BLOG_BASE_URL') || ''

  if (categoryError) {
    return (
      <PageLayout showBlogNavigation={true} activeCategory={categorySlug}>
        <CenteredBox>
          <Typography color="error">{t('error.load_category')}</Typography>
        </CenteredBox>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      showBlogNavigation={true}
      activeCategory={categorySlug}
      fullWidthContent={
        category ? <CategoryHero category={category.title} description={category.description} image={category.image.url} /> : undefined
      }
    >
      <SEO
        title={category?.title}
        description={category?.description || t('blog.default_description')}
        url={`${baseUrl}/${categorySlug}`}
        image={
          category?.image
            ? {
                url: category.image.url,
                width: category.image.width,
                height: category.image.height,
                alt: category.title
              }
            : undefined
        }
      />
      {isCategoryLoading ? (
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      ) : category ? (
        // key forces remount when category changes, resetting the infinite scroll hook
        <CategoryPostList key={category.id} category={category} />
      ) : null}
    </PageLayout>
  )
}
