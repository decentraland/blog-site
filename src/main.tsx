import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import { setupListeners } from '@reduxjs/toolkit/query'
import { PersistGate } from 'redux-persist/integration/react'
import { Web3CoreProvider, Web3SyncProvider } from '@dcl/core-web3'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { persistor, store } from './app/store'
import { blogClient } from './features/blog/blog.client'
import { initializeHelpers } from './features/blog/blog.helpers'
import { web3Config } from './features/web3/web3.config'
import { router } from './routes'

declare global {
  interface Window {
    clearSWCache?: () => void
  }
}

// Setup RTK Query listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch)

// Initialize helpers with store reference (for accessing RTK Query cache)
initializeHelpers(store)

// Preload categories and authors into RTK Query cache
// This improves initial load time by having data ready when needed
store.dispatch(blogClient.endpoints.getBlogCategories.initiate())
store.dispatch(blogClient.endpoints.getBlogAuthors.initiate())

// Register Service Worker for persistent HTTP cache
// Note: Service Worker only works in production or when served over HTTPS
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        // Optional: Add a function to clear cache from console
        if (import.meta.env.DEV) {
          window.clearSWCache = () => {
            registration.active?.postMessage({ type: 'CLEAR_CACHE' })
          }
        }
      })
      .catch(error => {
        console.error('[SW] Service Worker registration failed:', error)
      })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Web3CoreProvider config={web3Config}>
          <Web3SyncProvider>
            <DclThemeProvider theme={darkTheme}>
              <RouterProvider router={router} />
            </DclThemeProvider>
          </Web3SyncProvider>
        </Web3CoreProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
)
