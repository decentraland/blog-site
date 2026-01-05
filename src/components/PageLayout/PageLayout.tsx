import { Container, Navbar } from 'decentraland-ui2'
import { useAuth } from '../../features/auth/useAuth'
import { BlogNavigation } from '../Blog/BlogNavigation'
import type { PageLayoutProps } from './PageLayout.types'
import { ContentWrapper, PageContainer } from './PageLayout.styled'

export function PageLayout({ children, activeCategory, showBlogNavigation = false }: PageLayoutProps) {
  const { isConnected, isConnecting, address, authorize, disconnect } = useAuth()

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
      <ContentWrapper>
        <Container maxWidth="lg">{children}</Container>
      </ContentWrapper>
    </PageContainer>
  )
}
