import type { ReactNode } from 'react'

export interface PageLayoutProps {
  children: ReactNode
  activeCategory?: string
  banner?: ReactNode
  showBlogNavigation?: boolean
}
