import { apiFetch, handleResponse } from '../config/api'

export type ProfileRole = 'USER' | 'ADMIN'

export interface ProfileUser {
  id: number
  name: string
  email: string
  role: ProfileRole
  displayColor: string
}

export interface ProfileInput {
  name: string
  email: string
  displayColor: string
}

export async function getProfile(): Promise<ProfileUser> {
  return handleResponse<ProfileUser>(await apiFetch('/profile'))
}

export async function updateProfile(input: ProfileInput): Promise<ProfileUser> {
  return handleResponse<ProfileUser>(
    await apiFetch('/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }),
  )
}