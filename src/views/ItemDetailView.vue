<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  deleteItem,
  getItemById,
  type Item,
  type ItemStatus,
  type ItemType,
} from '../services/itemService'

const route = useRoute()
const router = useRouter()

const item = ref<Item | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const itemId = computed(() => Number(route.params.id))

async function loadItem() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    item.value = await getItemById(itemId.value)
  } catch (error) {
    console.error(error)
    item.value = null
    errorMessage.value = 'Der Eintrag konnte nicht geladen werden.'
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

async function handleDelete() {
  if (!item.value) {
    return
  }

  const confirmed = confirm('Möchtest du diesen Eintrag wirklich löschen?')

  if (!confirmed) {
    return
  }

  try {
    await deleteItem(item.value.id)
    router.push('/items')
  } catch (error) {
    console.error(error)
    alert('Der Eintrag konnte nicht gelöscht werden.')
  }
}

onMounted(loadItem)
</script>

<template>
  <section class="page-section">
    <div class="container">
      <div v-if="isLoading" class="card loading-box">
        Eintrag wird geladen...
      </div>

      <div v-else-if="item" class="detail-layout">
        <div class="detail-main">
          <div class="detail-header">
            <div>
              <p class="eyebrow">Eintragsdetails</p>
              <h1 class="section-title">{{ item.title }}</h1>
            </div>

            <div class="badge-row">
              <span class="badge" :class="typeBadgeClass(item.type)">
                {{ typeLabel(item.type) }}
              </span>

              <span class="badge" :class="statusBadgeClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </div>
          </div>

          <article class="card">
            <h2>Beschreibung</h2>
            <p class="description">{{ item.description }}</p>
          </article>

          <article class="card">
            <h2>Informationen</h2>

            <dl class="info-grid">
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
                <dt>Status</dt>
                <dd>{{ statusLabel(item.status) }}</dd>
              </div>
            </dl>
          </article>
        </div>

        <aside class="detail-sidebar">
          <div class="card contact-card">
            <h2>Gemeldet von</h2>

            <div class="user-avatar">
              {{ item.user.name.charAt(0) }}
            </div>

            <strong>{{ item.user.name }}</strong>
            <p>{{ item.user.email }}</p>

            <div class="actions sidebar-actions">
              <RouterLink :to="`/items/${item.id}/edit`" class="btn-primary">
                Bearbeiten
              </RouterLink>

              <button type="button" class="btn-danger" @click="handleDelete">
                Löschen
              </button>

              <RouterLink to="/items" class="btn-secondary">
                Zurück zur Übersicht
              </RouterLink>
            </div>
          </div>

          <div class="card hint-card">
            <h2>Nächster Schritt</h2>
            <p>
              In der finalen Version kann hier eine Kontaktanfrage an die meldende Person
              gesendet werden.
            </p>
          </div>
        </aside>
      </div>

      <div v-else class="card empty-state">
        <h1>Eintrag nicht gefunden</h1>
        <p>{{ errorMessage || 'Der gesuchte Gegenstand existiert nicht oder wurde bereits gelöscht.' }}</p>
        <RouterLink to="/items" class="btn-primary">Zurück zur Übersicht</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 28px;
  align-items: start;
}

.detail-main {
  display: grid;
  gap: 24px;
}

.detail-header {
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

.badge-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.card h2 {
  margin: 0 0 14px;
}

.description {
  color: var(--muted);
  line-height: 1.8;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
}

.info-grid div {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
}

.info-grid dt {
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.info-grid dd {
  margin: 5px 0 0;
  font-weight: 800;
}

.detail-sidebar {
  display: grid;
  gap: 20px;
}

.contact-card {
  display: grid;
  gap: 12px;
  text-align: center;
}

.contact-card p {
  margin: 0;
  color: var(--muted);
}

.user-avatar {
  width: 76px;
  height: 76px;
  border-radius: 24px;
  background: var(--primary);
  color: white;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 900;
  margin: 0 auto;
}

.sidebar-actions {
  display: grid;
  margin-top: 10px;
}

.sidebar-actions a,
.sidebar-actions button {
  width: 100%;
}

.hint-card p {
  color: var(--muted);
  line-height: 1.7;
  margin: 0;
}

.empty-state,
.loading-box {
  text-align: center;
}

.empty-state p {
  color: var(--muted);
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-header {
    flex-direction: column;
  }

  .badge-row {
    justify-content: flex-start;
  }
}

@media (max-width: 650px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>