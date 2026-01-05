import * as React from 'react'
import { BLOCKS, type Document, INLINES, MARKS } from '@contentful/rich-text-types'
import { Typography } from 'decentraland-ui2'
import type { RichTextNode } from './richtext.types'
import { BlockquoteBox, EmbeddedImage, ListBox } from './richtext.styled'

const renderNode = (node: RichTextNode, key: number): React.ReactNode => {
  switch (node.nodeType) {
    case BLOCKS.PARAGRAPH:
      return (
        <Typography key={key} variant="body1" paragraph>
          {node.content?.map((child, i) => renderNode(child, i))}
        </Typography>
      )

    case BLOCKS.HEADING_1:
      return (
        <Typography key={key} variant="h1" component="h1" gutterBottom>
          {node.content?.map((child, i) => renderNode(child, i))}
        </Typography>
      )

    case BLOCKS.HEADING_2:
      return (
        <Typography key={key} variant="h2" component="h2" gutterBottom>
          {node.content?.map((child, i) => renderNode(child, i))}
        </Typography>
      )

    case BLOCKS.HEADING_3:
      return (
        <Typography key={key} variant="h3" component="h3" gutterBottom>
          {node.content?.map((child, i) => renderNode(child, i))}
        </Typography>
      )

    case BLOCKS.HEADING_4:
      return (
        <Typography key={key} variant="h4" component="h4" gutterBottom>
          {node.content?.map((child, i) => renderNode(child, i))}
        </Typography>
      )

    case BLOCKS.HEADING_5:
      return (
        <Typography key={key} variant="h5" component="h5" gutterBottom>
          {node.content?.map((child, i) => renderNode(child, i))}
        </Typography>
      )

    case BLOCKS.HEADING_6:
      return (
        <Typography key={key} variant="h6" component="h6" gutterBottom>
          {node.content?.map((child, i) => renderNode(child, i))}
        </Typography>
      )

    case BLOCKS.UL_LIST:
      return (
        <ListBox key={key} component="ul">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ListBox>
      )

    case BLOCKS.OL_LIST:
      return (
        <ListBox key={key} component="ol">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ListBox>
      )

    case BLOCKS.LIST_ITEM:
      return <li key={key}>{node.content?.map((child, i) => renderNode(child, i))}</li>

    case BLOCKS.QUOTE:
      return (
        <BlockquoteBox key={key} component="blockquote">
          {node.content?.map((child, i) => renderNode(child, i))}
        </BlockquoteBox>
      )

    case BLOCKS.EMBEDDED_ASSET: {
      const target = node.data?.target as { fields?: { file?: { url?: string } } } | undefined
      const assetUrl = target?.fields?.file?.url
      if (assetUrl) {
        return <EmbeddedImage key={key} src={assetUrl} alt="" />
      }
      return null
    }

    case INLINES.HYPERLINK:
      return (
        <a key={key} href={node.data?.uri as string} target="_blank" rel="noopener noreferrer">
          {node.content?.map((child, i) => renderNode(child, i))}
        </a>
      )

    case 'text': {
      if (!node.value) return null

      let text: React.ReactNode = node.value

      if (node.marks) {
        node.marks.forEach((mark) => {
          switch (mark.type) {
            case MARKS.BOLD:
              text = <strong key={key}>{text}</strong>
              break
            case MARKS.ITALIC:
              text = <em key={key}>{text}</em>
              break
            case MARKS.UNDERLINE:
              text = <u key={key}>{text}</u>
              break
            case MARKS.CODE:
              text = <code key={key}>{text}</code>
              break
          }
        })
      }

      return text
    }

    default:
      return null
  }
}

const renderRichText = (document: Document): React.ReactNode => {
  if (!document || !document.content) {
    return null
  }

  return document.content.map((node, index) => renderNode(node, index))
}

export { renderRichText }
