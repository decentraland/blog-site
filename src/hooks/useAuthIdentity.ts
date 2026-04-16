import { useEffect, useState } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import type { AuthIdentity } from '@dcl/crypto'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'

type UseAuthIdentityResult = {
  identity: AuthIdentity | undefined
  hasValidIdentity: boolean
  address: string | undefined
}

function isIdentityValid(identity: AuthIdentity | undefined): boolean {
  return Boolean(identity && identity.expiration > new Date())
}

function readIdentity(address: string): AuthIdentity | undefined {
  try {
    return localStorageGetIdentity(address.toLowerCase()) ?? undefined
  } catch (error) {
    console.error('[useAuthIdentity] Failed to get identity:', error)
    return undefined
  }
}

function useAuthIdentity(): UseAuthIdentityResult {
  const { address } = useWalletState()
  const walletAddress = address ?? undefined
  const [identity, setIdentity] = useState<AuthIdentity | undefined>(() => (walletAddress ? readIdentity(walletAddress) : undefined))

  useEffect(() => {
    if (!walletAddress) {
      setIdentity(undefined)
      return
    }

    setIdentity(readIdentity(walletAddress))

    // Re-read identity periodically to catch SSO writes after wallet connect
    const interval = setInterval(() => {
      setIdentity(readIdentity(walletAddress))
    }, 1000)

    return () => clearInterval(interval)
  }, [walletAddress])

  return {
    identity,
    hasValidIdentity: isIdentityValid(identity),
    address: walletAddress
  }
}

export { useAuthIdentity }
export type { UseAuthIdentityResult }
