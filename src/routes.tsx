import { Suspense, lazy } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { BlogPage } from './pages/BlogPage'

const CategoryPage = lazy(() => import('./pages/CategoryPage').then(m => ({ default: m.CategoryPage })))
const PostPage = lazy(() => import('./pages/PostPage').then(m => ({ default: m.PostPage })))
const AuthorPage = lazy(() => import('./pages/AuthorPage').then(m => ({ default: m.AuthorPage })))
const PreviewPage = lazy(() => import('./pages/PreviewPage').then(m => ({ default: m.PreviewPage })))
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })))
const SignInRedirect = lazy(() => import('./pages/SignInRedirect').then(m => ({ default: m.SignInRedirect })))

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
      <Suspense>
        <PreviewPage />
      </Suspense>
    )
  },
  {
    path: '/blog/search',
    element: (
      <Suspense>
        <SearchPage />
      </Suspense>
    )
  },
  {
    path: '/blog/sign-in',
    element: (
      <Suspense>
        <SignInRedirect />
      </Suspense>
    )
  },
  {
    path: '/blog/author/:authorSlug',
    element: (
      <Suspense>
        <AuthorPage />
      </Suspense>
    )
  },
  {
    path: '/blog/:categorySlug',
    element: (
      <Suspense>
        <CategoryPage />
      </Suspense>
    )
  },
  {
    path: '/blog/:categorySlug/:postSlug',
    element: (
      <Suspense>
        <PostPage />
      </Suspense>
    )
  }
])
