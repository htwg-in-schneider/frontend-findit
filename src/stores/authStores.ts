import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
}

const STORAGE_KEY = 'findit-auth-user'

const demoUsers: AuthUser[] = [
  {
    id: 1,
    name: 'Max Mustermann',
    email: 'max.mustermann@htwg-konstanz.de',
    role: 'USER',
  },
  {
    id: 2,
    name: 'Dennis Müller',
    email: 'dennis.mueller@htwg-konstanz.de',
    role: 'USER',
  },
  {
    id: 99,
    name: 'Admin findIT',
    email: 'admin@findit.htwg-konstanz.de',
    role: 'ADMIN',
  },
]

function loadStoredUser() {
  const storedUser = localStorage.getItem(STORAGE_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthUser | null>(loadStoredUser())

  const users = computed(() => demoUsers)
  const isAuthenticated = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')
  const displayName = computed(() => currentUser.value?.name ?? 'Gast')

  function login(userId: number) {
    const selectedUser = demoUsers.find((user) => user.id === userId)

    if (!selectedUser) {
      return
    }

    currentUser.value = selectedUser
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedUser))
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    currentUser,
    users,
    isAuthenticated,
    isAdmin,
    displayName,
    login,
    logout,
  }
})