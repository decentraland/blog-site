import { createSelector } from 'reselect'
import { postsSelectors } from './blog.slice'
import type { RootState } from '../../app/store'
import type { BlogPost } from '../../shared/types/blog.domain'

// Base selector to get the blog state
const selectBlogState = (state: RootState) => state.blog

// Select all posts from normalized state
const selectAllPosts = createSelector([selectBlogState], (blogState): BlogPost[] => postsSelectors.selectAll(blogState))

// Select posts as a dictionary (id -> post)
const selectPostsEntities = createSelector(
  [selectBlogState],
  (blogState): Record<string, BlogPost> => postsSelectors.selectEntities(blogState) as Record<string, BlogPost>
)

// Select a post by ID from normalized state
const selectPostById = createSelector(
  [selectBlogState, (_state: RootState, postId: string) => postId],
  (blogState, postId): BlogPost | undefined => postsSelectors.selectById(blogState, postId)
)

// Select total count of cached posts
const selectPostsTotal = createSelector([selectBlogState], (blogState): number => postsSelectors.selectTotal(blogState))

export { selectAllPosts, selectPostById, selectPostsEntities, selectPostsTotal }
