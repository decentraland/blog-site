import { useEffect, useState } from 'react'
import { useWallet } from '@dcl/core-web3'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'
import type { AuthIdentity } from 'decentraland-crypto-fetch'

type UseAuthIdentityResult = {
  identity: AuthIdentity | undefined
  hasValidIdentity: boolean
  address: `0x${string}` | undefined
}

/**
 * Hook to get the user's AuthIdentity from local storage.
 */
function useAuthIdentity(): UseAuthIdentityResult {
  const { address } = useWallet()
  const walletAddress = address ? (address as `0x${string}`) : undefined
  const [identity, setIdentity] = useState<AuthIdentity | undefined>(undefined)

  useEffect(() => {
    if (!walletAddress) {
      setIdentity(undefined)
      return
    }

    try {
      const result = localStorageGetIdentity(walletAddress.toLowerCase())
      setIdentity(result ?? undefined)
    } catch (error) {
      console.error('[useAuthIdentity] Failed to get identity:', error)
      setIdentity(undefined)
    }
  }, [walletAddress])

  return {
    identity,
    hasValidIdentity: Boolean(identity),
    address: walletAddress
  }
}

export { useAuthIdentity }
export type { UseAuthIdentityResult }
