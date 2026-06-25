import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AUTH_ENABLED } from '../config/auth'

export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  displayColor: string
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthUser | null>(null)
  const isSyncingExternalUser = ref(false)
  const externalAuthLoaded = ref(!AUTH_ENABLED)
  const externalAuthAuthenticated = ref(false)

  const isAuthenticated = computed(() => {
    if (AUTH_ENABLED) {
      return externalAuthAuthenticated.value
    }

    return currentUser.value !== null
  })

  const hasBackendProfile = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

  const displayName = computed(() => {
    if (currentUser.value) {
      return currentUser.value.name
    }

    if (externalAuthAuthenticated.value) {
      return 'Angemeldet'
    }

    return 'Gast'
  })

  const displayColor = computed(() => {
    return currentUser.value?.displayColor || '#2563eb'
  })

  function setExternalAuthState(isLoaded: boolean, isAuthenticated: boolean) {
    externalAuthLoaded.value = isLoaded
    externalAuthAuthenticated.value = isAuthenticated
  }

  function logout() {
    currentUser.value = null
    externalAuthAuthenticated.value = false
  }

  function setExternalUser(user: AuthUser) {
    currentUser.value = {
      ...user,
      displayColor: user.displayColor || '#2563eb',
    }
    externalAuthAuthenticated.value = true
  }

  function updateCurrentUser(user: AuthUser) {
    currentUser.value = {
      ...user,
      displayColor: user.displayColor || '#2563eb',
    }
  }

  function clearExternalUser() {
    currentUser.value = null
  }

  function setExternalSyncing(isSyncing: boolean) {
    isSyncingExternalUser.value = isSyncing
  }

  return {
    currentUser,
    isSyncingExternalUser,
    externalAuthLoaded,
    externalAuthAuthenticated,
    isAuthenticated,
    hasBackendProfile,
    isAdmin,
    displayName,
    displayColor,
    setExternalAuthState,
    logout,
    setExternalUser,
    updateCurrentUser,
    clearExternalUser,
    setExternalSyncing,
  }
})