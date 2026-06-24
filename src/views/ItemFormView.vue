<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import { AUTH_ENABLED } from '../config/auth'
import { getCategories, type Category } from '../services/categoryService'
import { getUsers } from '../services/userService'
import {
  ApiError,
  createItem,
  getItemById,
  updateItem,
  type ItemInput,
  type ItemStatus,
  type ItemType,
  type User,
} from '../services/itemService'
import { useAuthStore } from '../stores/authStores'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const auth0 = AUTH_ENABLED ? useAuth0() : null

const isLoading = ref(false)
const isLoadingCategories = ref(false)
const isLoadingUsers = ref(false)

const loadErrorMessage = ref('')
const saveErrorMessage = ref('')
const isUnauthorized = ref(false)

const categories = ref<Category[]>([])
const reporterOptions = ref<User[]>([])
const loadedReporter = ref<User | null>(null)

const fallbackCategories = [
  'Elektronik',
  'Tasche',
  'Dokumente',
  'Kleidung',
  'Schlüssel',
  'Sonstiges',
]

const fieldErrors = reactive({
  title: '',
  description: '',
  category: '',
  location: '',
  date: '',
  userId: '',
})

function getTodayString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const todayString = getTodayString()

const itemId = computed(() => {
  const id = route.params.id

  if (!id) {
    return null
  }

  return Number(id)
})

const isEditMode = computed(() => itemId.value !== null)
const canChooseReporter = computed(() => authStore.isAdmin)

const isAuth0Authenticated = computed(() => {
  if (!AUTH_ENABLED) {
    return authStore.isAuthenticated
  }

  return auth0?.isAuthenticated.value ?? authStore.externalAuthAuthenticated
})

const isWaitingForBackendProfile = computed(() => {
  return (
    AUTH_ENABLED &&
    isAuth0Authenticated.value &&
    !authStore.currentUser &&
    authStore.isSyncingExternalUser
  )
})

const hasMissingBackendProfile = computed(() => {
  return (
    AUTH_ENABLED &&
    isAuth0Authenticated.value &&
    !authStore.currentUser &&
    !authStore.isSyncingExternalUser
  )
})

const fallbackAuth0Reporter = computed<User | null>(() => {
  const auth0User = auth0?.user.value

  if (!auth0User) {
    return null
  }

  return {
    id: 0,
    name: auth0User.name || auth0User.nickname || 'Angemeldeter Nutzer',
    email: auth0User.email || '',
  }
})

const form = reactive<ItemInput>({
  title: '',
  description: '',
  type: 'FOUND',
  category: 'Elektronik',
  location: '',
  date: todayString,
  status: 'OPEN',
  userId: authStore.currentUser?.id ?? 0,
})

const selectedReporter = computed<User | null>(() => {
  const backendUser = reporterOptions.value.find((user) => user.id === form.userId)

  if (backendUser) {
    return backendUser
  }

  if (loadedReporter.value && loadedReporter.value.id === form.userId) {
    return loadedReporter.value
  }

  if (authStore.currentUser) {
    return {
      id: authStore.currentUser.id,
      name: authStore.currentUser.name,
      email: authStore.currentUser.email,
    }
  }

  return fallbackAuth0Reporter.value
})

const categoryOptions = computed(() => {
  const backendCategoryNames = categories.value
    .map((category) => category.name)
    .filter(Boolean)

  const baseOptions =
    backendCategoryNames.length > 0 ? backendCategoryNames : fallbackCategories

  const uniqueOptions = [...new Set(baseOptions)]

  if (form.category && !uniqueOptions.includes(form.category)) {
    uniqueOptions.unshift(form.category)
  }

  return uniqueOptions.sort((first, second) => first.localeCompare(second))
})

const pageTitle = computed(() => {
  return isEditMode.value ? 'Gegenstand bearbeiten' : 'Gegenstand melden'
})

const pageDescription = computed(() => {
  return isEditMode.value
    ? 'Passe die Daten des Eintrags an. Änderungen werden direkt im Backend gespeichert.'
    : 'Erfasse einen verlorenen oder gefundenen Gegenstand mit den wichtigsten Informationen.'
})

const submitButtonDisabled = computed(() => {
  return isLoading.value || isWaitingForBackendProfile.value || hasMissingBackendProfile.value
})

function syncReporterWithLogin() {
  if (!authStore.currentUser) {
    return
  }

  if (!canChooseReporter.value) {
    form.userId = authStore.currentUser.id
    return
  }

  if (!form.userId) {
    form.userId = authStore.currentUser.id
  }
}

