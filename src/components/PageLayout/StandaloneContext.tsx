import { createContext, useContext } from 'react'

// eslint-disable-next-line @typescript-eslint/naming-convention
const StandaloneContext = createContext(true)

const useStandalone = () => useContext(StandaloneContext)

export { StandaloneContext, useStandalone }
