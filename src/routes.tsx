import { Navigate, createBrowserRouter } from 'react-router-dom'
import { BlogPage } from './pages/BlogPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/blog" replace />
  },
  {
    path: '/blog',
    element: <BlogPage />
  }
])
