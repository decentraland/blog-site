import { configureStore } from '@reduxjs/toolkit'
import { algoliaApi, cmsApi } from '../services/api'

const store = configureStore({
  reducer: {
    [cmsApi.reducerPath]: cmsApi.reducer,
    [algoliaApi.reducerPath]: algoliaApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(cmsApi.middleware, algoliaApi.middleware),
  devTools: process.env.NODE_ENV !== 'production'
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export { store, type RootState, type AppDispatch }
