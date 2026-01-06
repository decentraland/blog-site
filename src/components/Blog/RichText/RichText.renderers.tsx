import { TwitterTweetEmbed } from 'react-twitter-embed'
import { EmbeddedImage, Hyperlink, LinkedInEmbed, TwitterContainer, YouTubeEmbed } from './RichText.styled'
import type { ContentfulAsset } from '../../../shared/types/blog.domain'
import type { Block, Inline, Text } from '@contentful/rich-text-types'

const renderYouTubeEmbed = (uri: string) => {
  const url = new URL(uri)
  const videoCode = url.searchParams.has('v') ? url.searchParams.get('v') : url.pathname.split('/').pop()

  return (
    <YouTubeEmbed
      src={`https://www.youtube.com/embed/${videoCode}`}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}

const renderTwitterEmbed = (uri: string) => {
  const twitterSplit = uri.split('/')
  const tweetId = twitterSplit[twitterSplit.length - 1].split('?')[0]

  return (
    <TwitterContainer>
      <TwitterTweetEmbed tweetId={tweetId} options={{ theme: 'dark' }} />
    </TwitterContainer>
  )
}

const renderEmbeddedAsset = (node: Block | Inline, assets: Record<string, ContentfulAsset>) => {
  const assetId = node.data?.target?.sys?.id as string | undefined
  if (assetId && assets[assetId]) {
    return <EmbeddedImage src={assets[assetId].url} alt="" />
  }

  const url = node.data?.target?.fields?.file?.url as string | undefined
  if (url) {
    return <EmbeddedImage src={url.startsWith('//') ? `https:${url}` : url} alt="" />
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

  if (uri.includes('linkedin.com') && contentValue === uri) {
    return <LinkedInEmbed src={uri} title="Embedded Linkedin Post" />
  }

  const isInternalAnchor = uri.startsWith('#') || (uri.startsWith('https://decentraland.org/blog') && uri.includes('#'))
  const target = isInternalAnchor ? '_self' : '_blank'

  return (
    <Hyperlink href={uri} target={target} rel="noopener noreferrer">
      {contentValue}
    </Hyperlink>
  )
}

export { renderEmbeddedAsset, renderHyperlink }
