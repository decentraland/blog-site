import { memo } from 'react'
import { useMediaQuery } from 'react-responsive'
import type { BlogPost } from '../../../shared/types/blog.domain'
import { MainPostCard } from '../MainPostCard'
import { PostCard } from '../PostCard'
import type { PostListProps } from './PostList.types'
import { PostListWrapper } from './PostList.styled'

// Type guard to check if a post is a placeholder
const isPlaceholder = (post: { id: string; isPlaceholder?: boolean }): post is { id: string; isPlaceholder: true } => {
  return 'isPlaceholder' in post && post.isPlaceholder === true
}

const PostList = memo((props: PostListProps) => {
  const { posts, loading, hasMainPost = false } = props
  const isBigScreen = useMediaQuery({ minWidth: 1096 })

  // Initial loading with no posts at all
  if (loading && posts.length === 0) {
    const count = hasMainPost ? 7 : 6

    return (
      <PostListWrapper hasMainPost={hasMainPost}>
        {hasMainPost && <MainPostCard loading />}
        {Array.from(Array(count), (_, index) => {
          if (hasMainPost && index === 0) {
            return null // MainPostCard already rendered
          }
          return <PostCard key={`skeleton-${index}`} loading />
        })}
      </PostListWrapper>
    )
  }

  if (!posts || posts.length === 0) {
    return null
  }

  // Get first real post for MainPostCard (if applicable)
  const firstRealPost = posts.find(p => !isPlaceholder(p)) as BlogPost | undefined

  return (
    <PostListWrapper hasMainPost={hasMainPost}>
      {hasMainPost && isBigScreen && firstRealPost && <MainPostCard post={firstRealPost} />}
      {posts.map(post => {
        // Skip the first real post if we're showing it as MainPostCard
        if (hasMainPost && isBigScreen && !isPlaceholder(post) && post === firstRealPost) {
          return null
        }

        // Render placeholder as loading skeleton
        if (isPlaceholder(post)) {
          return <PostCard key={post.id} loading />
        }

        return <PostCard key={post.id} post={post} />
      })}
    </PostListWrapper>
  )
})

export { PostList }
