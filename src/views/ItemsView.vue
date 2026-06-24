<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ActionDialog from '../components/ActionDialog.vue'
import {
  deleteItem,
  searchAndFilterItems,
  type Item,
  type ItemStatus,
  type ItemType,
} from '../services/itemService'
import { useAuthStore } from '../stores/authStores'

const authStore = useAuthStore()

const query = ref('')
const selectedType = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')

const items = ref<Item[]>([])
const isLoading = ref(false)
const isDeleting = ref(false)

const errorMessage = ref('')
const deleteErrorMessage = ref('')
const selectedDeleteId = ref<number | null>(null)

const isDeleteDialogOpen = computed(() => selectedDeleteId.value !== null)

const isCurrentUserAdmin = computed(() => {
  return (
    authStore.currentUser?.role === 'ADMIN' &&
    authStore.currentUser.email === 'admin@findit.htwg-konstanz.de'
  )
})

const categories = computed(() => {
  const categorySet = new Set<string>()

  items.value.forEach((item) => {
    if (item.category) {
      categorySet.add(item.category)
    }
  })

  return [...categorySet].sort((first, second) => first.localeCompare(second))
})

async function loadItems() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    items.value = await searchAndFilterItems({
      query: query.value,
      type: selectedType.value,
      category: selectedCategory.value,
      status: selectedStatus.value,
    })
  } catch (error) {
    console.error(error)
    errorMessage.value =
      'Die Einträge konnten nicht geladen werden. Bitte prüfe, ob das Backend läuft.'
  } finally {
    isLoading.value = false
  }
}

function canManageItem(item: Item) {
  if (isCurrentUserAdmin.value) {
    return true
  }

  return authStore.currentUser?.id === item.user.id
}

function openDeleteDialog(id: number) {
  selectedDeleteId.value = id
  deleteErrorMessage.value = ''
}

function closeDeleteDialog() {
  if (isDeleting.value) {
    return
  }

  selectedDeleteId.value = null
}

async function deleteSelectedItem() {
  if (selectedDeleteId.value === null) {
    return
  }

  const itemToDelete = items.value.find((item) => item.id === selectedDeleteId.value)

  if (!itemToDelete || !canManageItem(itemToDelete)) {
    deleteErrorMessage.value = 'Du darfst diesen Eintrag nicht löschen.'
    selectedDeleteId.value = null
    return
  }

  isDeleting.value = true
  deleteErrorMessage.value = ''

  try {
    await deleteItem(selectedDeleteId.value)
    selectedDeleteId.value = null
    await loadItems()
  } catch (error) {
    console.error(error)
    deleteErrorMessage.value = 'Der Eintrag konnte nicht gelöscht werden.'
  } finally {
    isDeleting.value = false
  }
}

