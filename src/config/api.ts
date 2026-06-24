const DEFAULT_API_BASE_URL = 'http://localhost:8080/api'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '')

interface BackendErrorResponse {
  message?: string
  fields?: Record<string, string>
}

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function apiUrl(path: string) {
  const cleanedPath = path.startsWith('/') ? path : `/${path}`

  return `${API_BASE_URL}${cleanedPath}`
}

async function createApiError(response: Response): Promise<ApiError> {
  try {
    const data = (await response.json()) as BackendErrorResponse

    return new ApiError(
      response.status,
      data.message || `API request failed with status ${response.status}`,
      data.fields || {},
    )
  } catch {
    return new ApiError(response.status, `API request failed with status ${response.status}`)
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await createApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}