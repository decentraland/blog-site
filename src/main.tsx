import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import { setupListeners } from '@reduxjs/toolkit/query'
import { PersistGate } from 'redux-persist/integration/react'
import { Web3CoreProvider, Web3SyncProvider } from '@dcl/core-web3'
import { TranslationProvider } from '@dcl/hooks'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { persistor, store } from './app/store'
import { blogClient } from './features/blog/blog.client'
import { initializeHelpers } from './features/blog/blog.helpers'
import { web3Config } from './features/web3/web3.config'
import en from './intl/en.json'
import { router } from './routes'

// Setup RTK Query listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch)

// Initialize helpers with store reference (for accessing RTK Query cache)
initializeHelpers(store)

// Preload categories and authors into RTK Query cache
// This improves initial load time by having data ready when needed
store.dispatch(blogClient.endpoints.getBlogCategories.initiate())
store.dispatch(blogClient.endpoints.getBlogAuthors.initiate())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Web3CoreProvider config={web3Config}>
          <Web3SyncProvider>
            <DclThemeProvider theme={darkTheme}>
              <TranslationProvider locale="en" translations={{ en }} fallbackLocale="en">
                <RouterProvider router={router} />
              </TranslationProvider>
            </DclThemeProvider>
          </Web3SyncProvider>
        </Web3CoreProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
)
