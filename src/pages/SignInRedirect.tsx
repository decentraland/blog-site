import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { redirectToAuth } from '../utils/authRedirect'

function SignInRedirect() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    const searchParams = new URLSearchParams(search)
    const currentRedirectTo = searchParams.get('redirectTo')

    const redirectPath = currentRedirectTo || `${pathname}${search}`
    redirectToAuth(redirectPath)
  }, [pathname, search])

  return null
}

export { SignInRedirect }
