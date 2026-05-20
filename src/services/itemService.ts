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
  date: string
  status: ItemStatus
  userId: number
}

const API_URL = 'http://localhost:8080/api/items'

export const users: User[] = [
  {
    id: 1,
    name: 'Max Mustermann',
    email: 'max.mustermann@htwg-konstanz.de',
  },
  {
    id: 2,
    name: 'Dennis Müller',
    email: 'dennis.mueller@htwg-konstanz.de',
  },
]

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json()
}

export async function getItems(): Promise<Item[]> {
  return handleResponse<Item[]>(await fetch(API_URL))
}

export async function getItemById(id: number): Promise<Item> {
  return handleResponse<Item>(await fetch(`${API_URL}/${id}`))
}

export async function createItem(input: ItemInput): Promise<Item> {
  return handleResponse<Item>(
    await fetch(API_URL, {
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
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }),
  )
}

export async function deleteItem(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }
}

export async function searchAndFilterItems(options: {
  query?: string
  type?: string
  category?: string
  status?: string
}): Promise<Item[]> {
  const params = new URLSearchParams()

  if (options.type) {
    params.append('type', options.type)
  }

  if (options.category) {
    params.append('category', options.category)
  }

  if (options.status) {
    params.append('status', options.status)
  }

  const hasFilters = params.toString().length > 0

  if (hasFilters) {
    return handleResponse<Item[]>(await fetch(`${API_URL}/filter?${params.toString()}`))
  }

  if (options.query?.trim()) {
    params.append('query', options.query.trim())
    return handleResponse<Item[]>(await fetch(`${API_URL}/search?${params.toString()}`))
  }

  return getItems()
}