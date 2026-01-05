export interface RichTextNode {
  nodeType: string
  data: Record<string, unknown>
  content?: RichTextNode[]
  value?: string
  marks?: Array<{ type: string }>
}
