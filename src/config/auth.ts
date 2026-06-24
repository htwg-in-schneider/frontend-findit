const rawAuthEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true'

export const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || ''
export const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || ''
export const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || ''

const fallbackRedirectUri =
  typeof window !== 'undefined'
    ? `${window.location.origin}${import.meta.env.BASE_URL}`
    : '/'

export const AUTH0_REDIRECT_URI =
  import.meta.env.VITE_AUTH0_REDIRECT_URI || fallbackRedirectUri

export const AUTH0_LOGOUT_RETURN_TO =
  import.meta.env.VITE_AUTH0_LOGOUT_RETURN_TO || fallbackRedirectUri

export const AUTH_CONFIGURATION_INCOMPLETE =
  rawAuthEnabled && (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID)

export const AUTH_ENABLED =
  rawAuthEnabled && !AUTH_CONFIGURATION_INCOMPLETE