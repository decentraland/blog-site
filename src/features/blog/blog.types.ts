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

export type { GetBlogAuthorParams, GetBlogCategoryBySlugParams, GetBlogPostBySlugParams, GetBlogPostParams, GetBlogPostsParams }
