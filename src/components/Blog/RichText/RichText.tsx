import * as React from 'react'
import { type Options, documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { BLOCKS, type Document, INLINES } from '@contentful/rich-text-types'
import { renderEmbeddedAsset, renderHyperlink } from './RichText.renderers'
import {
  Blockquote,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  ListItem,
  OrderedList,
  Paragraph,
  UnorderedList
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
    [BLOCKS.EMBEDDED_ASSET]: (node) => renderEmbeddedAsset(node, assets),
    [INLINES.HYPERLINK]: (node) => renderHyperlink(node)
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
