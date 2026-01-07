interface GetBlogPostsParams {
  category?: string
  author?: string
  limit?: number
  skip?: number
  _cacheBust?: number // Force unique queries
}

interface GetBlogPostParams {
  id: string
}

interface GetBlogPostBySlugParams {
  categorySlug: string
  postSlug: string
}

interface GetBlogCategoryBySlugParams {
  slug: string
}

interface GetBlogAuthorParams {
  id: string
}

interface GetBlogAuthorBySlugParams {
  slug: string
}

interface GetBlogPostPreviewParams {
  id: string
  env: string
  token: string
  previewBaseUrl: string
  spaceId: string
}

export type {
  GetBlogAuthorBySlugParams,
  GetBlogAuthorParams,
  GetBlogCategoryBySlugParams,
  GetBlogPostBySlugParams,
  GetBlogPostParams,
  GetBlogPostPreviewParams,
  GetBlogPostsParams
}
