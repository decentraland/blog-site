import type { BlogPost } from '../../../shared/types/blog.domain'

export interface RelatedPostProps {
  posts?: BlogPost[]
  loading?: boolean
  maxItems?: number
}
