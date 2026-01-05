import * as React from 'react'
import { TwitterTweetEmbed } from 'react-twitter-embed'
import { type Options, documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { BLOCKS, type Document, INLINES, type Text } from '@contentful/rich-text-types'
import {
  Blockquote,
  EmbeddedImage,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Hyperlink,
  LinkedInEmbed,
  ListItem,
  OrderedList,
  Paragraph,
  TwitterContainer,
  UnorderedList,
  YouTubeEmbed
} from './RichText.styled'
import type { ContentfulAsset } from '../../../shared/types/blog.domain'

interface RichTextProps {
  document: Document
  assets?: Record<string, ContentfulAsset>
}

const createRichTextOptions = (assets: Record<string, ContentfulAsset>): Options => ({
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node, children) => <Paragraph>{children}</Paragraph>,
    [BLOCKS.HEADING_1]: (_node, children) => <Heading1>{children}</Heading1>,
    [BLOCKS.HEADING_2]: (_node, children) => <Heading2>{children}</Heading2>,
    [BLOCKS.HEADING_3]: (_node, children) => <Heading3>{children}</Heading3>,
    [BLOCKS.HEADING_4]: (_node, children) => <Heading4>{children}</Heading4>,
    [BLOCKS.HEADING_5]: (_node, children) => <Heading5>{children}</Heading5>,
    [BLOCKS.HEADING_6]: (_node, children) => <Heading6>{children}</Heading6>,
    [BLOCKS.UL_LIST]: (_node, children) => <UnorderedList>{children}</UnorderedList>,
    [BLOCKS.OL_LIST]: (_node, children) => <OrderedList>{children}</OrderedList>,
    [BLOCKS.LIST_ITEM]: (_node, children) => <ListItem>{children}</ListItem>,
    [BLOCKS.QUOTE]: (_node, children) => <Blockquote>{children}</Blockquote>,
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const assetId = node.data?.target?.sys?.id as string | undefined
      if (assetId && assets[assetId]) {
        return <EmbeddedImage src={assets[assetId].url} alt="" />
      }
      // Fallback: try to get URL directly from node data (for resolved assets)
      const url = node.data?.target?.fields?.file?.url as string | undefined
      if (url) {
        return <EmbeddedImage src={url.startsWith('//') ? `https:${url}` : url} alt="" />
      }
      return null
    },
    [INLINES.HYPERLINK]: (node) => {
      const uri = node.data.uri as string
      const content = node.content as Text[]
      const contentValue = content[0]?.value

      if ((uri.includes('youtube.com') || uri.includes('youtu.be')) && contentValue === uri) {
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

      if ((uri.includes('twitter.com') || uri.includes('x.com')) && contentValue === uri) {
        const twitterSplit = uri.split('/')
        const tweetId = twitterSplit[twitterSplit.length - 1].split('?')[0]

        return (
          <TwitterContainer>
            <TwitterTweetEmbed tweetId={tweetId} options={{ theme: 'dark' }} />
          </TwitterContainer>
        )
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
  }
})

const RichText = ({ document, assets = {} }: RichTextProps): React.ReactNode => {
  if (!document || !document.content) {
    return null
  }

  const options = React.useMemo(() => createRichTextOptions(assets), [assets])

  return <>{documentToReactComponents(document, options)}</>
}

export { RichText }
