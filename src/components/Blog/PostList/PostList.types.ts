import type { BlogPost } from '../../../shared/types/blog.domain'

export interface PostListProps {
  posts: BlogPost[]
  loading?: boolean
  hasMainPost?: boolean
  skeletonCount?: number // Number of skeleton loaders to show when loading
  showLoadingAtEnd?: boolean // Show skeletons at the end after posts
}
