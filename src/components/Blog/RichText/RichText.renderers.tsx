import { Suspense, lazy } from 'react'
import type { Block, Inline, Text } from '@contentful/rich-text-types'
import { getEnv } from '../../../config'
import type { ContentfulAsset } from '../../../shared/types/blog.domain'
import { EmbeddedImage, Hyperlink, InstagramEmbed, InternalLink, LinkedInEmbed, TwitterContainer, YouTubeEmbed } from './RichText.styled'

const LazyTwitterEmbed = lazy(() => import('react-twitter-embed').then(m => ({ default: m.TwitterTweetEmbed })))

const renderYouTubeEmbed = (uri: string) => {
  const url = new URL(uri)
  const videoCode = url.searchParams.has('v') ? url.searchParams.get('v') : url.pathname.split('/').pop()

  return (
    <YouTubeEmbed
      src={`https://www.youtube.com/embed/${videoCode}`}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      loading="lazy"
    />
  )
}

const renderTwitterEmbed = (uri: string) => {
  const twitterSplit = uri.split('/')
  const tweetId = twitterSplit[twitterSplit.length - 1].split('?')[0]

  return (
    <TwitterContainer>
      <Suspense>
        <LazyTwitterEmbed tweetId={tweetId} options={{ theme: 'dark' }} />
      </Suspense>
    </TwitterContainer>
  )
}

const renderInstagramEmbed = (uri: string) => {
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    return null
  }

  const pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  const embedSrc = `https://www.instagram.com${pathname}embed/`
  const title = uri.includes('/reel/') ? 'Instagram Reel' : 'Instagram Post'

  return <InstagramEmbed src={embedSrc} title={title} scrolling="no" allowFullScreen loading="lazy" />
}

const renderEmbeddedAsset = (node: Block | Inline, assets: Record<string, ContentfulAsset>) => {
  const assetId = node.data?.target?.sys?.id as string | undefined
  if (assetId && assets[assetId]) {
    const asset = assets[assetId]
    return <EmbeddedImage src={asset.url} alt="" width={asset.width} height={asset.height} loading="lazy" decoding="async" />
  }

  const url = node.data?.target?.fields?.file?.url as string | undefined
  if (url) {
    return <EmbeddedImage src={url.startsWith('//') ? `https:${url}` : url} alt="" loading="lazy" decoding="async" />
  }

  return null
}

const renderHyperlink = (node: Block | Inline) => {
  const uri = node.data.uri as string
  const content = node.content as Text[]
  const contentValue = content[0]?.value

  if ((uri.includes('youtube.com') || uri.includes('youtu.be')) && contentValue === uri) {
    return renderYouTubeEmbed(uri)
  }

  if ((uri.includes('twitter.com') || uri.includes('x.com')) && contentValue === uri) {
    return renderTwitterEmbed(uri)
  }

  if (uri.includes('instagram.com') && contentValue === uri) {
    try {
      if (new URL(uri).hostname.endsWith('instagram.com')) {
        return renderInstagramEmbed(uri)
      }
    } catch {
      // malformed URL — fall through to plain hyperlink
    }
  }

  if (uri.includes('linkedin.com') && contentValue === uri) {
    return <LinkedInEmbed src={uri} title="Embedded Linkedin Post" loading="lazy" />
  }

  // Check if this is an internal blog link (e.g. https://decentraland.org/blog/...)
  const blogBaseUrl = getEnv('BLOG_BASE_URL') || ''
  const isInternalBlogLink = uri.startsWith(blogBaseUrl)
  const isAnchorLink = uri.startsWith('#')

  if (isInternalBlogLink) {
    // Extract the path starting from /blog/...
    const internalPath = new URL(uri, window.location.origin).pathname
    return <InternalLink to={internalPath}>{contentValue}</InternalLink>
  }

  if (isAnchorLink) {
    return (
      <Hyperlink href={uri} target="_self">
        {contentValue}
      </Hyperlink>
    )
  }

  return (
    <Hyperlink href={uri} target="_blank" rel="noopener noreferrer">
      {contentValue}
    </Hyperlink>
  )
}

export { renderEmbeddedAsset, renderHyperlink }
