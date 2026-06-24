<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ActionDialog from '../components/ActionDialog.vue'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
  type CategoryInput,
} from '../services/categoryService'

const categories = ref<Category[]>([])
const query = ref('')

const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const validationMessage = ref('')

const editingCategoryId = ref<number | null>(null)
const selectedDeleteId = ref<number | null>(null)

const form = reactive<CategoryInput>({
  name: '',
  description: '',
})

const isEditMode = computed(() => editingCategoryId.value !== null)
const isDeleteDialogOpen = computed(() => selectedDeleteId.value !== null)

const filteredCategories = computed(() => {
  const search = query.value.trim().toLowerCase()

  if (!search) {
    return categories.value
  }

  return categories.value.filter((category) => {
    return (
      category.name.toLowerCase().includes(search) ||
      category.description.toLowerCase().includes(search)
    )
  })
})

async function loadCategories() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Kategorien konnten nicht geladen werden. Bitte prüfe, ob das Backend läuft.'
  } finally {
    isLoading.value = false
  }
}

function validateForm() {
  if (!form.name.trim()) {
    validationMessage.value = 'Bitte gib einen Kategorienamen ein.'
    return false
  }

  validationMessage.value = ''
  return true
}

async function submitForm() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!validateForm()) {
    return
  }

  isSaving.value = true

  const cleanedInput: CategoryInput = {
    name: form.name.trim(),
    description: form.description.trim(),
  }

  try {
    if (editingCategoryId.value !== null) {
      const updatedCategory = await updateCategory(editingCategoryId.value, cleanedInput)

      categories.value = categories.value.map((category) =>
        category.id === updatedCategory.id ? updatedCategory : category,
      )

      successMessage.value = 'Die Kategorie wurde aktualisiert.'
      resetForm()
      return
    }

    const newCategory = await createCategory(cleanedInput)
    categories.value = [...categories.value, newCategory].sort((a, b) =>
      a.name.localeCompare(b.name),
    )

    successMessage.value = 'Die Kategorie wurde erstellt.'
    resetForm()
  } catch (error) {
    console.error(error)
    errorMessage.value =
      'Die Kategorie konnte nicht gespeichert werden. Möglicherweise existiert der Name bereits.'
  } finally {
    isSaving.value = false
  }
}

function startEdit(category: Category) {
  editingCategoryId.value = category.id
  form.name = category.name
  form.description = category.description
  validationMessage.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}

function resetForm() {
  editingCategoryId.value = null
  form.name = ''
  form.description = ''
  validationMessage.value = ''
}

function openDeleteDialog(id: number) {
  selectedDeleteId.value = id
  errorMessage.value = ''
  successMessage.value = ''
}

function closeDeleteDialog() {
  if (isDeleting.value) {
    return
  }

  selectedDeleteId.value = null
}

async function deleteSelectedCategory() {
  if (selectedDeleteId.value === null) {
    return
  }

  isDeleting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await deleteCategory(selectedDeleteId.value)

    categories.value = categories.value.filter(
      (category) => category.id !== selectedDeleteId.value,
    )

    selectedDeleteId.value = null
    successMessage.value = 'Die Kategorie wurde gelöscht.'
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Die Kategorie konnte nicht gelöscht werden.'
  } finally {
    isDeleting.value = false
  }
}

function resetSearch() {
  query.value = ''
}

onMounted(loadCategories)
</script>

