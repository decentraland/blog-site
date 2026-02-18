import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FacebookIcon from '@mui/icons-material/Facebook'
// eslint-disable-next-line @typescript-eslint/naming-convention
import XIcon from '@mui/icons-material/X'
import { useTranslation } from '@dcl/hooks'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { useAppSelector } from '../app/hooks'
import type { RootState } from '../app/store'
import { RelatedPost } from '../components/Blog/RelatedPost'
import { RichText } from '../components/Blog/RichText'
import { PageLayout } from '../components/PageLayout'
import { OGType, SEO } from '../components/SEO'
import { getEnv } from '../config'
import { useGetBlogPostBySlugQuery, useGetBlogPostsQuery } from '../features/blog/blog.client'
import type { BlogPost, PaginatedBlogPosts } from '../shared/types/blog.domain'
import { formatUtcDate } from '../shared/utils/date'
import { locations } from '../shared/utils/locations'
import {
  AuthorAvatar,
  AuthorBox,
  AuthorLink,
  AuthorName,
  AuthorRow,
  BodyContainer,
  CategoryMetaLink,
  CenteredBox,
  ContentContainer,
  HeaderBox,
  MetaSeparator,
  MetaText,
  PostImage,
  ShareContainer,
  ShareLabel,
  ShareLink,
  SubtitleText,
  TitleBox,
  TitleText
} from './PostPage.styled'

const RELATED_POSTS_COUNT = 3
const RELATED_POSTS_FETCH_MULTIPLIER = 10
const RELATED_POSTS_FETCH_LIMIT = RELATED_POSTS_COUNT * RELATED_POSTS_FETCH_MULTIPLIER

export const PostPage = () => {
  const { t } = useTranslation()
  const { categorySlug, postSlug } = useParams<{ categorySlug: string; postSlug: string }>()

  // Try to find the post in any cached getBlogPosts query
  const cachedPost = useAppSelector((state: RootState): BlogPost | null => {
    // Search through all cached getBlogPosts queries
    for (const query of Object.values(state.cmsClient.queries)) {
      if (query?.endpointName === 'getBlogPosts' && query.status === 'fulfilled' && query.data) {
        const data = query.data as PaginatedBlogPosts
        const found = data.posts.find(p => p.category.slug === categorySlug && p.slug === postSlug)
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

  const { data: relatedPostsData, isLoading: isRelatedPostsLoading } = useGetBlogPostsQuery(
    {
      category: displayPost?.category.id,
      limit: RELATED_POSTS_FETCH_LIMIT,
      skip: 0
    },
    {
      skip: !displayPost?.category.id
    }
  )

  const relatedPosts = useMemo(() => {
    if (!relatedPostsData?.posts || !displayPost) {
      return []
    }

    return relatedPostsData.posts.filter(postItem => postItem.id !== displayPost.id)
  }, [displayPost, relatedPostsData?.posts])

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
          <Typography color="error">{t('error.load_post')}</Typography>
        </CenteredBox>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      showBlogNavigation
      activeCategory={categorySlug}
      relatedPosts={<RelatedPost posts={relatedPosts} loading={isRelatedPostsLoading} maxItems={RELATED_POSTS_COUNT} />}
    >
      <SEO
        title={displayPost?.title}
        description={displayPost?.description || t('blog.default_description')}
        url={displayPost ? `${baseUrl}/${categorySlug}/${postSlug}` : baseUrl}
        type={OGType.ARTICLE}
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
          <AuthorRow>
            <AuthorBox>
              <AuthorLink to={author.url}>
                {author.image?.url && <AuthorAvatar src={author.image.url} alt={author.title} />}
                <AuthorName variant="body2">{author.title}</AuthorName>
              </AuthorLink>
            </AuthorBox>
            <ShareContainer>
              <ShareLabel>{t('blog.share')}</ShareLabel>
              <ShareLink href={locations.twitter(displayPost)} target="_blank" rel="noopener noreferrer">
                <XIcon fontSize="small" />
              </ShareLink>
              <ShareLink href={locations.facebook(displayPost)} target="_blank" rel="noopener noreferrer">
                <FacebookIcon fontSize="small" />
              </ShareLink>
            </ShareContainer>
          </AuthorRow>
        )}

        <BodyContainer>
          <RichText document={displayPost.body} assets={displayPost.bodyAssets} />
        </BodyContainer>
      </ContentContainer>
    </PageLayout>
  )
}
