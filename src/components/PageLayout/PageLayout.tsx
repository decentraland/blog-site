import { useCallback, useMemo } from 'react'
import type { Address } from 'viem'
import { useTokenBalance, useWallet } from '@dcl/core-web3'
import { ChainId, Network } from '@dcl/schemas'
import { FooterLanding, ManaBalancesProps, Navbar, NavbarPages, type NavbarProps } from 'decentraland-ui2'
import { getEnv } from '../../config'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { redirectToAuth } from '../../utils/authRedirect'
import { BlogNavigation } from '../Blog/BlogNavigation'
import type { PageLayoutProps } from './PageLayout.types'
import { ContentWrapper, PageContainer } from './PageLayout.styled'

const manaTokenAddressEthereum = getEnv('MANA_TOKEN_ADDRESS_ETHEREUM') as Address | undefined
const manaTokenAddressMatic = getEnv('MANA_TOKEN_ADDRESS_MATIC') as Address | undefined

const parseTokenBalance = (balance: string | null) => {
  if (balance === null) {
    return undefined
  }

  const parsed = Number(balance)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function PageLayout({ children, activeCategory, showBlogNavigation = false }: PageLayoutProps) {
  const { address, isConnected, isConnecting, isDisconnecting, disconnect } = useWallet()

  const { balance: manaBalanceEthereum } = useTokenBalance({
    tokenAddress: manaTokenAddressEthereum,
    chainId: ChainId.ETHEREUM_MAINNET
  })

  const { balance: manaBalanceMatic } = useTokenBalance({
    tokenAddress: manaTokenAddressMatic,
    chainId: ChainId.MATIC_MAINNET
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
        manaBalances: manaBalances as ManaBalancesProps['manaBalances'],
        onClickSignIn: handleSignIn,
        onClickSignOut: handleSignOut,
        onClickNavbarItem: (event: React.MouseEvent<HTMLElement>) => {
          const target = event.currentTarget as HTMLAnchorElement
          if (target?.href) {
            window.location.href = target.href
          }
        }
      }) as NavbarProps,
    [isConnected, isConnecting, isDisconnecting, address, avatar, manaBalances, handleSignIn, handleSignOut]
  )

  return (
    <PageContainer>
      <Navbar {...navbarProps} />
      {showBlogNavigation && <BlogNavigation active={activeCategory} />}
      <ContentWrapper>{children}</ContentWrapper>
      <FooterLanding />
    </PageContainer>
  )
}
