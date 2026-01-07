import { useParams } from 'react-router-dom'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { CategoryHero } from '../components/Blog/CategoryHero'
import { PostList } from '../components/Blog/PostList'
import { PageLayout } from '../components/PageLayout'
import { useGetBlogCategoryBySlugQuery } from '../features/blog/blog.client'
import { useInfiniteBlogPosts } from '../features/blog/useInfiniteBlogPosts'
import { CenteredBox } from './CategoryPage.styled'
import type { BlogCategory } from '../shared/types/blog.domain'

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
