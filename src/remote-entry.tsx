import { Provider } from 'react-redux'
import { Route, Routes } from 'react-router-dom'
import { setupListeners } from '@reduxjs/toolkit/query'
import { PersistGate } from 'redux-persist/integration/react'
import { Web3CoreProvider, Web3SyncProvider } from '@dcl/core-web3'
import { TranslationProvider } from '@dcl/hooks'
import { persistor, store } from './app/store'
import { StandaloneContext } from './components/PageLayout/StandaloneContext'
import { blogClient } from './features/blog/blog.client'
import { initializeHelpers } from './features/blog/blog.helpers'
import { web3Config } from './features/web3/web3.config'
import en from './intl/en.json'
import { AuthorPage } from './pages/AuthorPage'
import { BlogPage } from './pages/BlogPage'
import { CategoryPage } from './pages/CategoryPage'
import { PostPage } from './pages/PostPage'
import { PreviewPage } from './pages/PreviewPage'
import { SearchPage } from './pages/SearchPage'
import { SignInRedirect } from './pages/SignInRedirect'

setupListeners(store.dispatch)
initializeHelpers(store)
store.dispatch(blogClient.endpoints.getBlogCategories.initiate())
store.dispatch(blogClient.endpoints.getBlogAuthors.initiate())

// eslint-disable-next-line import/no-default-export
export default function BlogSiteRemote() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Web3CoreProvider config={web3Config}>
          <Web3SyncProvider>
            <TranslationProvider locale="en" translations={{ en }} fallbackLocale="en">
              <StandaloneContext.Provider value={false}>
                <Routes>
                  <Route path="/" element={<BlogPage />} />
                  <Route path="/preview" element={<PreviewPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/sign-in" element={<SignInRedirect />} />
                  <Route path="/author/:authorSlug" element={<AuthorPage />} />
                  <Route path="/:categorySlug" element={<CategoryPage />} />
                  <Route path="/:categorySlug/:postSlug" element={<PostPage />} />
                </Routes>
              </StandaloneContext.Provider>
            </TranslationProvider>
          </Web3SyncProvider>
        </Web3CoreProvider>
      </PersistGate>
    </Provider>
  )
}
