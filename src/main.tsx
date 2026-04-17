import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import { setupListeners } from '@reduxjs/toolkit/query'
import { Web3CoreProvider, Web3SyncProvider } from '@dcl/core-web3'
import { WalletStateProvider } from '@dcl/core-web3/lazy'
import { AnalyticsProvider, TranslationProvider } from '@dcl/hooks'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { store } from './app/store'
import { getEnv } from './config'
import { blogClient } from './features/blog/blog.client'
import { initializeHelpers } from './features/blog/blog.helpers'
import { web3Config } from './features/web3/web3.config'
import en from './intl/en.json'
import { router } from './routes'

// Setup RTK Query listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch)

// Initialize helpers with store reference (for accessing RTK Query cache)
initializeHelpers(store)

// Defer category/author preloads so they don't compete with the critical render path
const preloadData = () => {
  store.dispatch(blogClient.endpoints.getBlogCategories.initiate())
  store.dispatch(blogClient.endpoints.getBlogAuthors.initiate())
}
if ('requestIdleCallback' in window) {
  requestIdleCallback(preloadData)
} else {
  setTimeout(preloadData, 200)
}

const segmentWriteKey = getEnv('SEGMENT_API_KEY') || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <WalletStateProvider>
        <Web3CoreProvider config={web3Config}>
          <Web3SyncProvider>
            <DclThemeProvider theme={darkTheme}>
              <AnalyticsProvider writeKey={segmentWriteKey}>
                <TranslationProvider locale="en" translations={{ en }} fallbackLocale="en">
                  <RouterProvider router={router} />
                </TranslationProvider>
              </AnalyticsProvider>
            </DclThemeProvider>
          </Web3SyncProvider>
        </Web3CoreProvider>
      </WalletStateProvider>
    </Provider>
  </StrictMode>
)
