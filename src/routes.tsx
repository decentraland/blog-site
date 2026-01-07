import { Navigate, createBrowserRouter } from 'react-router-dom'
import { BlogPage } from './pages/BlogPage'
import { PostPage } from './pages/PostPage'
import { PreviewPage } from './pages/PreviewPage'

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
    path: '/blog/:categorySlug/:postSlug',
    element: <PostPage />
  }
])
