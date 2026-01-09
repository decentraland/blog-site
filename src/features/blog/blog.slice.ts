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
    postUpserted: (state, action) => postsAdapter.upsertOne(state, action),
    postsUpserted: (state, action) => postsAdapter.upsertMany(state, action),
    postsClear: state => postsAdapter.removeAll(state)
  }
})

const { postUpserted, postsUpserted, postsClear } = blogSlice.actions

const blogReducer = blogSlice.reducer

// Export adapter selectors (will be used with RootState in selectors file)
const postsSelectors = postsAdapter.getSelectors()

export { blogReducer, blogSlice, postsClear, postUpserted, postsSelectors, postsUpserted }
