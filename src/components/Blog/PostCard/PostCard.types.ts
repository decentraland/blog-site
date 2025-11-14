import type { BlogPost } from '../../../shared/types/blog.domain'

export interface PostCardProps {
  post?: BlogPost
  loading?: boolean
}
