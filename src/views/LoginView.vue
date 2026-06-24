<script setup lang="ts">
import { computed } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AUTH0_AUDIENCE,
  AUTH_CONFIGURATION_INCOMPLETE,
  AUTH_ENABLED,
} from '../config/auth'
import { useAuthStore, type AuthUser } from '../stores/authStores'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const auth0 = AUTH_ENABLED ? useAuth0() : null

const redirectTarget = computed(() => {
  const redirect = route.query.redirect

  return typeof redirect === 'string' ? redirect : '/items'
})

const auth0IsLoading = computed(() => auth0?.isLoading.value ?? false)
const auth0IsAuthenticated = computed(() => auth0?.isAuthenticated.value ?? false)

function login(user: AuthUser) {
  authStore.login(user.id)
  router.push(redirectTarget.value)
}

function loginWithAuth0() {
  if (!auth0) {
    return
  }

  if (AUTH0_AUDIENCE) {
    auth0.loginWithRedirect({
      appState: {
        target: redirectTarget.value,
      },
      authorizationParams: {
        audience: AUTH0_AUDIENCE,
      },
    })
    return
  }

  auth0.loginWithRedirect({
    appState: {
      target: redirectTarget.value,
    },
  })
}

function logout() {
  authStore.logout()

  if (auth0) {
    auth0.logout({
      logoutParams: {
        returnTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    })
  }
}

function roleLabel(role: AuthUser['role']) {
  return role === 'ADMIN' ? 'Admin' : 'Nutzer'
}
</script>

<template>
  <section class="login-page">
    <div class="container login-layout">
      <div class="login-intro">
        <p class="eyebrow">findIT Login</p>
        <h1 class="section-title">Einloggen und findIT nutzen</h1>
        <p class="section-subtitle">
          Melde dich an, um Gegenstände zu melden und eigene Einträge zu verwalten.
          Admins erhalten zusätzlich Zugriff auf Nutzer, Kategorien und Kontaktanfragen.
        </p>
      </div>

      <div class="card login-card">
        <div v-if="AUTH_CONFIGURATION_INCOMPLETE" class="config-warning">
          Auth0 ist aktiviert, aber Domain oder Client-ID fehlen noch in den Environment Variables.
        </div>

        <template v-if="AUTH_ENABLED">
          <div v-if="authStore.isAuthenticated && authStore.currentUser" class="current-user-box">
            <div class="user-avatar">
              {{ authStore.currentUser.name.charAt(0).toUpperCase() }}
            </div>

            <div>
              <p>Aktuell eingeloggt als</p>
              <strong>{{ authStore.currentUser.name }}</strong>
              <span>{{ roleLabel(authStore.currentUser.role) }}</span>
            </div>

            <button type="button" class="btn-secondary" @click="logout">
              Ausloggen
            </button>
          </div>

          <div>
            <h2>Login mit Auth0</h2>
            <p class="login-hint">
              Du wirst zur Auth0-Anmeldeseite weitergeleitet. Nach erfolgreichem Login wird dein
              Backend-Profil geladen.
            </p>
          </div>

          <button
            type="button"
            class="btn-primary auth0-login-button"
            :disabled="auth0IsLoading || auth0IsAuthenticated"
            @click="loginWithAuth0"
          >
            {{
              auth0IsLoading
                ? 'Login wird geprüft...'
                : auth0IsAuthenticated
                  ? 'Bereits eingeloggt'
                  : 'Mit Auth0 einloggen'
            }}
          </button>
        </template>

        <template v-else>
          <div v-if="authStore.isAuthenticated && authStore.currentUser" class="current-user-box">
            <div class="user-avatar">
              {{ authStore.currentUser.name.charAt(0).toUpperCase() }}
            </div>

            <div>
              <p>Aktuell eingeloggt als</p>
              <strong>{{ authStore.currentUser.name }}</strong>
              <span>{{ roleLabel(authStore.currentUser.role) }}</span>
            </div>

            <button type="button" class="btn-secondary" @click="logout">
              Ausloggen
            </button>
          </div>

          <div>
            <h2>Demo-Zugang wählen</h2>
            <p class="login-hint">
              Für die lokale Entwicklung kannst du einen Demo-Zugang auswählen.
            </p>
          </div>

          <div class="user-list">
            <article
              v-for="user in authStore.users"
              :key="user.id"
              class="user-option"
              :class="{ admin: user.role === 'ADMIN' }"
            >
              <div class="user-avatar">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>

              <div class="user-info">
                <h3>{{ user.name }}</h3>
                <p>{{ user.email }}</p>
                <span>{{ roleLabel(user.role) }}</span>
              </div>

              <button type="button" class="btn-primary" @click="login(user)">
                Einloggen
              </button>
            </article>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-page {
  min-height: calc(100vh - 76px);
  padding: 72px 0;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 32%),
    linear-gradient(135deg, #f8fafc 0%, #ffffff 48%, #eff6ff 100%);
}

.login-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
  gap: 36px;
  align-items: start;
}

.login-card {
  display: grid;
  gap: 24px;
}

.login-card h2 {
  margin: 0 0 8px;
}

.login-hint {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.config-warning {
  padding: 14px 16px;
  border: 1px solid #fed7aa;
  border-radius: 16px;
  background: #fff7ed;
  color: #9a3412;
  font-weight: 800;
}

.current-user-box {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 18px;
  border-radius: 20px;
  background: #eff6ff;
}

.current-user-box p {
  margin: 0 0 4px;
  color: var(--muted);
  font-weight: 800;
}

.current-user-box strong {
  display: block;
}

.current-user-box span {
  color: var(--primary);
  font-weight: 900;
}

.user-list {
  display: grid;
  gap: 16px;
}

.user-option {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: white;
}

.user-option.admin {
  border-color: rgba(37, 99, 235, 0.35);
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
}

.user-avatar {
  width: 58px;
  height: 58px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  background: var(--primary);
  color: white;
  font-size: 1.5rem;
  font-weight: 900;
}

.user-info {
  min-width: 0;
}

.user-info h3 {
  margin: 0 0 4px;
}

.user-info p {
  margin: 0 0 8px;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.user-info span {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 900;
}

.user-option.admin .user-info span {
  background: #dbeafe;
  color: #1e40af;
}

.auth0-login-button {
  width: fit-content;
}

@media (max-width: 900px) {
  .login-layout {
    grid-template-columns: 1fr;
  }

  .user-option,
  .current-user-box {
    grid-template-columns: 1fr;
  }

  .user-option button,
  .current-user-box button,
  .auth0-login-button {
    width: 100%;
  }
}
</style>