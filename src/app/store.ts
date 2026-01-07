import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { authReducer } from '../features/auth/auth.slice'
import { blogReducer } from '../features/blog/blog.slice'
import { algoliaClient, cmsClient } from '../services/client'

// Persist config for blog slice only
const blogPersistConfig = {
  key: 'blog',
  storage,
  // Posts cache persists between page reloads
  whitelist: ['ids', 'entities']
}

const rootReducer = combineReducers({
  auth: authReducer,
  blog: persistReducer(blogPersistConfig, blogReducer),
  [cmsClient.reducerPath]: cmsClient.reducer,
  [algoliaClient.reducerPath]: algoliaClient.reducer
})

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(cmsClient.middleware, algoliaClient.middleware),
  devTools: process.env.NODE_ENV !== 'production'
})

const persistor = persistStore(store)

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export { persistor, store, type AppDispatch, type RootState }