function checkEditPermission() {
  if (!isEditMode.value) {
    return
  }

  if (!loadedReporter.value) {
    return
  }

  if (canChooseReporter.value) {
    isUnauthorized.value = false
    return
  }

  if (!authStore.currentUser) {
    return
  }

  if (authStore.currentUser.id !== loadedReporter.value.id) {
    isUnauthorized.value = true
    loadErrorMessage.value =
      'Du darfst diesen Eintrag nicht bearbeiten, weil er von einem anderen Nutzer gemeldet wurde.'
  } else {
    isUnauthorized.value = false
    loadErrorMessage.value = ''
  }
}

async function loadCategories() {
  isLoadingCategories.value = true

  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error(error)
    categories.value = []
  } finally {
    isLoadingCategories.value = false
  }
}

async function loadReporterOptions() {
  if (!canChooseReporter.value) {
    reporterOptions.value = []
    return
  }

  isLoadingUsers.value = true

  try {
    const users = await getUsers()

    reporterOptions.value = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }))

    const firstReporter = reporterOptions.value[0]

    if (!form.userId && firstReporter) {
      form.userId = authStore.currentUser?.id ?? firstReporter.id
    }
  } catch (error) {
    console.error(error)
    reporterOptions.value = []
  } finally {
    isLoadingUsers.value = false
  }
}

async function loadExistingItem() {
  if (!isEditMode.value || itemId.value === null) {
    return
  }

  isLoading.value = true
  loadErrorMessage.value = ''
  saveErrorMessage.value = ''
  isUnauthorized.value = false
  clearFieldErrors()

  try {
    const item = await getItemById(itemId.value)

    loadedReporter.value = item.user

    form.title = item.title
    form.description = item.description
    form.type = item.type
    form.category = item.category
    form.location = item.location
    form.date = item.date
    form.status = item.status
    form.userId = item.user.id

    checkEditPermission()
  } catch (error) {
    console.error(error)
    loadErrorMessage.value = 'Der Eintrag konnte nicht geladen werden.'
  } finally {
    isLoading.value = false
  }
}

function clearFieldErrors() {
  fieldErrors.title = ''
  fieldErrors.description = ''
  fieldErrors.category = ''
  fieldErrors.location = ''
  fieldErrors.date = ''
  fieldErrors.userId = ''
}

function validateDateField() {
  fieldErrors.date = ''

  if (!form.date) {
    fieldErrors.date = 'Bitte wähle ein Datum aus.'
    return false
  }

  if (form.date > todayString) {
    fieldErrors.date = 'Datum darf nicht in der Zukunft liegen.'
    return false
  }

  return true
}

function validateForm() {
  clearFieldErrors()
  syncReporterWithLogin()

  if (!isAuth0Authenticated.value) {
    fieldErrors.userId = 'Bitte melde dich zuerst an.'
  }

  if (hasMissingBackendProfile.value) {
    fieldErrors.userId =
      'Dein Backend-Profil konnte noch nicht geladen werden. Bitte lade die Seite neu oder prüfe die Auth0-Claims.'
  }

  if (!form.title.trim()) {
    fieldErrors.title = 'Bitte gib einen Titel ein.'
  }

  if (!form.description.trim()) {
    fieldErrors.description = 'Bitte gib eine Beschreibung ein.'
  }

  if (!form.category.trim()) {
    fieldErrors.category = 'Bitte wähle eine Kategorie aus.'
  }

  if (!form.location.trim()) {
    fieldErrors.location = 'Bitte gib einen Ort ein.'
  }

  if (!AUTH_ENABLED && !form.userId) {
    fieldErrors.userId = 'Bitte wähle einen meldenden Nutzer aus.'
  }

  if (AUTH_ENABLED && authStore.currentUser && !form.userId) {
    form.userId = authStore.currentUser.id
  }

  validateDateField()

  return Object.values(fieldErrors).every((message) => !message)
}

function applyBackendFieldErrors(error: ApiError) {
  if (error.fieldErrors.title) {
    fieldErrors.title = error.fieldErrors.title
  }

  if (error.fieldErrors.description) {
    fieldErrors.description = error.fieldErrors.description
  }

  if (error.fieldErrors.category) {
    fieldErrors.category = error.fieldErrors.category
  }

  if (error.fieldErrors.location) {
    fieldErrors.location = error.fieldErrors.location
  }

  if (error.fieldErrors.date) {
    fieldErrors.date = error.fieldErrors.date
  }

  if (error.fieldErrors.userId) {
    fieldErrors.userId = error.fieldErrors.userId
  }
}

