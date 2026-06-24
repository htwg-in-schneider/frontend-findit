import { apiUrl, handleResponse } from '../config/api'

export { ApiError } from '../config/api'

export interface User {
  id: number
  name: string
  email: string
}

export interface UserInput {
  name: string
  email: string
}

export async function getUsers(): Promise<User[]> {
  return handleResponse<User[]>(await fetch(apiUrl('/users')))
}

export async function createUser(input: UserInput): Promise<User> {
  return handleResponse<User>(
    await fetch(apiUrl('/users'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateUser(id: number, input: UserInput): Promise<User> {
  return handleResponse<User>(
    await fetch(apiUrl(`/users/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }),
  )
}

export async function deleteUser(id: number): Promise<void> {
  await handleResponse<void>(
    await fetch(apiUrl(`/users/${id}`), {
      method: 'DELETE',
    }),
  )
}