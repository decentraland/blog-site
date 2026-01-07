import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AuthorPage } from './pages/AuthorPage'
import { BlogPage } from './pages/BlogPage'
import { CategoryPage } from './pages/CategoryPage'
import { PostPage } from './pages/PostPage'
import { PreviewPage } from './pages/PreviewPage'
import { SearchPage } from './pages/SearchPage'

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
    element: <PreviewPage />
  },
  {
    path: '/blog/search',
    element: <SearchPage />
  },
  {
    path: '/blog/author/:authorSlug',
    element: <AuthorPage />
  },
  {
    path: '/blog/:categorySlug',
    element: <CategoryPage />
  },
  {
    path: '/blog/:categorySlug/:postSlug',
    element: <PostPage />
  }
])
