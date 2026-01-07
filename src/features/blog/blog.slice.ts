import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import type { BlogPost } from '../../shared/types/blog.domain'

// Entity adapter for normalized posts storage
const postsAdapter = createEntityAdapter<BlogPost>()

// Initial state using the adapter
const initialState = postsAdapter.getInitialState()

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    // Upsert a single post
    postUpserted: postsAdapter.upsertOne,
    // Upsert multiple posts at once
    postsUpserted: postsAdapter.upsertMany,
    // Clear all posts (useful for cache invalidation)
    postsClear: postsAdapter.removeAll
  }
})

const { postUpserted, postsUpserted, postsClear } = blogSlice.actions

const blogReducer = blogSlice.reducer

// Export adapter selectors (will be used with RootState in selectors file)
const postsSelectors = postsAdapter.getSelectors()

export { blogReducer, blogSlice, postsClear, postUpserted, postsSelectors, postsUpserted }
