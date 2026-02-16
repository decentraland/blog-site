import type { ReactNode } from 'react'

export interface PageLayoutProps {
  children: ReactNode
  activeCategory?: string
  fullWidthContent?: ReactNode
  showBlogNavigation?: boolean
}
