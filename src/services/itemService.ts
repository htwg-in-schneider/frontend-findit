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

let items: Item[] = [
  {
    id: 1,
    title: 'Kopfhörer',
    description: 'Schwarze Bluetooth-Kopfhörer in der Bibliothek gefunden.',
    type: 'FOUND',
    category: 'Elektronik',
    location: 'Bibliothek',
    date: '2026-04-01',
    status: 'OPEN',
    user: {
      id: 1,
      name: 'Max Mustermann',
      email: 'max@example.com',
    },
  },
  {
    id: 2,
    title: 'Rucksack',
    description: 'Blauer Rucksack mit Laptopfach in der Mensa verloren.',
    type: 'LOST',
    category: 'Tasche',
    location: 'Mensa',
    date: '2026-04-02',
    status: 'IN_PROGRESS',
    user: {
      id: 2,
      name: 'Dennis Müller',
      email: 'dennis@example.com',
    },
  },
]

export const users: User[] = [
  {
    id: 1,
    name: 'Max Mustermann',
    email: 'max@example.com',
  },
  {
    id: 2,
    name: 'Dennis Müller',
    email: 'dennis@example.com',
  },
]

export function getItems() {
  return [...items]
}

export function getItemById(id: number) {
  return items.find((item) => item.id === id)
}

export function createItem(input: ItemInput) {
  const user = users.find((user) => user.id === input.userId) ?? users[0]

  const newItem: Item = {
    id: Math.max(0, ...items.map((item) => item.id)) + 1,
    title: input.title,
    description: input.description,
    type: input.type,
    category: input.category,
    location: input.location,
    date: input.date,
    status: input.status,
    user,
  }

  items = [newItem, ...items]
  return newItem
}

export function updateItem(id: number, input: ItemInput) {
  const user = users.find((user) => user.id === input.userId) ?? users[0]

  items = items.map((item) =>
    item.id === id
      ? {
          ...item,
          title: input.title,
          description: input.description,
          type: input.type,
          category: input.category,
          location: input.location,
          date: input.date,
          status: input.status,
          user,
        }
      : item,
  )

  return getItemById(id)
}

export function deleteItem(id: number) {
  items = items.filter((item) => item.id !== id)
}

export function searchAndFilterItems(options: {
  query?: string
  type?: string
  category?: string
  status?: string
}) {
  const query = options.query?.trim().toLowerCase() ?? ''

  return items.filter((item) => {
    const matchesQuery =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query)

    const matchesType = !options.type || item.type === options.type
    const matchesCategory = !options.category || item.category === options.category
    const matchesStatus = !options.status || item.status === options.status

    return matchesQuery && matchesType && matchesCategory && matchesStatus
  })
}