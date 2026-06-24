type AccessTokenProvider = () => Promise<string | null>

let accessTokenProvider: AccessTokenProvider | null = null

export function setAccessTokenProvider(provider: AccessTokenProvider | null) {
  accessTokenProvider = provider
}

export async function getAccessToken() {
  if (!accessTokenProvider) {
    return null
  }

  try {
    return await accessTokenProvider()
  } catch (error) {
    console.error(error)
    return null
  }
}