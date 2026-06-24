<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ActionDialog from '../components/ActionDialog.vue'
import {
  ApiError,
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type User,
  type UserInput,
} from '../services/userService'

const users = ref<User[]>([])
const searchQuery = ref('')

const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

const loadErrorMessage = ref('')
const saveErrorMessage = ref('')
const deleteErrorMessage = ref('')
const successMessage = ref('')

const selectedDeleteUser = ref<User | null>(null)
const editingUserId = ref<number | null>(null)

const form = reactive<UserInput>({
  name: '',
  email: '',
})

const fieldErrors = reactive({
  name: '',
  email: '',
})

const isDeleteDialogOpen = computed(() => selectedDeleteUser.value !== null)
const isEditMode = computed(() => editingUserId.value !== null)

const filteredUsers = computed(() => {
  const search = searchQuery.value.trim().toLowerCase()

  if (!search) {
    return users.value
  }

  return users.value.filter((user) => {
    return (
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      String(user.id).includes(search)
    )
  })
})

const totalUsers = computed(() => users.value.length)

async function loadUsers() {
  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    users.value = await getUsers()
  } catch (error) {
    console.error(error)
    loadErrorMessage.value =
      'Die Nutzer konnten nicht geladen werden. Bitte prüfe, ob das Backend läuft.'
  } finally {
    isLoading.value = false
  }
}

function clearMessages() {
  saveErrorMessage.value = ''
  deleteErrorMessage.value = ''
  successMessage.value = ''
}

function clearFieldErrors() {
  fieldErrors.name = ''
  fieldErrors.email = ''
}

function resetForm() {
  form.name = ''
  form.email = ''
  editingUserId.value = null
  clearFieldErrors()
  saveErrorMessage.value = ''
}

function validateForm() {
  clearFieldErrors()

  if (!form.name.trim()) {
    fieldErrors.name = 'Bitte gib einen Namen ein.'
  }

  if (!form.email.trim()) {
    fieldErrors.email = 'Bitte gib eine E-Mail-Adresse ein.'
  } else if (!form.email.includes('@')) {
    fieldErrors.email = 'Bitte gib eine gültige E-Mail-Adresse ein.'
  }

  return !fieldErrors.name && !fieldErrors.email
}

function applyBackendFieldErrors(error: ApiError) {
  if (error.fieldErrors.name) {
    fieldErrors.name = error.fieldErrors.name
  }

  if (error.fieldErrors.email) {
    fieldErrors.email = error.fieldErrors.email
  }
}

async function submitForm() {
  clearMessages()

  if (!validateForm()) {
    saveErrorMessage.value = 'Bitte prüfe die markierten Felder.'
    return
  }

  isSaving.value = true

  try {
    const cleanedInput: UserInput = {
      name: form.name.trim(),
      email: form.email.trim(),
    }

    if (editingUserId.value !== null) {
      await updateUser(editingUserId.value, cleanedInput)
      successMessage.value = 'Der Nutzer wurde aktualisiert.'
    } else {
      await createUser(cleanedInput)
      successMessage.value = 'Der Nutzer wurde angelegt.'
    }

    resetForm()
    await loadUsers()
  } catch (error) {
    console.error(error)

    if (error instanceof ApiError) {
      applyBackendFieldErrors(error)

      saveErrorMessage.value =
        Object.keys(error.fieldErrors).length > 0
          ? 'Bitte prüfe die markierten Felder.'
          : error.message || 'Der Nutzer konnte nicht gespeichert werden.'

      return
    }

    saveErrorMessage.value = 'Der Nutzer konnte nicht gespeichert werden.'
  } finally {
    isSaving.value = false
  }
}

function startEdit(user: User) {
  clearMessages()
  clearFieldErrors()

  editingUserId.value = user.id
  form.name = user.name
  form.email = user.email
}

function openDeleteDialog(user: User) {
  clearMessages()
  selectedDeleteUser.value = user
}

function closeDeleteDialog() {
  if (isDeleting.value) {
    return
  }

  selectedDeleteUser.value = null
}

async function deleteSelectedUser() {
  const userToDelete = selectedDeleteUser.value

  if (!userToDelete) {
    return
  }

  selectedDeleteUser.value = null
  clearMessages()
  isDeleting.value = true

  try {
    await deleteUser(userToDelete.id)

    if (editingUserId.value === userToDelete.id) {
      resetForm()
    }

    successMessage.value = 'Der Nutzer wurde gelöscht.'
    await loadUsers()
  } catch (error) {
    console.error(error)

    if (error instanceof ApiError) {
      deleteErrorMessage.value =
        error.message || 'Der Nutzer konnte nicht gelöscht werden.'
      return
    }

    deleteErrorMessage.value = 'Der Nutzer konnte nicht gelöscht werden.'
  } finally {
    isDeleting.value = false
  }
}

onMounted(loadUsers)
</script>

