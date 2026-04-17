import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { networkReducer, transactionsReducer, walletReducer } from '@dcl/core-web3'
import { blogReducer } from '../features/blog/blog.slice'
import { profileClient } from '../features/profile/profile.client'
import { algoliaClient, cmsClient } from '../services/client'

const rootReducer = combineReducers({
  blog: blogReducer,
  network: networkReducer,
  transactions: transactionsReducer,
  wallet: walletReducer,
  [cmsClient.reducerPath]: cmsClient.reducer,
  [algoliaClient.reducerPath]: algoliaClient.reducer,
  [profileClient.reducerPath]: profileClient.reducer
})

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(cmsClient.middleware, algoliaClient.middleware, profileClient.middleware),
  devTools: process.env.NODE_ENV !== 'production'
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export { store, type AppDispatch, type RootState }
