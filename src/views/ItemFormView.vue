<script setup lang="ts">
import { computed, reactive } from 'vue'
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

const itemId = computed(() => {
  const id = route.params.id

  if (!id) {
    return null
  }

  return Number(id)
})

const isEditMode = computed(() => itemId.value !== null)

const existingItem = computed(() => {
  if (itemId.value === null) {
    return null
  }

  return getItemById(itemId.value)
})

const form = reactive<ItemInput>({
  title: existingItem.value?.title ?? '',
  description: existingItem.value?.description ?? '',
  type: existingItem.value?.type ?? 'FOUND',
  category: existingItem.value?.category ?? 'Elektronik',
  location: existingItem.value?.location ?? '',
  date: existingItem.value?.date ?? new Date().toISOString().slice(0, 10),
  status: existingItem.value?.status ?? 'OPEN',
  userId: existingItem.value?.user.id ?? users[0].id,
})

const pageTitle = computed(() => {
  return isEditMode.value ? 'Gegenstand bearbeiten' : 'Gegenstand melden'
})

const pageDescription = computed(() => {
  return isEditMode.value
    ? 'Passe die Daten des Eintrags an. Änderungen werden in der Übersicht aktualisiert.'
    : 'Erfasse einen verlorenen oder gefundenen Gegenstand mit den wichtigsten Informationen.'
})

function submitForm() {
  if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
    alert('Bitte fülle Titel, Beschreibung und Ort aus.')
    return
  }

  if (isEditMode.value && itemId.value !== null) {
    updateItem(itemId.value, form)
    router.push(`/items/${itemId.value}`)
    return
  }

  const newItem = createItem(form)
  router.push(`/items/${newItem.id}`)
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

      <form class="card item-form" @submit.prevent="submitForm">
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
          <button type="submit" class="btn-primary">
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