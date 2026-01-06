import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { RichText } from '../components/Blog/RichText'
import { PageLayout } from '../components/PageLayout'
import { getEnv } from '../config'
import { useGetBlogPostPreviewQuery } from '../features/blog/blog.client'
import { formatUtcDate } from '../shared/utils/date'
import {
  AuthorAvatar,
  AuthorBox,
  AuthorName,
  BodyContainer,
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
import { AuthorContainer, CategoryText, PreviewBanner } from './PreviewPage.styled'

export const PreviewPage = () => {
  const [searchParams] = useSearchParams()

  const previewOptions = useMemo(
    () => ({
      id: searchParams.get('contentful_id') ?? '',
      env: searchParams.get('contentful_env') ?? '',
      token: searchParams.get('token') ?? '',
      previewBaseUrl: getEnv('CONTENTFUL_PREVIEW_URL') ?? 'https://preview.contentful.com',
      spaceId: getEnv('CONTENTFUL_SPACE_ID') ?? ''
    }),
    [searchParams]
  )

  const isValidParams = previewOptions.id && previewOptions.env && previewOptions.token

  const { data: post, isLoading, error } = useGetBlogPostPreviewQuery(previewOptions, { skip: !isValidParams })

  const publishedDateUtc = useMemo(() => formatUtcDate(post?.publishedDate), [post?.publishedDate])
  const author = post?.author
  const showAuthor = !!author && !!author.title

  if (!isValidParams) {
    return (
      <PageLayout showBlogNavigation={true}>
        <CenteredBox>
          <Typography color="error">Missing preview parameters. Required: contentful_id, contentful_env, token</Typography>
        </CenteredBox>
      </PageLayout>
    )
  }

  if (isLoading) {
    return (
      <PageLayout showBlogNavigation={true}>
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      </PageLayout>
    )
  }

  if (error || !post) {
    return (
      <PageLayout showBlogNavigation={true}>
        <CenteredBox>
          <Typography color="error">Failed to load preview. Please check your preview URL and try again.</Typography>
        </CenteredBox>
      </PageLayout>
    )
  }

  return (
    <PageLayout showBlogNavigation={true}>
      <PreviewBanner>
        <Typography variant="h6">Preview Mode</Typography>
        <Typography variant="body2">You are viewing an unpublished post from Contentful</Typography>
      </PreviewBanner>

      <ContentContainer>
        <PostImage src={post.image.url} alt={post.title} />

        <HeaderBox>
          <MetaText as="span">
            {publishedDateUtc}
            <MetaSeparator>•</MetaSeparator>
            <CategoryText>{post.category.title}</CategoryText>
          </MetaText>
          <TitleBox>
            <TitleText variant="h4">{post.title}</TitleText>
          </TitleBox>
          <SubtitleText variant="h6">{post.description}</SubtitleText>
        </HeaderBox>

        {showAuthor && (
          <AuthorBox>
            <AuthorContainer>
              {author.image?.url && <AuthorAvatar src={author.image.url} alt={author.title} />}
              <AuthorName variant="body2">{author.title}</AuthorName>
            </AuthorContainer>
          </AuthorBox>
        )}

        <BodyContainer>
          <RichText document={post.body} assets={post.bodyAssets} />
        </BodyContainer>
      </ContentContainer>
    </PageLayout>
  )
}
