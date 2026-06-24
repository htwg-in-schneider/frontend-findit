<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import Auth0Bridge from './components/Auth0Bridge.vue'
import { AUTH0_LOGOUT_RETURN_TO, AUTH_ENABLED } from './config/auth'
import { useAuthStore } from './stores/authStores'

const authStore = useAuthStore()
const auth0 = AUTH_ENABLED ? useAuth0() : null

const isLoggedIn = computed(() => {
  if (AUTH_ENABLED) {
    return auth0?.isAuthenticated.value ?? false
  }

  return authStore.isAuthenticated
})

const shownName = computed(() => {
  if (authStore.currentUser) {
    return authStore.currentUser.name
  }

  const auth0User = auth0?.user.value

  if (auth0User?.name) {
    return auth0User.name
  }

  if (auth0User?.email) {
    return auth0User.email
  }

  return 'Angemeldet'
})

function logout() {
  authStore.logout()

  if (AUTH_ENABLED && auth0) {
    auth0.logout({
      logoutParams: {
        returnTo: AUTH0_LOGOUT_RETURN_TO,
      },
    })
  }
}
</script>

<template>
  <div class="app">
    <Auth0Bridge v-if="AUTH_ENABLED" />

    <header class="site-header">
      <div class="container nav-container">
        <RouterLink to="/" class="logo" aria-label="findIT Startseite">
          <span class="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img">
              <defs>
                <linearGradient id="findit-pin-gradient" x1="12" y1="8" x2="52" y2="58">
                  <stop offset="0%" stop-color="#38bdf8" />
                  <stop offset="45%" stop-color="#2563eb" />
                  <stop offset="100%" stop-color="#1d4ed8" />
                </linearGradient>
              </defs>

              <path
                d="M32 4C19.85 4 10 13.85 10 26c0 16.4 22 34 22 34s22-17.6 22-34C54 13.85 44.15 4 32 4Z"
                fill="url(#findit-pin-gradient)"
              />

              <circle cx="32" cy="26" r="12" fill="white" />
              <circle cx="32" cy="26" r="6" fill="#2563eb" />
              <ellipse cx="32" cy="60" rx="15" ry="3.2" fill="#bfdbfe" />
            </svg>
          </span>

          <span class="logo-word">
            find<span class="logo-highlight">IT</span>
          </span>
        </RouterLink>

        <nav class="main-nav">
          <RouterLink to="/">Startseite</RouterLink>
          <RouterLink to="/items">Einträge</RouterLink>
          <RouterLink to="/map">Karte</RouterLink>
          <RouterLink v-if="authStore.isAdmin" to="/admin">Admin</RouterLink>
          <RouterLink :to="{ path: '/', hash: '#kontakt' }">Kontakt</RouterLink>
          <RouterLink to="/items/new" class="nav-button">Gegenstand melden</RouterLink>

          <RouterLink v-if="!isLoggedIn" to="/login" class="login-link">
            Login
          </RouterLink>

          <div v-else class="auth-pill">
            <span>{{ shownName }}</span>
            <button type="button" @click="logout">Logout</button>
          </div>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="container footer-content">
        <p>© 2026 findIT – Verlorene und gefundene Gegenstände auf dem Campus.</p>

        <div class="footer-links">
          <RouterLink to="/impressum">Impressum</RouterLink>
          <RouterLink to="/datenschutz">Datenschutz</RouterLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.login-link {
  font-weight: 900;
  color: var(--primary);
}

.auth-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: white;
  box-shadow: var(--shadow-sm);
}

.auth-pill span {
  max-width: 150px;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auth-pill button {
  border: none;
  border-radius: 999px;
  padding: 8px 12px;
  background: #eff6ff;
  color: var(--primary);
  font-weight: 900;
  cursor: pointer;
}

.auth-pill button:hover {
  background: #dbeafe;
}

@media (max-width: 850px) {
  .auth-pill {
    width: 100%;
    justify-content: space-between;
  }

  .auth-pill span {
    max-width: none;
  }
}
</style>