async function submitForm() {
  saveErrorMessage.value = ''

  if (isWaitingForBackendProfile.value) {
    saveErrorMessage.value = 'Dein Profil wird noch geladen. Bitte warte einen Moment.'
    return
  }

  if (!validateForm()) {
    saveErrorMessage.value = 'Bitte prüfe die markierten Felder.'
    return
  }

  isLoading.value = true

  try {
    const cleanedInput: ItemInput = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      userId:
        canChooseReporter.value && form.userId
          ? form.userId
          : authStore.currentUser?.id ?? form.userId,
    }

    const inputForBackend: ItemInput = {
      ...cleanedInput,
      userId: cleanedInput.userId || 1,
    }

    if (isEditMode.value && itemId.value !== null) {
      const updatedItem = await updateItem(itemId.value, inputForBackend)
      router.push(`/items/${updatedItem.id}`)
      return
    }

    const newItem = await createItem(inputForBackend)
    router.push(`/items/${newItem.id}`)
  } catch (error) {
    console.error(error)

    if (error instanceof ApiError) {
      applyBackendFieldErrors(error)

      saveErrorMessage.value =
        Object.keys(error.fieldErrors).length > 0
          ? 'Bitte prüfe die markierten Felder.'
          : error.message || 'Der Eintrag konnte nicht gespeichert werden.'

      return
    }

    saveErrorMessage.value = 'Der Eintrag konnte nicht gespeichert werden.'
  } finally {
    isLoading.value = false
  }
}

function typeLabel(type: ItemType) {
  return type === 'LOST' ? 'Verloren' : 'Gefunden'
}

function statusLabel(status: ItemStatus) {
  const labels: Record<ItemStatus, string> = {
    OPEN: 'Offen',
    IN_PROGRESS: 'In Klärung',
    RETURNED: 'Zurückgegeben',
  }

  return labels[status]
}

watch(
  () => authStore.currentUser,
  async () => {
    syncReporterWithLogin()
    checkEditPermission()

    if (canChooseReporter.value) {
      await loadReporterOptions()
    }
  },
)

onMounted(async () => {
  syncReporterWithLogin()
  await Promise.all([loadCategories(), loadReporterOptions(), loadExistingItem()])
})
</script>

