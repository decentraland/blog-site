import { useCallback, useMemo } from 'react'
import { useWallet } from '@dcl/core-web3'
import { Navbar, NavbarPages, type NavbarProps } from 'decentraland-ui2'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { redirectToAuth } from '../../utils/authRedirect'
import { BlogNavigation } from '../Blog/BlogNavigation'
import type { PageLayoutProps } from './PageLayout.types'
import { ContentWrapper, PageContainer } from './PageLayout.styled'

export function PageLayout({ children, activeCategory, showBlogNavigation = false }: PageLayoutProps) {
  const { address, isConnected, isConnecting, isDisconnecting, disconnect } = useWallet()

  // Load user profile for avatar display
  const { data: profile } = useGetProfileQuery(address ?? undefined, {
    skip: !address
  })
  const avatar = profile?.avatars?.[0]

  const handleSignIn = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search
    redirectToAuth(currentPath)
  }, [])

  const handleSignOut = useCallback(() => {
    disconnect()
  }, [disconnect])

  // Memoize navbar props
  const navbarProps = useMemo(
    () =>
      ({
        activePage: NavbarPages.LEARN,
        isSignedIn: isConnected,
        isSigningIn: isConnecting,
        isDisconnecting,
        address: address || undefined,
        avatar,
        onClickSignIn: handleSignIn,
        onClickSignOut: handleSignOut,
        onClickNavbarItem: (event: React.MouseEvent<HTMLElement>) => {
          const target = event.currentTarget as HTMLAnchorElement
          if (target?.href) {
            window.location.href = target.href
          }
        }
      }) as NavbarProps,
    [isConnected, isConnecting, isDisconnecting, address, avatar, handleSignIn, handleSignOut]
  )

  return (
    <PageContainer>
      <Navbar {...navbarProps} />
      {showBlogNavigation && <BlogNavigation active={activeCategory} />}
      <ContentWrapper>{children}</ContentWrapper>
    </PageContainer>
  )
}
