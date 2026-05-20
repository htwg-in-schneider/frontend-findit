<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createItem,
  getItemById,
  updateItem,
  users,
  type ItemInput,
  type ItemStatus,
  type ItemType,
} from '../services/itemService'

const route = useRoute()
const router = useRouter()

const isLoading = ref(false)
const errorMessage = ref('')

const itemId = computed(() => {
  const id = route.params.id

  if (!id) {
    return null
  }

  return Number(id)
})

const isEditMode = computed(() => itemId.value !== null)

const form = reactive<ItemInput>({
  title: '',
  description: '',
  type: 'FOUND',
  category: 'Elektronik',
  location: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'OPEN',
  userId: users[0].id,
})

const pageTitle = computed(() => {
  return isEditMode.value ? 'Gegenstand bearbeiten' : 'Gegenstand melden'
})

const pageDescription = computed(() => {
  return isEditMode.value
    ? 'Passe die Daten des Eintrags an. Änderungen werden direkt im Backend gespeichert.'
    : 'Erfasse einen verlorenen oder gefundenen Gegenstand mit den wichtigsten Informationen.'
})

async function loadExistingItem() {
  if (!isEditMode.value || itemId.value === null) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const item = await getItemById(itemId.value)

    form.title = item.title
    form.description = item.description
    form.type = item.type
    form.category = item.category
    form.location = item.location
    form.date = item.date
    form.status = item.status
    form.userId = item.user.id
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Der Eintrag konnte nicht geladen werden.'
  } finally {
    isLoading.value = false
  }
}

async function submitForm() {
  if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
    alert('Bitte fülle Titel, Beschreibung und Ort aus.')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    if (isEditMode.value && itemId.value !== null) {
      const updatedItem = await updateItem(itemId.value, form)
      router.push(`/items/${updatedItem.id}`)
      return
    }

    const newItem = await createItem(form)
    router.push(`/items/${newItem.id}`)
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Der Eintrag konnte nicht gespeichert werden.'
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

onMounted(loadExistingItem)
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

      <div v-if="errorMessage" class="card error-box">
        {{ errorMessage }}
      </div>

      <div v-if="isLoading && isEditMode" class="card loading-box">
        Eintrag wird geladen...
      </div>

      <form v-else class="card item-form" @submit.prevent="submitForm">
        <div class="form-grid">
          <div class="form-group">
            <label for="title">Titel</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              placeholder="z. B. Kopfhörer, Rucksack, Schlüssel"
            />
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
            <select id="category" v-model="form.category">
              <option value="Elektronik">Elektronik</option>
              <option value="Tasche">Tasche</option>
              <option value="Dokumente">Dokumente</option>
              <option value="Kleidung">Kleidung</option>
              <option value="Schlüssel">Schlüssel</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>
          </div>

          <div class="form-group">
            <label for="location">Ort</label>
            <input
              id="location"
              v-model="form.location"
              type="text"
              placeholder="z. B. Bibliothek, Mensa, Gebäude F"
            />
          </div>

          <div class="form-group">
            <label for="date">Datum</label>
            <input id="date" v-model="form.date" type="date" />
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="form.status">
              <option value="OPEN">{{ statusLabel('OPEN') }}</option>
              <option value="IN_PROGRESS">{{ statusLabel('IN_PROGRESS') }}</option>
              <option value="RETURNED">{{ statusLabel('RETURNED') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="user">Gemeldet von</label>
            <select id="user" v-model.number="form.userId">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }} – {{ user.email }}
              </option>
            </select>
          </div>

          <div class="form-group full-width">
            <label for="description">Beschreibung</label>
            <textarea
              id="description"
              v-model="form.description"
              placeholder="Beschreibe den Gegenstand möglichst genau."
            />
          </div>
        </div>

        <div class="actions form-actions">
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isEditMode ? 'Änderungen speichern' : 'Eintrag erstellen' }}
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

.error-box {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.loading-box {
  text-align: center;
  color: var(--muted);
}

button:disabled {
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
}
</style>