import { Navigate, createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/blog" replace />
  },
  {
    path: '/blog',
    lazy: () => import('./pages/BlogPage').then(m => ({ Component: m.BlogPage }))
  },
  {
    path: '/blog/preview',
    lazy: () => import('./pages/PreviewPage').then(m => ({ Component: m.PreviewPage }))
  },
  {
    path: '/blog/search',
    lazy: () => import('./pages/SearchPage').then(m => ({ Component: m.SearchPage }))
  },
  {
    path: '/blog/sign-in',
    lazy: () => import('./pages/SignInRedirect').then(m => ({ Component: m.SignInRedirect }))
  },
  {
    path: '/blog/author/:authorSlug',
    lazy: () => import('./pages/AuthorPage').then(m => ({ Component: m.AuthorPage }))
  },
  {
    path: '/blog/:categorySlug',
    lazy: () => import('./pages/CategoryPage').then(m => ({ Component: m.CategoryPage }))
  },
  {
    path: '/blog/:categorySlug/:postSlug',
    lazy: () => import('./pages/PostPage').then(m => ({ Component: m.PostPage }))
  }
])
