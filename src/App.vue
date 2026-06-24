<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import Auth0Bridge from './components/Auth0Bridge.vue'
import { AUTH0_LOGOUT_RETURN_TO, AUTH_ENABLED } from './config/auth'
import { useAuthStore } from './stores/authStores'

const router = useRouter()
const authStore = useAuthStore()

const auth0 = AUTH_ENABLED ? useAuth0() : null

function logout() {
  authStore.logout()

  if (AUTH_ENABLED && auth0) {
    auth0.logout({
      logoutParams: {
        returnTo: AUTH0_LOGOUT_RETURN_TO,
      },
    })
    return
  }

  router.push('/')
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

              <path
                d="M43.5 16.5C47 20.2 48.2 25.6 46.4 30.4"
                fill="none"
                stroke="white"
                stroke-width="4"
                stroke-linecap="round"
                opacity="0.75"
              />

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

          <RouterLink v-if="!authStore.isAuthenticated" to="/login" class="login-link">
            Login
          </RouterLink>

          <div v-else class="auth-pill">
            <span>{{ authStore.displayName }}</span>
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