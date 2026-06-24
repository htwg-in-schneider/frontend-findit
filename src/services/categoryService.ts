import { apiUrl, handleResponse } from '../config/api'

export { ApiError } from '../config/api'

export interface Category {
  id: number
  name: string
  description: string
}

export interface CategoryInput {
  name: string
  description: string
}

export async function getCategories(): Promise<Category[]> {
  return handleResponse<Category[]>(await fetch(apiUrl('/categories')))
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  return handleResponse<Category>(
    await fetch(apiUrl('/categories'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateCategory(id: number, input: CategoryInput): Promise<Category> {
  return handleResponse<Category>(
    await fetch(apiUrl(`/categories/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }),
  )
}

export async function deleteCategory(id: number): Promise<void> {
  await handleResponse<void>(
    await fetch(apiUrl(`/categories/${id}`), {
      method: 'DELETE',
    }),
  )
}