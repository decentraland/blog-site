enum OGType {
  WEBSITE = 'website',
  ARTICLE = 'article',
  PROFILE = 'profile'
}

interface OGImage {
  url: string
  width?: number
  height?: number
  alt?: string
  type?: string
}

interface SEOProps {
  title?: string
  description?: string
  image?: OGImage | string
  type?: OGType
  url?: string
  locale?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
}

export { OGType }
export type { OGImage, SEOProps }
