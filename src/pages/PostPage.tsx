import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { useAppSelector } from '../app/hooks'
import { RichText } from '../components/Blog/RichText'
import { PageLayout } from '../components/PageLayout'
import { OGType, SEO } from '../components/SEO'
import { getEnv } from '../config'
import { useGetBlogPostBySlugQuery } from '../features/blog/blog.client'
import { formatUtcDate } from '../shared/utils/date'
import { locations } from '../shared/utils/locations'
import {
  AuthorAvatar,
  AuthorBox,
  AuthorLink,
  AuthorName,
  BodyContainer,
  CategoryMetaLink,
  CenteredBox,
  ContentContainer,
  HeaderBox,
  MetaSeparator,
  MetaText,
  PostImage,
  SubtitleText,
  TitleBox,
  TitleText
} from './PostPage.styled'
import type { RootState } from '../app/store'
import type { BlogPost, PaginatedBlogPosts } from '../shared/types/blog.domain'

const DEFAULT_DESCRIPTION = 'Stay up to date with Decentraland announcements, updates, community highlights, and more.'

export const PostPage = () => {
  const { categorySlug, postSlug } = useParams<{ categorySlug: string; postSlug: string }>()

  // Try to find the post in any cached getBlogPosts query
  const cachedPost = useAppSelector((state: RootState): BlogPost | null => {
    // Search through all cached getBlogPosts queries
    for (const query of Object.values(state.cmsClient.queries)) {
      if (query?.endpointName === 'getBlogPosts' && query.status === 'fulfilled' && query.data) {
        const data = query.data as PaginatedBlogPosts
        const found = data.posts.find((p) => p.category.slug === categorySlug && p.slug === postSlug)
        if (found) return found
      }
    }
    return null
  })

  // Only fetch if not in cache
  const {
    data: post,
    isLoading,
    error
  } = useGetBlogPostBySlugQuery(
    {
      categorySlug: categorySlug || '',
      postSlug: postSlug || ''
    },
    {
      skip: !!cachedPost
    }
  )

  // Use cached post if available, otherwise use fetched post
  const displayPost = useMemo(() => cachedPost || post, [cachedPost, post])

  const publishedDateUtc = useMemo(() => formatUtcDate(displayPost?.publishedDate), [displayPost?.publishedDate])
  const author = displayPost?.author
  const showAuthor = !!author && !!author.title

  const baseUrl = getEnv('BLOG_BASE_URL') || ''

  if (isLoading && !cachedPost) {
    return (
      <PageLayout showBlogNavigation activeCategory={categorySlug}>
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      </PageLayout>
    )
  }

  if (error || !displayPost) {
    return (
      <PageLayout showBlogNavigation activeCategory={categorySlug}>
        <CenteredBox>
          <Typography color="error">Failed to load post. Please try again later.</Typography>
        </CenteredBox>
      </PageLayout>
    )
  }

  return (
    <PageLayout showBlogNavigation activeCategory={categorySlug}>
      <SEO
        title={displayPost?.title}
        description={displayPost?.description || DEFAULT_DESCRIPTION}
        url={displayPost ? `${baseUrl}/${categorySlug}/${postSlug}` : baseUrl}
        type={OGType.Article}
        image={
          displayPost?.image
            ? {
                url: displayPost.image.url,
                width: displayPost.image.width,
                height: displayPost.image.height,
                alt: displayPost.title
              }
            : undefined
        }
        author={author?.title}
        publishedTime={displayPost?.publishedDate}
        section={displayPost?.category.title}
        tags={displayPost?.category.title ? [displayPost.category.title] : undefined}
      />
      <ContentContainer>
        <PostImage src={displayPost.image.url} alt={displayPost.title} />

        <HeaderBox>
          <MetaText as="span">
            {publishedDateUtc}
            <MetaSeparator>•</MetaSeparator>
            <CategoryMetaLink to={locations.category(displayPost.category.slug)}>{displayPost.category.title}</CategoryMetaLink>
          </MetaText>
          <TitleBox>
            <TitleText variant="h4">{displayPost.title}</TitleText>
          </TitleBox>
          <SubtitleText variant="h6">{displayPost.description}</SubtitleText>
        </HeaderBox>

        {showAuthor && (
          <AuthorBox>
            <AuthorLink to={author.url}>
              {author.image?.url && <AuthorAvatar src={author.image.url} alt={author.title} />}
              <AuthorName variant="body2">{author.title}</AuthorName>
            </AuthorLink>
          </AuthorBox>
        )}

        <BodyContainer>
          <RichText document={displayPost.body} assets={displayPost.bodyAssets} />
        </BodyContainer>
      </ContentContainer>
    </PageLayout>
  )
}
