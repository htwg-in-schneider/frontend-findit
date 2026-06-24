<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  getContactRequests,
  updateContactRequestStatus,
  type ContactRequest,
  type ContactRequestStatus,
} from '../services/contactRequestService'

const requests = ref<ContactRequest[]>([])
const isLoading = ref(false)
const updatingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

const query = ref('')
const selectedStatus = ref('')

const filteredRequests = computed(() => {
  const search = query.value.trim().toLowerCase()

  return requests.value.filter((request) => {
    const matchesStatus = !selectedStatus.value || request.status === selectedStatus.value

    const matchesSearch =
      !search ||
      request.senderName.toLowerCase().includes(search) ||
      request.senderEmail.toLowerCase().includes(search) ||
      request.message.toLowerCase().includes(search) ||
      request.item.title.toLowerCase().includes(search) ||
      request.item.location.toLowerCase().includes(search)

    return matchesStatus && matchesSearch
  })
})

const openRequestsCount = computed(() => {
  return requests.value.filter((request) => request.status === 'NEW').length
})

const inProgressRequestsCount = computed(() => {
  return requests.value.filter((request) => request.status === 'IN_PROGRESS').length
})

const resolvedRequestsCount = computed(() => {
  return requests.value.filter((request) => request.status === 'RESOLVED').length
})

async function loadRequests() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    requests.value = await getContactRequests()
  } catch (error) {
    console.error(error)
    errorMessage.value =
      'Kontaktanfragen konnten nicht geladen werden. Bitte prüfe, ob das Backend läuft.'
  } finally {
    isLoading.value = false
  }
}

async function changeStatus(id: number, status: ContactRequestStatus) {
  updatingId.value = id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const updatedRequest = await updateContactRequestStatus(id, status)

    requests.value = requests.value.map((request) =>
      request.id === id ? updatedRequest : request,
    )

    successMessage.value = 'Der Status der Kontaktanfrage wurde aktualisiert.'
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Der Status konnte nicht aktualisiert werden.'
  } finally {
    updatingId.value = null
  }
}

function resetFilters() {
  query.value = ''
  selectedStatus.value = ''
}

function statusLabel(status: ContactRequestStatus) {
  const labels: Record<ContactRequestStatus, string> = {
    NEW: 'Neu',
    IN_PROGRESS: 'In Bearbeitung',
    RESOLVED: 'Erledigt',
  }

  return labels[status]
}

function statusBadgeClass(status: ContactRequestStatus) {
  const classes: Record<ContactRequestStatus, string> = {
    NEW: 'status-new',
    IN_PROGRESS: 'status-progress',
    RESOLVED: 'status-resolved',
  }

  return classes[status]
}