<template>
  <section class="admin-page">
    <div class="container">
      <div class="admin-header">
        <div>
          <p class="eyebrow">Admin-Bereich</p>
          <h1 class="section-title">Kategorien verwalten</h1>
          <p class="section-subtitle">
            Kategorien sind Stammdaten der Anwendung. Sie helfen dabei, Fund- und Verlustanzeigen
            sauber zu strukturieren.
          </p>
        </div>

        <RouterLink to="/admin" class="btn-secondary">Zurück zum Admin-Dashboard</RouterLink>
      </div>

      <div class="admin-layout">
        <form class="card category-form-card" @submit.prevent="submitForm">
          <div>
            <p class="eyebrow small-eyebrow">
              {{ isEditMode ? 'Kategorie bearbeiten' : 'Kategorie anlegen' }}
            </p>
            <h2>{{ isEditMode ? 'Stammdatum ändern' : 'Neue Kategorie' }}</h2>
          </div>

          <div v-if="validationMessage" class="inline-message validation-box">
            {{ validationMessage }}
          </div>

          <div class="form-group">
            <label for="category-name">Name</label>
            <input
              id="category-name"
              v-model="form.name"
              type="text"
              placeholder="z. B. Elektronik"
              required
            />
          </div>

          <div class="form-group">
            <label for="category-description">Beschreibung</label>
            <textarea
              id="category-description"
              v-model="form.description"
              placeholder="Kurze Beschreibung der Kategorie"
            ></textarea>
          </div>

          <div class="actions form-actions">
            <button type="submit" class="btn-primary" :disabled="isSaving">
              {{
                isSaving
                  ? 'Wird gespeichert...'
                  : isEditMode
                    ? 'Änderungen speichern'
                    : 'Kategorie erstellen'
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

        <div class="categories-main">
          <div class="stats-grid">
            <article class="stat-card">
              <span>Kategorien</span>
              <strong>{{ categories.length }}</strong>
            </article>

            <article class="stat-card">
              <span>Gefiltert</span>
              <strong>{{ filteredCategories.length }}</strong>
            </article>
          </div>

          <div class="card filter-card">
            <div class="form-group">
              <label for="category-search">Suche</label>
              <input
                id="category-search"
                v-model="query"
                type="search"
                placeholder="Kategorie oder Beschreibung suchen"
              />
            </div>

            <div class="actions filter-actions">
              <button type="button" class="btn-secondary" @click="resetSearch">
                Suche zurücksetzen
              </button>

              <button type="button" class="btn-primary" :disabled="isLoading" @click="loadCategories">
                Aktualisieren
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="card error-box">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="card success-box">
            {{ successMessage }}
          </div>

          <div v-if="isLoading" class="card loading-box">
            Kategorien werden geladen...
          </div>

          <template v-else>
            <div v-if="filteredCategories.length > 0" class="categories-grid">
              <article
                v-for="category in filteredCategories"
                :key="category.id"
                class="card category-card"
              >
                <div class="category-icon">🏷️</div>

                <div class="category-content">
                  <span class="category-id">#{{ category.id }}</span>
                  <h2>{{ category.name }}</h2>
                  <p>
                    {{
                      category.description ||
                      'Keine Beschreibung hinterlegt.'
                    }}
                  </p>
                </div>

                <div class="category-actions">
                  <button type="button" class="btn-secondary" @click="startEdit(category)">
                    Bearbeiten
                  </button>

                  <button type="button" class="btn-danger" @click="openDeleteDialog(category.id)">
                    Löschen
                  </button>
                </div>
              </article>
            </div>

            <div v-else class="card empty-state">
              <h2>Keine Kategorien gefunden</h2>
              <p>Lege eine neue Kategorie an oder ändere deine Suche.</p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <ActionDialog
      :is-open="isDeleteDialogOpen"
      title="Kategorie löschen?"
      message="Diese Kategorie wird dauerhaft gelöscht. Bereits vorhandene Einträge behalten ihren gespeicherten Kategorienamen."
      accept-text="Ja, löschen"
      cancel-text="Abbrechen"
      variant="danger"
      :is-loading="isDeleting"
      @cancel="closeDeleteDialog"
      @accept="deleteSelectedCategory"
    />
  </section>
</template>

<style scoped>
.admin-page {
  min-height: calc(100vh - 76px);
  padding: 72px 0;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 32%),
    linear-gradient(135deg, #f8fafc 0%, #ffffff 48%, #eff6ff 100%);
}

.admin-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.admin-layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.category-form-card {
  position: sticky;
  top: 100px;
  display: grid;
  gap: 18px;
}

.category-form-card h2 {
  margin: 0;
}

.small-eyebrow {
  font-size: 0.78rem;
}

.categories-main {
  display: grid;
  gap: 22px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.stat-card {
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: white;
  box-shadow: var(--shadow-sm);
}

.stat-card span {
  display: block;
  color: var(--muted);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.stat-card strong {
  color: var(--primary);
  font-size: 2rem;
}

.filter-card {
  display: grid;
  gap: 18px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.categories-grid {
  display: grid;
  gap: 18px;
}

.category-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  align-items: center;
}

.category-icon {
  width: 64px;
  height: 64px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: #eff6ff;
  font-size: 1.6rem;
}

.category-content {
  min-width: 0;
}

.category-id {
  color: var(--muted);
  font-weight: 900;
  font-size: 0.85rem;
}

.category-content h2 {
  margin: 4px 0 6px;
  font-size: 1.25rem;
}

.category-content p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.category-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.inline-message {
  padding: 14px 16px;
  border-radius: 16px;
  font-weight: 800;
}

.validation-box {
  border: 1px solid #fed7aa;
  background: #fff7ed;
  color: #9a3412;
}

.error-box,
.success-box,
.loading-box,
.empty-state {
  text-align: center;
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
  font-weight: 800;
}

.empty-state p {
  color: var(--muted);
}

.form-actions {
  margin-top: 4px;
}

@media (max-width: 950px) {
  .admin-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-layout {
    grid-template-columns: 1fr;
  }

  .category-form-card {
    position: static;
  }

  .category-card {
    grid-template-columns: 1fr;
  }

  .category-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 650px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions,
  .category-actions {
    flex-direction: column;
  }

  .filter-actions button,
  .category-actions button {
    width: 100%;
  }
}
</style>