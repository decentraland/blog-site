import { useParams } from 'react-router-dom'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { CategoryHero } from '../components/Blog/CategoryHero'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { useGetBlogCategoryBySlugQuery } from '../features/blog/blog.client'
import { useInfiniteBlogPosts } from '../features/blog/useInfiniteBlogPosts'
import { useSEO } from '../hooks'
import { CenteredBox } from './CategoryPage.styled'
import type { BlogCategory } from '../shared/types/blog.domain'

const BASE_URL = 'https://decentraland.org/blog'
const DEFAULT_DESCRIPTION = 'Stay up to date with Decentraland announcements, updates, community highlights, and more.'

const CategoryPostList = ({ category }: { category: BlogCategory }) => {
  const isMobile = useMobileMediaQuery()
  const { posts, isLoadingInitial, error } = useInfiniteBlogPosts({
    category: category.id
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
      <CategoryHero category={category.title} description={category.description} image={category.image.url} />
      <PostList posts={posts} loading={isLoadingInitial} hasMainPost={!isMobile} />
    </>
  )
}

export const CategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>()

  const {
    data: category,
    isLoading: isCategoryLoading,
    error: categoryError
  } = useGetBlogCategoryBySlugQuery({
    slug: categorySlug || ''
  })

  const { SEO } = useSEO({
    title: category?.title,
    description: category?.description || DEFAULT_DESCRIPTION,
    url: `${BASE_URL}/${categorySlug}`,
    image: category?.image
      ? {
          url: category.image.url,
          width: category.image.width,
          height: category.image.height,
          alt: category.title
        }
      : undefined
  })

  if (categoryError) {
    return (
      <PageLayout showBlogNavigation={true} activeCategory={categorySlug}>
        <CenteredBox>
          <Typography color="error">Failed to load category. Please try again later.</Typography>
        </CenteredBox>
      </PageLayout>
    )
  }

  return (
    <PageLayout showBlogNavigation={true} activeCategory={categorySlug}>
      <SEO />
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