function formatDate(value: string) {
  if (!value) {
    return 'Kein Datum'
  }

  return new Date(value).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(loadRequests)
</script>

<template>
  <section class="admin-page">
    <div class="container">
      <div class="admin-header">
        <div>
          <p class="eyebrow">Admin-Bereich</p>
          <h1 class="section-title">Kontaktanfragen</h1>
          <p class="section-subtitle">
            Hier werden alle Kontaktanfragen angezeigt, die Nutzer zu verlorenen oder gefundenen
            Gegenständen gesendet haben.
          </p>
        </div>

        <RouterLink to="/admin" class="btn-secondary">Zurück zum Admin-Dashboard</RouterLink>
      </div>

      <div class="stats-grid">
        <article class="stat-card">
          <span>Neu</span>
          <strong>{{ openRequestsCount }}</strong>
        </article>

        <article class="stat-card">
          <span>In Bearbeitung</span>
          <strong>{{ inProgressRequestsCount }}</strong>
        </article>

        <article class="stat-card">
          <span>Erledigt</span>
          <strong>{{ resolvedRequestsCount }}</strong>
        </article>
      </div>

      <div class="card filter-card">
        <div class="filter-grid">
          <div class="form-group">
            <label for="request-search">Suche</label>
            <input
              id="request-search"
              v-model="query"
              type="search"
              placeholder="Name, E-Mail, Nachricht, Gegenstand oder Ort"
            />
          </div>

          <div class="form-group">
            <label for="request-status">Status</label>
            <select id="request-status" v-model="selectedStatus">
              <option value="">Alle Status</option>
              <option value="NEW">Neu</option>
              <option value="IN_PROGRESS">In Bearbeitung</option>
              <option value="RESOLVED">Erledigt</option>
            </select>
          </div>
        </div>

        <div class="actions filter-actions">
          <button type="button" class="btn-secondary" @click="resetFilters">
            Filter zurücksetzen
          </button>

          <button type="button" class="btn-primary" :disabled="isLoading" @click="loadRequests">
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
        Kontaktanfragen werden geladen...
      </div>

      <template v-else>
        <div class="results-info">
          <strong>{{ filteredRequests.length }}</strong>
          Kontaktanfragen gefunden
        </div>

        <div v-if="filteredRequests.length > 0" class="requests-grid">
          <article
            v-for="request in filteredRequests"
            :key="request.id"
            class="card request-card"
          >
            <div class="request-header">
              <div>
                <span class="request-id">#{{ request.id }}</span>
                <h2>{{ request.item.title }}</h2>
              </div>

              <span class="request-status" :class="statusBadgeClass(request.status)">
                {{ statusLabel(request.status) }}
              </span>
            </div>

            <dl class="request-meta">
              <div>
                <dt>Absender</dt>
                <dd>{{ request.senderName }}</dd>
              </div>

              <div>
                <dt>E-Mail</dt>
                <dd>
                  <a :href="`mailto:${request.senderEmail}`">{{ request.senderEmail }}</a>
                </dd>
              </div>

              <div>
                <dt>Gegenstand</dt>
                <dd>
                  <RouterLink :to="`/items/${request.item.id}`">
                    {{ request.item.title }}
                  </RouterLink>
                </dd>
              </div>

              <div>
                <dt>Ort</dt>
                <dd>{{ request.item.location }}</dd>
              </div>

              <div>
                <dt>Erstellt am</dt>
                <dd>{{ formatDate(request.createdAt) }}</dd>
              </div>
            </dl>

            <div class="message-box">
              <strong>Nachricht</strong>
              <p>{{ request.message }}</p>
            </div>

            <div class="status-actions">
              <button
                type="button"
                class="btn-secondary"
                :disabled="updatingId === request.id || request.status === 'NEW'"
                @click="changeStatus(request.id, 'NEW')"
              >
                Neu
              </button>

              <button
                type="button"
                class="btn-secondary"
                :disabled="updatingId === request.id || request.status === 'IN_PROGRESS'"
                @click="changeStatus(request.id, 'IN_PROGRESS')"
              >
                In Bearbeitung
              </button>

              <button
                type="button"
                class="btn-primary"
                :disabled="updatingId === request.id || request.status === 'RESOLVED'"
                @click="changeStatus(request.id, 'RESOLVED')"
              >
                Erledigt
              </button>
            </div>
          </article>
        </div>

        <div v-else class="card empty-state">
          <h2>Keine Kontaktanfragen gefunden</h2>
          <p>Ändere deine Suche oder lege über eine Detailseite eine neue Kontaktanfrage an.</p>
        </div>
      </template>
    </div>
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;
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
  margin-bottom: 24px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 18px;
}

.filter-actions {
  margin-top: 18px;
}

.results-info {
  margin: 20px 0;
  color: var(--muted);
}

.requests-grid {
  display: grid;
  gap: 22px;
}

.request-card {
  display: grid;
  gap: 18px;
}

.request-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.request-id {
  color: var(--muted);
  font-weight: 900;
}

.request-header h2 {
  margin: 4px 0 0;
  font-size: 1.35rem;
}

.request-status {
  display: inline-flex;
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 900;
  white-space: nowrap;
}

.status-new {
  background: #dbeafe;
  color: #1e40af;
}

.status-progress {
  background: #fef3c7;
  color: #92400e;
}

.status-resolved {
  background: #dcfce7;
  color: #166534;
}

.request-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
}

.request-meta div {
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
}

.request-meta dt {
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 800;
}

.request-meta dd {
  margin: 4px 0 0;
  font-weight: 800;
}

.request-meta a {
  color: var(--primary);
}

.message-box {
  padding: 18px;
  border-radius: 18px;
  background: #f8fafc;
}

.message-box strong {
  display: block;
  margin-bottom: 8px;
}

.message-box p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.status-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  margin-bottom: 20px;
}

.success-box {
  border-color: #bbf7d0;
  background: #dcfce7;
  color: #166534;
  margin-bottom: 20px;
  font-weight: 800;
}

.empty-state p {
  color: var(--muted);
}

@media (max-width: 850px) {
  .admin-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid,
  .filter-grid,
  .request-meta {
    grid-template-columns: 1fr;
  }

  .request-header {
    flex-direction: column;
  }

  .status-actions {
    flex-direction: column;
  }

  .status-actions button {
    width: 100%;
  }
}
</style>