import { useEffect, useState } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import type { AuthIdentity } from '@dcl/crypto'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'

type UseAuthIdentityResult = {
  identity: AuthIdentity | undefined
  hasValidIdentity: boolean
  address: string | undefined
}

function useAuthIdentity(): UseAuthIdentityResult {
  const { address } = useWalletState()
  const walletAddress = address ?? undefined
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