function resetFilters() {
  query.value = ''
  selectedType.value = ''
  selectedCategory.value = ''
  selectedStatus.value = ''
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

function typeBadgeClass(type: ItemType) {
  return type === 'LOST' ? 'badge-lost' : 'badge-found'
}

function statusBadgeClass(status: ItemStatus) {
  const classes: Record<ItemStatus, string> = {
    OPEN: 'badge-open',
    IN_PROGRESS: 'badge-progress',
    RETURNED: 'badge-returned',
  }

  return classes[status]
}

onMounted(loadItems)

watch([query, selectedType, selectedCategory, selectedStatus], () => {
  loadItems()
})
</script>

<template>
  <section class="page-section">
    <div class="container">
      <div class="page-header">
        <div>
          <p class="eyebrow">Lost & Found Übersicht</p>
          <h1 class="section-title">Einträge</h1>
          <p class="section-subtitle">
            Durchsuche verlorene und gefundene Gegenstände auf dem Campus oder melde selbst einen
            neuen Eintrag.
          </p>
        </div>

        <RouterLink to="/items/new" class="btn-primary">Gegenstand melden</RouterLink>
      </div>

      <div class="card filter-card">
        <div class="filter-grid">
          <div class="form-group">
            <label for="query">Suche</label>
            <input
              id="query"
              v-model="query"
              type="search"
              placeholder="z. B. Kopfhörer, Mensa, Bibliothek"
            />
          </div>

          <div class="form-group">
            <label for="type">Typ</label>
            <select id="type" v-model="selectedType">
              <option value="">Alle Typen</option>
              <option value="LOST">Verloren</option>
              <option value="FOUND">Gefunden</option>
            </select>
          </div>

          <div class="form-group">
            <label for="category">Kategorie</label>
            <select id="category" v-model="selectedCategory">
              <option value="">Alle Kategorien</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="selectedStatus">
              <option value="">Alle Status</option>
              <option value="OPEN">Offen</option>
              <option value="IN_PROGRESS">In Klärung</option>
              <option value="RETURNED">Zurückgegeben</option>
            </select>
          </div>
        </div>

        <div class="actions filter-actions">
          <button type="button" class="btn-secondary" @click="resetFilters">
            Filter zurücksetzen
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="card error-box">
        {{ errorMessage }}
      </div>

      <div v-if="deleteErrorMessage" class="card error-box">
        {{ deleteErrorMessage }}
      </div>

      <div v-if="isLoading" class="card loading-box">
        Einträge werden geladen...
      </div>

      <template v-else>
        <div class="results-info">
          <strong>{{ items.length }}</strong>
          Einträge gefunden
        </div>

        <div v-if="items.length > 0" class="items-grid">
          <article v-for="item in items" :key="item.id" class="card item-card">
            <div class="item-card-header">
              <span class="badge" :class="typeBadgeClass(item.type)">
                {{ typeLabel(item.type) }}
              </span>

              <span class="badge" :class="statusBadgeClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </div>

            <h2>{{ item.title }}</h2>

            <p class="description">
              {{ item.description }}
            </p>

            <dl class="item-meta">
              <div>
                <dt>Kategorie</dt>
                <dd>{{ item.category }}</dd>
              </div>

              <div>
                <dt>Ort</dt>
                <dd>{{ item.location }}</dd>
              </div>

              <div>
                <dt>Datum</dt>
                <dd>{{ item.date }}</dd>
              </div>

              <div>
                <dt>Gemeldet von</dt>
                <dd>{{ item.user.name }}</dd>
              </div>
            </dl>

            <div class="actions card-actions">
              <RouterLink :to="`/items/${item.id}`" class="btn-secondary">
                Details
              </RouterLink>

              <template v-if="canManageItem(item)">
                <RouterLink :to="`/items/${item.id}/edit`" class="btn-secondary">
                  Bearbeiten
                </RouterLink>

                <button type="button" class="btn-danger" @click="openDeleteDialog(item.id)">
                  Löschen
                </button>
              </template>
            </div>
          </article>
        </div>

        <div v-else class="card empty-state">
          <h2>Keine passenden Einträge gefunden</h2>
          <p>Ändere deine Suche oder deine Filter, um weitere Ergebnisse zu sehen.</p>
        </div>
      </template>
    </div>

    <ActionDialog
      :is-open="isDeleteDialogOpen"
      title="Eintrag löschen?"
      message="Dieser Eintrag wird dauerhaft gelöscht und verschwindet aus der Übersicht."
      accept-text="Ja, löschen"
      cancel-text="Abbrechen"
      variant="danger"
      :is-loading="isDeleting"
      @cancel="closeDeleteDialog"
      @accept="deleteSelectedItem"
    />
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.filter-card {
  margin-bottom: 24px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.5fr repeat(3, 1fr);
  gap: 18px;
}

.filter-actions {
  margin-top: 18px;
}

.results-info {
  margin: 20px 0;
  color: var(--muted);
}

.results-info strong {
  color: var(--text);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.item-card {
  display: grid;
  gap: 16px;
}

.item-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-card h2 {
  margin: 0;
  font-size: 1.5rem;
}

.description {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.item-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
}

.item-meta div {
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
}

.item-meta dt {
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.item-meta dd {
  margin: 4px 0 0;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.card-actions {
  margin-top: 4px;
}

.empty-state,
.loading-box,
.error-box {
  text-align: center;
}

.empty-state p {
  color: var(--muted);
}

.error-box {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
  margin-bottom: 20px;
}

@media (max-width: 950px) {
  .filter-grid,
  .items-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 850px) {
  .page-header {
    flex-direction: column;
  }

  .page-header .btn-primary {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .item-meta {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;
  }

  .card-actions a,
  .card-actions button {
    width: 100%;
  }
}
</style>