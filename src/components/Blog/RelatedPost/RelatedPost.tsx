import { memo } from 'react'
import { useTranslation } from '@dcl/hooks'
import { PostCard } from '../PostCard'
import type { RelatedPostProps } from './RelatedPost.types'
import { RelatedContainer, RelatedSection, RelatedTitle, RelatedWrapper } from './RelatedPost.styled'

const DEFAULT_MAX_ITEMS = 3

const RelatedPost = memo((props: RelatedPostProps) => {
  const { posts = [], loading = false, maxItems = DEFAULT_MAX_ITEMS } = props
  const visiblePosts = posts.slice(0, maxItems)
  const { t } = useTranslation()

  if (loading || visiblePosts.length === 0) {
    return null
  }

  return (
    <RelatedSection>
      <RelatedContainer>
        <RelatedTitle variant="h6">{t('blog.related_post')}</RelatedTitle>
        <RelatedWrapper>
          {visiblePosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </RelatedWrapper>
      </RelatedContainer>
    </RelatedSection>
  )
})

export { RelatedPost }
