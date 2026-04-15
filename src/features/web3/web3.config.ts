import { createWeb3CoreConfig, thirdweb } from '@dcl/core-web3'
import { config, getEnv } from '../../config'

const THIRDWEB_CLIENT_ID = getEnv('THIRDWEB_CLIENT_ID') ?? ''

const ENV_MAP = { dev: 'dev', stg: 'stg', prod: 'prd' } as const
const environment = ENV_MAP[config.getEnv() as keyof typeof ENV_MAP] ?? 'prd'

const web3Config = createWeb3CoreConfig({
  environment,
  appMetadata: {
    name: 'Decentraland Blog',
    description: 'The official Decentraland Blog',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://decentraland.org/blog'
  },
  additionalConnectors: [...(THIRDWEB_CLIENT_ID ? [thirdweb({ clientId: THIRDWEB_CLIENT_ID })] : [])]
})

export { THIRDWEB_CLIENT_ID, web3Config }