<template>
  <section class="page-section">
    <div class="container form-page">
      <div>
        <p class="eyebrow">Eintrag verwalten</p>
        <h1 class="section-title">{{ pageTitle }}</h1>
        <p class="section-subtitle">
          {{ pageDescription }}
        </p>
      </div>

      <div v-if="hasMissingBackendProfile" class="card profile-error-box">
        <strong>Backend-Profil konnte nicht geladen werden.</strong>
        <p>
          Du bist bei Auth0 angemeldet, aber findIT konnte dein Profil im Backend nicht laden.
          Prüfe bitte, ob die Auth0 Action für E-Mail und Rollen im Access Token aktiv ist.
        </p>
      </div>

      <div v-if="loadErrorMessage" class="card load-error-box">
        {{ loadErrorMessage }}

        <div v-if="isUnauthorized" class="actions unauthorized-actions">
          <RouterLink to="/items" class="btn-secondary">Zurück zur Übersicht</RouterLink>
        </div>
      </div>

      <div v-if="isLoading && isEditMode" class="card loading-box">
        Eintrag wird geladen...
      </div>

      <form
        v-else-if="!isUnauthorized"
        class="card item-form"
        @submit.prevent="submitForm"
        novalidate
      >
        <div v-if="saveErrorMessage" class="form-alert">
          {{ saveErrorMessage }}
        </div>

        <div v-if="isWaitingForBackendProfile" class="info-alert">
          Dein Profil wird geladen...
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="title">Titel</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              placeholder="z. B. Kopfhörer, Rucksack, Schlüssel"
              :class="{ 'input-invalid': fieldErrors.title }"
              @input="fieldErrors.title = ''"
            />
            <small v-if="fieldErrors.title" class="field-error">
              {{ fieldErrors.title }}
            </small>
          </div>

          <div class="form-group">
            <label for="type">Typ</label>
            <select id="type" v-model="form.type">
              <option value="FOUND">{{ typeLabel('FOUND') }}</option>
              <option value="LOST">{{ typeLabel('LOST') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="category">Kategorie</label>
            <select
              id="category"
              v-model="form.category"
              :disabled="isLoadingCategories"
              :class="{ 'input-invalid': fieldErrors.category }"
              @change="fieldErrors.category = ''"
            >
              <option
                v-for="categoryName in categoryOptions"
                :key="categoryName"
                :value="categoryName"
              >
                {{ categoryName }}
              </option>
            </select>
            <small v-if="fieldErrors.category" class="field-error">
              {{ fieldErrors.category }}
            </small>
          </div>

          <div class="form-group">
            <label for="location">Ort</label>
            <input
              id="location"
              v-model="form.location"
              type="text"
              placeholder="z. B. Bibliothek, Mensa, Gebäude F"
              :class="{ 'input-invalid': fieldErrors.location }"
              @input="fieldErrors.location = ''"
            />
            <small v-if="fieldErrors.location" class="field-error">
              {{ fieldErrors.location }}
            </small>
          </div>

          <div class="form-group">
            <label for="date">Datum</label>
            <input
              id="date"
              v-model="form.date"
              type="date"
              :max="todayString"
              :class="{ 'input-invalid': fieldErrors.date }"
              @change="validateDateField"
              @input="validateDateField"
            />
            <small v-if="fieldErrors.date" class="field-error">
              {{ fieldErrors.date }}
            </small>
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="form.status">
              <option value="OPEN">{{ statusLabel('OPEN') }}</option>
              <option value="IN_PROGRESS">{{ statusLabel('IN_PROGRESS') }}</option>
              <option value="RETURNED">{{ statusLabel('RETURNED') }}</option>
            </select>
          </div>

          <div v-if="canChooseReporter" class="form-group full-width reporter-select-group">
            <label for="user">Gemeldet von</label>
            <select
              id="user"
              v-model.number="form.userId"
              :disabled="isLoadingUsers"
              :class="{ 'input-invalid': fieldErrors.userId }"
              @change="fieldErrors.userId = ''"
            >
              <option
                v-for="user in reporterOptions"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }} – {{ user.email }}
              </option>
            </select>
            <small v-if="fieldErrors.userId" class="field-error">
              {{ fieldErrors.userId }}
            </small>
          </div>

          <div v-else class="form-group full-width">
            <label>Gemeldet von</label>

            <div class="readonly-reporter-box">
              <div class="reporter-avatar">
                {{ selectedReporter?.name.charAt(0).toUpperCase() || '?' }}
              </div>

              <div>
                <strong>{{ selectedReporter?.name || 'Angemeldeter Nutzer' }}</strong>
                <span>{{ selectedReporter?.email || '' }}</span>
              </div>
            </div>

            <small v-if="fieldErrors.userId" class="field-error">
              {{ fieldErrors.userId }}
            </small>
          </div>

          <div class="form-group full-width">
            <label for="description">Beschreibung</label>
            <textarea
              id="description"
              v-model="form.description"
              placeholder="Beschreibe den Gegenstand möglichst genau."
              :class="{ 'input-invalid': fieldErrors.description }"
              @input="fieldErrors.description = ''"
            />
            <small v-if="fieldErrors.description" class="field-error">
              {{ fieldErrors.description }}
            </small>
          </div>
        </div>

        <div class="actions form-actions">
          <button type="submit" class="btn-primary" :disabled="submitButtonDisabled">
            {{
              isLoading
                ? 'Wird gespeichert...'
                : isWaitingForBackendProfile
                  ? 'Profil wird geladen...'
                  : isEditMode
                    ? 'Änderungen speichern'
                    : 'Eintrag erstellen'
            }}
          </button>

          <RouterLink to="/items" class="btn-secondary">Zurück zur Übersicht</RouterLink>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.form-page {
  display: grid;
  gap: 32px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.item-form {
  max-width: 920px;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.full-width {
  grid-column: 1 / -1;
}

.form-actions {
  margin-top: 24px;
}

.load-error-box,
.profile-error-box {
  max-width: 920px;
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.profile-error-box p {
  margin: 8px 0 0;
  color: #7f1d1d;
  line-height: 1.6;
}

.unauthorized-actions {
  margin-top: 18px;
}

.form-alert {
  width: fit-content;
  max-width: 100%;
  margin-bottom: 22px;
  padding: 12px 16px;
  border: 1px solid #fecaca;
  border-radius: 16px;
  background: #fef2f2;
  color: #991b1b;
  font-weight: 800;
}

.info-alert {
  width: fit-content;
  max-width: 100%;
  margin-bottom: 22px;
  padding: 12px 16px;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  background: #eff6ff;
  color: #1e40af;
  font-weight: 800;
}

.field-error {
  display: block;
  margin-top: 8px;
  color: #b91c1c;
  font-weight: 800;
  line-height: 1.4;
}

.input-invalid {
  border-color: #fca5a5 !important;
  background: #fff7f7 !important;
}

.input-invalid:focus {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.14) !important;
}

.loading-box {
  max-width: 920px;
  text-align: center;
  color: var(--muted);
}

.readonly-reporter-box {
  min-height: 68px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #f8fafc;
}

.reporter-avatar {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: var(--primary);
  color: white;
  font-weight: 900;
}

.readonly-reporter-box strong {
  display: block;
  margin-bottom: 4px;
}

.readonly-reporter-box span {
  display: block;
  color: var(--muted);
  font-weight: 700;
  overflow-wrap: anywhere;
}

button:disabled,
select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 780px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .item-form {
    padding: 18px;
  }

  .actions {
    flex-direction: column;
  }

  .actions a,
  .actions button {
    width: 100%;
  }

  .form-alert,
  .info-alert {
    width: 100%;
  }

  .readonly-reporter-box {
    align-items: flex-start;
  }
}
</style>