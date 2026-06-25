<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { AUTH0_AUDIENCE } from '../config/auth'
import { getProfile } from '../services/profileService'
import { setAccessTokenProvider } from '../services/authTokenService'
import { useAuthStore } from '../stores/authStores'

const auth0 = useAuth0()
const authStore = useAuthStore()

setAccessTokenProvider(async () => {
  if (!auth0.isAuthenticated.value) {
    return null
  }

  return auth0.getAccessTokenSilently({
    authorizationParams: {
      audience: AUTH0_AUDIENCE || undefined,
    },
  })
})

async function syncBackendProfile() {
  if (auth0.isLoading.value) {
    authStore.setExternalAuthState(false, false)
    return
  }

  authStore.setExternalAuthState(true, auth0.isAuthenticated.value)

  if (!auth0.isAuthenticated.value) {
    authStore.clearExternalUser()
    authStore.setExternalSyncing(false)
    return
  }

  authStore.setExternalSyncing(true)

  try {
    const profile = await getProfile()

    authStore.setExternalUser({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      displayColor: profile.displayColor,
    })
  } catch (error) {
    console.error('Backend-Profil konnte nicht geladen werden:', error)
    authStore.clearExternalUser()
  } finally {
    authStore.setExternalSyncing(false)
  }
}

watch(
  [auth0.isLoading, auth0.isAuthenticated],
  () => {
    syncBackendProfile()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  setAccessTokenProvider(null)
})
</script>

<template>
  <span class="auth0-bridge" aria-hidden="true"></span>
</template>

<style scoped>
.auth0-bridge {
  display: none;
}
</style>