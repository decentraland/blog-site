import { Navbar } from 'decentraland-ui2'
import { BlogNavigation } from '../Blog/BlogNavigation'
import type { PageLayoutProps } from './PageLayout.types'
import { ContentWrapper, PageContainer } from './PageLayout.styled'

export function PageLayout({ children, activeCategory, showBlogNavigation = false }: PageLayoutProps) {
  const isConnected = false
  const isConnecting = false
  const address = null
  const authorize = () => {}
  const disconnect = () => {}
  return (
    <PageContainer>
      <Navbar
        activePage="learn"
        isSignedIn={isConnected}
        isSigningIn={isConnecting}
        address={address || undefined}
        onClickSignIn={authorize}
        onClickSignOut={disconnect}
        onClickNavbarItem={(event) => {
          const target = event.currentTarget as HTMLAnchorElement
          if (target?.href) {
            window.location.href = target.href
          }
        }}
      />
      {showBlogNavigation && <BlogNavigation active={activeCategory} />}
      <ContentWrapper>{children}</ContentWrapper>
    </PageContainer>
  )
}
