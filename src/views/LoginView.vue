<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRoute } from 'vue-router'
import {
  AUTH0_AUDIENCE,
  AUTH0_REDIRECT_URI,
  AUTH_CONFIGURATION_INCOMPLETE,
  AUTH_ENABLED,
} from '../config/auth'
import { useAuthStore } from '../stores/authStores'

const route = useRoute()
const authStore = useAuthStore()

const auth0 = AUTH_ENABLED ? useAuth0() : null

const loginError = ref('')

const redirectTarget = computed(() => {
  const redirect = route.query.redirect

  return typeof redirect === 'string' ? redirect : '/items'
})

const auth0IsLoading = computed(() => auth0?.isLoading.value ?? false)
const auth0IsAuthenticated = computed(() => auth0?.isAuthenticated.value ?? false)

async function loginWithAuth0() {
  await startAuth0Flow()
}

async function registerWithAuth0() {
  await startAuth0Flow('signup')
}

async function startAuth0Flow(screenHint?: 'signup') {
  loginError.value = ''

  if (!AUTH_ENABLED) {
    loginError.value = 'Authentifizierung ist deaktiviert. Bitte VITE_AUTH_ENABLED=true setzen.'
    return
  }

  if (AUTH_CONFIGURATION_INCOMPLETE) {
    loginError.value = 'Auth0 ist nicht vollständig konfiguriert. Domain oder Client-ID fehlt.'
    return
  }

  if (!auth0) {
    loginError.value = 'Auth0 konnte nicht initialisiert werden.'
    return
  }

  try {
    await auth0.loginWithRedirect({
      appState: {
        target: redirectTarget.value,
      },
      authorizationParams: {
        audience: AUTH0_AUDIENCE || undefined,
        redirect_uri: AUTH0_REDIRECT_URI,
        screen_hint: screenHint,
        prompt: 'login',
      },
    })
  } catch (error) {
    console.error(error)
    loginError.value = 'Die Weiterleitung zu Auth0 konnte nicht gestartet werden.'
  }
}

function roleLabel(role: string) {
  return role === 'ADMIN' ? 'Admin' : 'Nutzer'
}
</script>

<template>
  <section class="login-page">
    <div class="container login-layout">
      <div class="login-intro">
        <p class="eyebrow">findIT Login</p>
        <h1 class="section-title">Einloggen oder Konto erstellen</h1>
        <p class="section-subtitle">
          Melde dich mit deinem findIT-Konto an oder erstelle ein neues Konto.
          Nach dem Login kannst du Gegenstände melden und eigene Einträge verwalten.
        </p>
      </div>

      <div class="card login-card">
        <div v-if="loginError" class="config-warning">
          {{ loginError }}
        </div>

        <div v-if="AUTH_CONFIGURATION_INCOMPLETE" class="config-warning">
          Auth0 ist aktiviert, aber Domain oder Client-ID fehlen noch in den Environment Variables.
        </div>

        <div v-if="!AUTH_ENABLED" class="config-warning">
          Authentifizierung ist aktuell deaktiviert. Setze
          <strong>VITE_AUTH_ENABLED=true</strong>, um den produktiven Login zu verwenden.
        </div>

        <div v-if="authStore.isAuthenticated && authStore.currentUser" class="current-user-box">
          <div class="user-avatar">
            {{ authStore.currentUser.name.charAt(0).toUpperCase() }}
          </div>

          <div>
            <p>Aktuell eingeloggt als</p>
            <strong>{{ authStore.currentUser.name }}</strong>
            <span>{{ roleLabel(authStore.currentUser.role) }}</span>
          </div>
        </div>

        <div>
          <h2>Anmeldung</h2>
          <p class="login-hint">
            Die Anmeldung und Registrierung erfolgt sicher über Auth0. findIT speichert keine
            Passwörter in der eigenen Anwendung.
          </p>
        </div>

        <div class="auth0-actions">
          <button
            type="button"
            class="btn-primary"
            :disabled="auth0IsLoading || auth0IsAuthenticated || !AUTH_ENABLED"
            @click="loginWithAuth0"
          >
            {{
              auth0IsLoading
                ? 'Login wird geprüft...'
                : auth0IsAuthenticated
                  ? 'Bereits eingeloggt'
                  : 'Einloggen'
            }}
          </button>

          <button
            type="button"
            class="btn-secondary"
            :disabled="auth0IsLoading || auth0IsAuthenticated || !AUTH_ENABLED"
            @click="registerWithAuth0"
          >
            Konto erstellen
          </button>
        </div>
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
  border: 1px solid #fecaca;
  border-radius: 16px;
  background: #fef2f2;
  color: #991b1b;
  font-weight: 800;
  line-height: 1.5;
}

.current-user-box {
  display: grid;
  grid-template-columns: auto 1fr;
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

.auth0-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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

@media (max-width: 900px) {
  .login-layout {
    grid-template-columns: 1fr;
  }

  .current-user-box {
    grid-template-columns: 1fr;
  }

  .auth0-actions,
  .auth0-actions button {
    width: 100%;
  }
}
</style>