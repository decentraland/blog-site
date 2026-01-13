import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { networkReducer, transactionsReducer, walletReducer } from '@dcl/core-web3'
import { blogReducer } from '../features/blog/blog.slice'
import { profileClient } from '../features/profile/profile.client'
import { algoliaClient, cmsClient } from '../services/client'

// Persist config for blog slice only
const blogPersistConfig = {
  key: 'blog',
  storage,
  // Posts cache persists between page reloads
  whitelist: ['ids', 'entities']
}

const rootReducer = combineReducers({
  blog: persistReducer(blogPersistConfig, blogReducer),
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
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(cmsClient.middleware, algoliaClient.middleware, profileClient.middleware),
  devTools: process.env.NODE_ENV !== 'production'
})

const persistor = persistStore(store)

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export { persistor, store, type AppDispatch, type RootState }
