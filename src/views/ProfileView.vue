<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { updateProfile } from '../services/profileService'
import { useAuthStore } from '../stores/authStores'

const authStore = useAuthStore()

const isSaving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  name: '',
  email: '',
  displayColor: '#2563eb',
})

const currentInitial = computed(() => {
  return form.name.trim().charAt(0).toUpperCase() || '?'
})

function loadCurrentProfile() {
  if (!authStore.currentUser) {
    return
  }

  form.name = authStore.currentUser.name
  form.email = authStore.currentUser.email
  form.displayColor = authStore.currentUser.displayColor || '#2563eb'
}

async function submitProfile() {
  successMessage.value = ''
  errorMessage.value = ''

  if (!form.name.trim() || !form.email.trim()) {
    errorMessage.value = 'Bitte fülle Name und E-Mail aus.'
    return
  }

  if (!form.email.includes('@')) {
    errorMessage.value = 'Bitte gib eine gültige E-Mail-Adresse ein.'
    return
  }

  isSaving.value = true

  try {
    const updatedProfile = await updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      displayColor: form.displayColor,
    })

    authStore.updateCurrentUser({
      id: updatedProfile.id,
      name: updatedProfile.name,
      email: updatedProfile.email,
      role: updatedProfile.role,
      displayColor: updatedProfile.displayColor,
    })

    form.name = updatedProfile.name
    form.email = updatedProfile.email
    form.displayColor = updatedProfile.displayColor

    successMessage.value = 'Profil wurde gespeichert.'
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Profil konnte nicht gespeichert werden.'
  } finally {
    isSaving.value = false
  }
}

onMounted(loadCurrentProfile)
</script>

<template>
  <section class="page-section profile-page">
    <div class="container profile-layout">
      <div>
        <p class="eyebrow">Mein Profil</p>
        <h1 class="section-title">Profil bearbeiten</h1>
        <p class="section-subtitle">
          Passe deinen Namen, deine Kontakt-E-Mail und die Anzeigefarbe deines Namens an.
        </p>
      </div>

      <div class="profile-grid">
        <article class="card profile-preview">
          <div class="avatar-preview" :style="{ backgroundColor: form.displayColor }">
            {{ currentInitial }}
          </div>

          <h2 :style="{ color: form.displayColor }">
            {{ form.name || 'Dein Name' }}
          </h2>

          <p>{{ form.email || 'deine.mail@example.com' }}</p>

          <span class="role-pill">
            {{ authStore.currentUser?.role === 'ADMIN' ? 'Admin' : 'Nutzer' }}
          </span>
        </article>

        <form class="card profile-form" @submit.prevent="submitProfile">
          <div v-if="successMessage" class="success-box">
            {{ successMessage }}
          </div>

          <div v-if="errorMessage" class="error-box">
            {{ errorMessage }}
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label for="profile-name">Name</label>
              <input
                id="profile-name"
                v-model="form.name"
                type="text"
                placeholder="Dein Name"
              />
            </div>

            <div class="form-group full-width">
              <label for="profile-email">E-Mail</label>
              <input
                id="profile-email"
                v-model="form.email"
                type="email"
                placeholder="deine.mail@example.com"
              />
            </div>

            <div class="form-group full-width">
              <label for="profile-color">Anzeigefarbe</label>

              <div class="color-row">
                <input
                  id="profile-color"
                  v-model="form.displayColor"
                  type="color"
                />

                <input
                  v-model="form.displayColor"
                  type="text"
                  placeholder="#2563eb"
                />
              </div>
            </div>
          </div>

          <div class="actions form-actions">
            <button type="submit" class="btn-primary" :disabled="isSaving">
              {{ isSaving ? 'Wird gespeichert...' : 'Profil speichern' }}
            </button>

            <RouterLink to="/items" class="btn-secondary">
              Zurück zu den Einträgen
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-page {
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 28%),
    linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.profile-layout {
  display: grid;
  gap: 32px;
}

.profile-grid {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.profile-preview {
  display: grid;
  justify-items: center;
  gap: 12px;
  text-align: center;
}

.avatar-preview {
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  color: white;
  font-size: 2.2rem;
  font-weight: 900;
  box-shadow: var(--shadow-md);
}

.profile-preview h2 {
  margin: 8px 0 0;
}

.profile-preview p {
  margin: 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.role-pill {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: var(--primary);
  font-weight: 900;
}

.profile-form {
  max-width: 720px;
}

.color-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
}

.color-row input[type='color'] {
  min-height: 54px;
  padding: 6px;
  cursor: pointer;
}

.success-box,
.error-box {
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  font-weight: 800;
}

.success-box {
  border: 1px solid #bbf7d0;
  background: #dcfce7;
  color: #166534;
}

.error-box {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

@media (max-width: 850px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-form {
    max-width: none;
  }
}
</style>