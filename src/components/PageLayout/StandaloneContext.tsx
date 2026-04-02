import { createContext, useContext } from 'react'

/**
 * Indicates whether blog-site is running standalone (true) or embedded
 * inside the landing-site shell via Module Federation (false).
 *
 * Default is `true` (standalone). The remote entry (`BlogSiteRemote`)
 * wraps the app with `<StandaloneContext.Provider value={false}>` so
 * that embedded components can skip rendering the Navbar/Footer (the
 * host shell provides those).
 *
 * @see {@link file://../remote-entry.tsx} where the provider is set to false
 * @see {@link file://./PageLayout.tsx} where `useStandalone` controls layout
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const StandaloneContext = createContext(true)

const useStandalone = () => useContext(StandaloneContext)

export { StandaloneContext, useStandalone }
