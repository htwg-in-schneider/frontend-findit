import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createAuth0 } from '@auth0/auth0-vue'

import App from './App.vue'
import router from './router'
import {
  AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID,
  AUTH0_DOMAIN,
  AUTH0_REDIRECT_URI,
  AUTH_ENABLED,
} from './config/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

if (AUTH_ENABLED) {
  app.use(
    createAuth0({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: AUTH0_REDIRECT_URI,
        audience: AUTH0_AUDIENCE || undefined,
      },
    }),
  )
}

app.mount('#app')