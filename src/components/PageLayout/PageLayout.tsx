import { useCallback, useMemo } from 'react'
import type { Address } from 'viem'
import { useTokenBalance, useWallet } from '@dcl/core-web3'
import { ChainId, Network } from '@dcl/schemas'
import { Env } from '@dcl/ui-env'
import { FooterLanding, ManaBalancesProps, Navbar, NavbarPages, type NavbarProps } from 'decentraland-ui2'
import { config, getEnv } from '../../config'
import { usePageNotifications } from '../../features/notifications/usePageNotifications'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { redirectToAuth } from '../../utils/authRedirect'
import { BlogNavigation } from '../Blog/BlogNavigation'
import type { PageLayoutProps } from './PageLayout.types'
import { ContentWrapper, PageContainer } from './PageLayout.styled'

const isProd = config.is(Env.PRODUCTION)

const parseTokenBalance = (balance: string | null) => {
  if (balance === null) {
    return undefined
  }

  const parsed = Number(balance)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function PageLayout({ children, activeCategory, fullWidthContent, showBlogNavigation = false }: PageLayoutProps) {
  const { address, isConnected, isConnecting, isDisconnecting, disconnect } = useWallet()

  // Auth identity for signed requests (notifications, etc.)
  const { identity } = useAuthIdentity()

  // Notifications - only enabled when we have a valid identity
  const { notificationProps } = usePageNotifications({
    identity,
    isConnected,
    locale: 'en'
  })

  const { balance: manaBalanceEthereum } = useTokenBalance({
    tokenAddress: getEnv('MANA_TOKEN_ADDRESS_ETHEREUM') as Address,
    chainId: isProd ? ChainId.ETHEREUM_MAINNET : ChainId.ETHEREUM_SEPOLIA
  })

  const { balance: manaBalanceMatic } = useTokenBalance({
    tokenAddress: getEnv('MANA_TOKEN_ADDRESS_MATIC') as Address,
    chainId: isProd ? ChainId.MATIC_MAINNET : ChainId.MATIC_AMOY
  })

  // Load user profile for avatar display
  const { data: profile } = useGetProfileQuery(address ?? undefined, {
    skip: !address
  })
  const avatar = profile?.avatars?.[0]

  const manaBalances = useMemo(() => {
    if (!isConnected) {
      return {}
    }

    const balances: ManaBalancesProps['manaBalances'] = {}
    const ethereumBalance = parseTokenBalance(manaBalanceEthereum)
    const maticBalance = parseTokenBalance(manaBalanceMatic)

    if (ethereumBalance !== undefined) {
      balances[Network.ETHEREUM] = ethereumBalance
    }

    if (maticBalance !== undefined) {
      balances[Network.MATIC] = maticBalance
    }

    return balances
  }, [isConnected, manaBalanceEthereum, manaBalanceMatic])

  const handleSignIn = useCallback(() => {
    redirectToAuth()
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
        manaBalances: manaBalances as ManaBalancesProps['manaBalances'],
        notifications: notificationProps,
        onClickSignIn: handleSignIn,
        onClickSignOut: handleSignOut,
        onClickNavbarItem: (event: React.MouseEvent<HTMLElement>) => {
          const target = event.currentTarget as HTMLAnchorElement
          if (target?.href) {
            window.location.href = target.href
          }
        }
      }) as NavbarProps,
    [isConnected, isConnecting, isDisconnecting, address, avatar, manaBalances, notificationProps, handleSignIn, handleSignOut]
  )

  return (
    <PageContainer>
      <Navbar {...navbarProps} />
      {showBlogNavigation && <BlogNavigation active={activeCategory} />}
      {fullWidthContent}
      <ContentWrapper>{children}</ContentWrapper>
      <FooterLanding />
    </PageContainer>
  )
}
