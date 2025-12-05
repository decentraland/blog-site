import { Document } from '@contentful/rich-text-types'

interface ContentfulAsset {
  id: string
  url: string
  width: number
  height: number
  mimeType: string
}

interface BlogCategory {
  id: string
  slug: string
  title: string
  description: string
  image: ContentfulAsset
  isShownInMenu: boolean
  url: string
}

interface BlogAuthor {
  id: string
  title: string
  description: string
  image: ContentfulAsset
}

interface BlogPost {
  id: string
  slug: string
  title: string
  description: string
  publishedDate: string
  body: Document
  image: ContentfulAsset
  category: BlogCategory
  author: BlogAuthor
  url: string
}

interface PaginatedBlogPosts {
  posts: BlogPost[]
  total: number
  hasMore: boolean
}

interface SearchResult {
  url: string
  image: string
  title: string | JSX.Element[]
  description: string | JSX.Element[]
}

export type { BlogAuthor, BlogCategory, BlogPost, ContentfulAsset, PaginatedBlogPosts, SearchResult }
