interface AlgoliaHit {
  objectID: string
  id: string
  title: string
  description: string
  category: string
  categoryId: string
  image: string
  _highlightResult?: {
    title?: {
      value: string
      matchLevel: string
      matchedWords: string[]
    }
    description?: {
      value: string
      matchLevel: string
      matchedWords: string[]
    }
  }
}

interface SearchBlogResult {
  id: string
  categoryId: string
  url: string
  image: string
  highlightedTitle: string
  highlightedDescription: string
}

interface SearchBlogPostsParams {
  query: string
  hitsPerPage?: number
  page?: number
}

interface SearchBlogPostsResponse {
  results: import('../../shared/types/blog.domain').SearchResult[]
  total: number
  hasMore: boolean
}

export type { AlgoliaHit, SearchBlogPostsParams, SearchBlogPostsResponse, SearchBlogResult }
