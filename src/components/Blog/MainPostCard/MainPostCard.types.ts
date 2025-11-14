import type { BlogPost } from '../../../shared/types/blog.domain'

export interface MainPostCardProps {
  post?: BlogPost
  loading?: boolean
}
