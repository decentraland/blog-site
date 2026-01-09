interface SlugFields {
  id?: string
  slug?: string
  title?: string
}

interface GetBlogPostsParams {
  category?: string
  author?: string
  limit?: number
  skip?: number
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _cacheBust?: number
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
  GetBlogPostsParams,
  SlugFields
}
