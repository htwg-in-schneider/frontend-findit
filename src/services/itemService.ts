import { apiFetch, handleResponse } from '../config/api'

export { ApiError } from '../config/api'

export type ItemType = 'LOST' | 'FOUND'
export type ItemStatus = 'OPEN' | 'IN_PROGRESS' | 'RETURNED'

export interface User {
  id: number
  name: string
  email: string
}

export interface Item {
  id: number
  title: string
  description: string
  type: ItemType
  category: string
  location: string
  latitude: number | null
  longitude: number | null
  date: string
  status: ItemStatus
  user: User
}

export interface ItemInput {
  title: string
  description: string
  type: ItemType
  category: string
  location: string
  latitude: number
  longitude: number
  date: string
  status: ItemStatus
  userId: number
}

export interface ItemFilters {
  query?: string
  type?: string
  category?: string
  status?: string
}

export async function getItems(): Promise<Item[]> {
  return handleResponse<Item[]>(await apiFetch('/items'))
}

export async function getItemById(id: number): Promise<Item> {
  return handleResponse<Item>(await apiFetch(`/items/${id}`))
}

export async function createItem(input: ItemInput): Promise<Item> {
  return handleResponse<Item>(
    await apiFetch('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateItem(id: number, input: ItemInput): Promise<Item> {
  return handleResponse<Item>(
    await apiFetch(`/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }),
  )
}

export async function deleteItem(id: number): Promise<void> {
  await handleResponse<void>(
    await apiFetch(`/items/${id}`, {
      method: 'DELETE',
    }),
  )
}

export async function markItemAsReturned(id: number): Promise<Item> {
  return handleResponse<Item>(
    await apiFetch(`/items/${id}/return`, {
      method: 'PUT',
    }),
  )
}

export async function getPossibleMatches(id: number): Promise<Item[]> {
  return handleResponse<Item[]>(await apiFetch(`/items/${id}/matches`))
}

export async function searchAndFilterItems(filters: ItemFilters): Promise<Item[]> {
  const params = new URLSearchParams()

  if (filters.type) {
    params.set('type', filters.type)
  }

  if (filters.category) {
    params.set('category', filters.category)
  }

  if (filters.status) {
    params.set('status', filters.status)
  }

  const hasBackendFilters = params.toString().length > 0
  const url = hasBackendFilters ? `/items/filter?${params.toString()}` : '/items'

  const loadedItems = await handleResponse<Item[]>(await apiFetch(url))

  const search = filters.query?.trim().toLowerCase()

  if (!search) {
    return loadedItems
  }

  return loadedItems.filter((item) => {
    return (
      item.title.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.location.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      item.user.name.toLowerCase().includes(search) ||
      item.user.email.toLowerCase().includes(search)
    )
  })
}