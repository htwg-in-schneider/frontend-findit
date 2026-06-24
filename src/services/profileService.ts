import { apiFetch, handleResponse } from '../config/api'

export type ProfileRole = 'USER' | 'ADMIN'

export interface ProfileUser {
  id: number
  name: string
  email: string
  role: ProfileRole
}

export async function getProfile(): Promise<ProfileUser> {
  return handleResponse<ProfileUser>(await apiFetch('/profile'))
}