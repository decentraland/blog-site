import * as React from 'react'
import { useMediaQuery } from 'react-responsive'
import { MainPostCard } from '../MainPostCard'
import { PostCard } from '../PostCard'
import type { PostListProps } from './PostList.types'
import { PostListWrapper } from './PostList.styled'

const PostList = React.memo((props: PostListProps) => {
  const { posts, loading, hasMainPost = false, skeletonCount = 0, showLoadingAtEnd = false } = props
  const isBigScreen = useMediaQuery({ minWidth: 1096 })

  if (loading && posts.length === 0) {
    // Initial loading - show only skeletons
    const count = skeletonCount || (hasMainPost ? 7 : 6)

    return (
      <PostListWrapper>
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

  return (
    <PostListWrapper>
      {hasMainPost && isBigScreen && posts.length > 0 && <MainPostCard post={posts[0]} />}
      {posts.map((post, index) => {
        // Skip the first post if we're showing it as MainPostCard
        if (hasMainPost && index === 0 && isBigScreen) {
          return null
        }
        return <PostCard key={post.id} post={post} />
      })}
      {/* Show loading skeletons at the end */}
      {showLoadingAtEnd &&
        skeletonCount > 0 &&
        Array.from(Array(skeletonCount), (_, index) => <PostCard key={`skeleton-end-${index}`} loading />)}
    </PostListWrapper>
  )
})

export { PostList }