<template>
  <section class="page-section">
    <div class="container admin-users-page">
      <div class="page-header">
        <div>
          <p class="eyebrow">Adminbereich</p>
          <h1 class="section-title">Nutzerverwaltung</h1>
          <p class="section-subtitle">
            Verwalte Nutzer, die Einträge melden oder besitzen können.
          </p>
        </div>

        <RouterLink to="/admin" class="btn-secondary">
          Zurück zum Admin-Dashboard
        </RouterLink>
      </div>

      <div class="stats-grid">
        <article class="card stat-card">
          <span>{{ totalUsers }}</span>
          <p>Nutzer insgesamt</p>
        </article>

        <article class="card stat-card">
          <span>{{ filteredUsers.length }}</span>
          <p>Aktuell angezeigt</p>
        </article>
      </div>

      <div v-if="loadErrorMessage" class="card message-box error-box">
        {{ loadErrorMessage }}
      </div>

      <div v-if="saveErrorMessage" class="card message-box error-box">
        {{ saveErrorMessage }}
      </div>

      <div v-if="deleteErrorMessage" class="card message-box error-box">
        {{ deleteErrorMessage }}
      </div>

      <div v-if="successMessage" class="card message-box success-box">
        {{ successMessage }}
      </div>

      <div v-if="isDeleting" class="card message-box info-box">
        Der Löschvorgang wird verarbeitet...
      </div>

      <div class="admin-layout">
        <form class="card user-form" @submit.prevent="submitForm" novalidate>
          <div>
            <p class="eyebrow small-eyebrow">
              {{ isEditMode ? 'Nutzer bearbeiten' : 'Nutzer anlegen' }}
            </p>
            <h2>{{ isEditMode ? 'Nutzerdaten ändern' : 'Neuer Nutzer' }}</h2>
          </div>

          <div class="form-group">
            <label for="name">Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="z. B. Max Mustermann"
              :class="{ 'input-invalid': fieldErrors.name }"
              @input="fieldErrors.name = ''"
            />
            <small v-if="fieldErrors.name" class="field-error">
              {{ fieldErrors.name }}
            </small>
          </div>

          <div class="form-group">
            <label for="email">E-Mail</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="max@example.com"
              :class="{ 'input-invalid': fieldErrors.email }"
              @input="fieldErrors.email = ''"
            />
            <small v-if="fieldErrors.email" class="field-error">
              {{ fieldErrors.email }}
            </small>
          </div>

          <div class="actions form-actions">
            <button type="submit" class="btn-primary" :disabled="isSaving">
              {{
                isSaving
                  ? 'Wird gespeichert...'
                  : isEditMode
                    ? 'Änderungen speichern'
                    : 'Nutzer anlegen'
              }}
            </button>

            <button
              v-if="isEditMode"
              type="button"
              class="btn-secondary"
              :disabled="isSaving"
              @click="resetForm"
            >
              Abbrechen
            </button>
          </div>
        </form>

        <div class="card user-list-card">
          <div class="list-header">
            <div>
              <p class="eyebrow small-eyebrow">Nutzer suchen</p>
              <h2>Nutzerliste</h2>
            </div>

            <div class="form-group search-group">
              <label for="search">Suche</label>
              <input
                id="search"
                v-model="searchQuery"
                type="search"
                placeholder="Name, E-Mail oder ID"
              />
            </div>
          </div>

          <div v-if="isLoading" class="mini-state">
            Nutzer werden geladen...
          </div>

          <div v-else-if="filteredUsers.length === 0" class="mini-state">
            Keine Nutzer gefunden.
          </div>

          <div v-else class="users-table-wrapper">
            <table class="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Aktionen</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <div class="table-actions">
                      <button type="button" class="btn-secondary" @click="startEdit(user)">
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        class="btn-danger"
                        :disabled="isDeleting"
                        @click="openDeleteDialog(user)"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <ActionDialog
      :is-open="isDeleteDialogOpen"
      title="Nutzer löschen?"
      :message="
        selectedDeleteUser
          ? `${selectedDeleteUser.name} wird gelöscht, sofern ihm keine Einträge zugeordnet sind.`
          : ''
      "
      accept-text="Ja, löschen"
      cancel-text="Abbrechen"
      variant="danger"
      :is-loading="isDeleting"
      @cancel="closeDeleteDialog"
      @accept="deleteSelectedUser"
    />
  </section>
</template>

<style scoped>
.admin-users-page {
  display: grid;
  gap: 28px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.small-eyebrow {
  font-size: 0.82rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 220px));
  gap: 18px;
}

.stat-card span {
  display: block;
  margin-bottom: 6px;
  font-size: 2rem;
  font-weight: 900;
  color: var(--primary);
}

.stat-card p {
  margin: 0;
  color: var(--muted);
  font-weight: 800;
}

.message-box {
  max-width: 980px;
  font-weight: 800;
}

.error-box {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.success-box {
  border-color: #bbf7d0;
  background: #dcfce7;
  color: #166534;
}

.info-box {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1e40af;
}

.admin-layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.user-form {
  display: grid;
  gap: 18px;
}

.user-form h2,
.user-list-card h2 {
  margin: 0;
}

.form-actions {
  margin-top: 4px;
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

.user-list-card {
  display: grid;
  gap: 20px;
}

.list-header {
  display: grid;
  grid-template-columns: 1fr minmax(220px, 320px);
  gap: 18px;
  align-items: end;
}

.search-group {
  margin: 0;
}

.mini-state {
  padding: 18px;
  border-radius: 18px;
  background: #f8fafc;
  color: var(--muted);
  font-weight: 800;
}

.users-table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

.users-table th {
  color: var(--muted);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.users-table td {
  font-weight: 700;
}

.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-actions button {
  padding: 10px 14px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 980px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .list-header {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .page-header {
    flex-direction: column;
  }

  .page-header a {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .table-actions {
    flex-direction: column;
  }

  .table-actions button {
    width: 100%;
  }
}
</style>