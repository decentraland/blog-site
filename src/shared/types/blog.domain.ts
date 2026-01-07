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
  slug: string
  title: string
  description: string
  image: ContentfulAsset
  url: string
}

interface BlogPost {
  id: string
  slug: string
  title: string
  description: string
  publishedDate: string
  body: Document
  bodyAssets: Record<string, ContentfulAsset>
  image: ContentfulAsset
  category: BlogCategory
  author: BlogAuthor
  url: string
}

interface PaginatedBlogPosts {
  posts: BlogPost[]
  total: number
  hasMore: boolean
  nextCmsSkip: number // Track CMS-level skip for proper pagination with client-side filtering
}

// Placeholder for loading state in lists
interface PlaceholderPost {
  id: string
  isPlaceholder: true
}

type PostOrPlaceholder = BlogPost | PlaceholderPost

interface SearchResult {
  url: string
  image: string
  title: string | JSX.Element[]
  description: string | JSX.Element[]
}

export type { BlogAuthor, BlogCategory, BlogPost, ContentfulAsset, PaginatedBlogPosts, PlaceholderPost, PostOrPlaceholder, SearchResult }
