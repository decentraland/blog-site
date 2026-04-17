import { Suspense, lazy } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { BlogPage } from './pages/BlogPage'

const CategoryPage = lazy(() => import('./pages/CategoryPage').then(m => ({ default: m.CategoryPage })))
const PostPage = lazy(() => import('./pages/PostPage').then(m => ({ default: m.PostPage })))
const AuthorPage = lazy(() => import('./pages/AuthorPage').then(m => ({ default: m.AuthorPage })))
const PreviewPage = lazy(() => import('./pages/PreviewPage').then(m => ({ default: m.PreviewPage })))
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })))
const SignInRedirect = lazy(() => import('./pages/SignInRedirect').then(m => ({ default: m.SignInRedirect })))

// Minimal fallback: keeps the page height stable while the route chunk loads so slower
// connections don't see a blank flash between the shell and the lazy-loaded page.
const RouteFallback = (): JSX.Element => <div aria-busy="true" aria-live="polite" style={{ minHeight: '60vh' }} />

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/blog" replace />
  },
  {
    path: '/blog',
    element: <BlogPage />
  },
  {
    path: '/blog/preview',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <PreviewPage />
      </Suspense>
    )
  },
  {
    path: '/blog/search',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <SearchPage />
      </Suspense>
    )
  },
  {
    path: '/blog/sign-in',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <SignInRedirect />
      </Suspense>
    )
  },
  {
    path: '/blog/author/:authorSlug',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <AuthorPage />
      </Suspense>
    )
  },
  {
    path: '/blog/:categorySlug',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <CategoryPage />
      </Suspense>
    )
  },
  {
    path: '/blog/:categorySlug/:postSlug',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <PostPage />
      </Suspense>
    )
  }
])
