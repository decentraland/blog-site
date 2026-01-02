import type { PostOrPlaceholder } from '../../../shared/types/blog.domain'

export interface PostListProps {
  posts: PostOrPlaceholder[]
  loading?: boolean
  hasMainPost?: boolean
}
