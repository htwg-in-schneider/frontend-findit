<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ActionDialog from '../components/ActionDialog.vue'
import { createContactRequest } from '../services/contactRequestService'
import {
  deleteItem,
  getItemById,
  getPossibleMatches,
  markItemAsReturned,
  type Item,
  type ItemStatus,
  type ItemType,
} from '../services/itemService'
import { useAuthStore } from '../stores/authStores'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const item = ref<Item | null>(null)
const matches = ref<Item[]>([])

const isLoading = ref(false)
const isLoadingMatches = ref(false)
const isSubmittingContact = ref(false)
const isReturning = ref(false)
const isDeleting = ref(false)

const errorMessage = ref('')
const matchErrorMessage = ref('')
const contactSuccessMessage = ref('')
const contactErrorMessage = ref('')
const returnSuccessMessage = ref('')
const returnErrorMessage = ref('')
const deleteErrorMessage = ref('')

const dialogMode = ref<'return' | 'delete' | null>(null)

const contactForm = reactive({
  senderName: '',
  senderEmail: '',
  message: '',
})

const itemId = computed(() => Number(route.params.id))

const isCurrentUserAdmin = computed(() => {
  return (
    authStore.currentUser?.role === 'ADMIN' &&
    authStore.currentUser.email === 'admin@findit.htwg-konstanz.de'
  )
})

const canManageCurrentItem = computed(() => {
  if (!item.value) {
    return false
  }

  if (isCurrentUserAdmin.value) {
    return true
  }

  return authStore.currentUser?.id === item.value.user.id
})

const isDialogOpen = computed(() => dialogMode.value !== null)

const dialogTitle = computed(() => {
  if (dialogMode.value === 'delete') {
    return 'Eintrag löschen?'
  }

  return 'Rückgabe bestätigen?'
})

const dialogMessage = computed(() => {
  if (dialogMode.value === 'delete') {
    return 'Dieser Eintrag wird dauerhaft gelöscht und verschwindet aus der Übersicht und von der Karte.'
  }

  return 'Der Eintrag wird als zurückgegeben markiert und gilt danach als abgeschlossen.'
})

const dialogAcceptText = computed(() => {
  if (dialogMode.value === 'delete') {
    return 'Ja, löschen'
  }

  return 'Rückgabe bestätigen'
})

const dialogVariant = computed<'primary' | 'danger'>(() => {
  return dialogMode.value === 'delete' ? 'danger' : 'primary'
})

const isDialogLoading = computed(() => {
  return isReturning.value || isDeleting.value
})

async function loadItem() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    item.value = await getItemById(itemId.value)
    await loadMatches()
  } catch (error) {
    console.error(error)
    item.value = null
    errorMessage.value = 'Der Eintrag konnte nicht geladen werden.'
  } finally {
    isLoading.value = false
  }
}

async function loadMatches() {
  isLoadingMatches.value = true
  matchErrorMessage.value = ''

  try {
    matches.value = await getPossibleMatches(itemId.value)
  } catch (error) {
    console.error(error)
    matches.value = []
    matchErrorMessage.value = 'Mögliche Treffer konnten nicht geladen werden.'
  } finally {
    isLoadingMatches.value = false
  }
}

async function submitContactRequest() {
  if (!item.value) {
    return
  }

  contactSuccessMessage.value = ''
  contactErrorMessage.value = ''
  returnSuccessMessage.value = ''
  returnErrorMessage.value = ''
  deleteErrorMessage.value = ''

  if (
    !contactForm.senderName.trim() ||
    !contactForm.senderEmail.trim() ||
    !contactForm.message.trim()
  ) {
    contactErrorMessage.value = 'Bitte fülle alle Felder der Kontaktanfrage aus.'
    return
  }

  if (!contactForm.senderEmail.includes('@')) {
    contactErrorMessage.value = 'Bitte gib eine gültige E-Mail-Adresse ein.'
    return
  }

  isSubmittingContact.value = true

  try {
    await createContactRequest({
      itemId: item.value.id,
      senderName: contactForm.senderName.trim(),
      senderEmail: contactForm.senderEmail.trim(),
      message: contactForm.message.trim(),
    })

    contactSuccessMessage.value = 'Deine Kontaktanfrage wurde gespeichert.'

    contactForm.senderName = ''
    contactForm.senderEmail = ''
    contactForm.message = ''

    await loadItem()
  } catch (error) {
    console.error(error)
    contactErrorMessage.value =
      'Die Kontaktanfrage konnte nicht gesendet werden. Bitte prüfe, ob das Backend läuft.'
  } finally {
    isSubmittingContact.value = false
  }
}

function openReturnDialog() {
  if (!canManageCurrentItem.value) {
    return
  }

  dialogMode.value = 'return'
}

function openDeleteDialog() {
  if (!canManageCurrentItem.value) {
    return
  }

  dialogMode.value = 'delete'
}

function closeDialog() {
  if (isDialogLoading.value) {
    return
  }

  dialogMode.value = null
}

async function runDialogAction() {
  if (dialogMode.value === 'return') {
    await markCurrentItemAsReturned()
    return
  }

  if (dialogMode.value === 'delete') {
    await removeCurrentItem()
  }
}

async function markCurrentItemAsReturned() {
  if (!item.value || !canManageCurrentItem.value) {
    return
  }

  returnSuccessMessage.value = ''
  returnErrorMessage.value = ''
  contactSuccessMessage.value = ''
  contactErrorMessage.value = ''
  deleteErrorMessage.value = ''
  isReturning.value = true

  try {
    item.value = await markItemAsReturned(item.value.id)
    returnSuccessMessage.value = 'Die Rückgabe wurde bestätigt. Der Eintrag ist abgeschlossen.'
    dialogMode.value = null
    await loadMatches()
  } catch (error) {
    console.error(error)
    returnErrorMessage.value =
      'Die Rückgabe konnte nicht bestätigt werden. Bitte prüfe, ob das Backend läuft.'
  } finally {
    isReturning.value = false
  }
}

async function removeCurrentItem() {
  if (!item.value || !canManageCurrentItem.value) {
    return
  }

  deleteErrorMessage.value = ''
  returnSuccessMessage.value = ''
  returnErrorMessage.value = ''
  contactSuccessMessage.value = ''
  contactErrorMessage.value = ''
  isDeleting.value = true

  try {
    await deleteItem(item.value.id)
    dialogMode.value = null
    router.push('/items')
  } catch (error) {
    console.error(error)
    deleteErrorMessage.value = 'Der Eintrag konnte nicht gelöscht werden.'
  } finally {
    isDeleting.value = false
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

          <article class="card matches-card">
            <div class="matches-header">
              <div>
                <p class="eyebrow small-eyebrow">Automatischer Abgleich</p>
                <h2>Mögliche Treffer</h2>
              </div>

              <span class="match-count">{{ matches.length }}</span>
            </div>

            <p class="description">
              findIT vergleicht diesen Eintrag mit passenden Gegenständen des jeweils anderen Typs.
            </p>

            <div v-if="isLoadingMatches" class="mini-state">
              Treffer werden geladen...
            </div>

            <div v-else-if="matchErrorMessage" class="inline-message error-message">
              {{ matchErrorMessage }}
            </div>

            <div v-else-if="matches.length === 0" class="mini-state">
              Aktuell wurden keine passenden Treffer gefunden.
            </div>

            <div v-else class="matches-grid">
              <article v-for="match in matches" :key="match.id" class="match-item">
                <div class="badge-row left">
                  <span class="badge" :class="typeBadgeClass(match.type)">
                    {{ typeLabel(match.type) }}
                  </span>

                  <span class="badge" :class="statusBadgeClass(match.status)">
                    {{ statusLabel(match.status) }}
                  </span>
                </div>

                <h3>{{ match.title }}</h3>

                <p>{{ match.location }} · {{ match.category }} · {{ match.date }}</p>

                <RouterLink :to="`/items/${match.id}`" class="btn-secondary">
                  Treffer ansehen
                </RouterLink>
              </article>
            </div>
          </article>

          <article v-if="canManageCurrentItem" class="card return-card">
            <div>
              <p class="eyebrow small-eyebrow">Rückgabe</p>
              <h2>Rückgabe bestätigen</h2>
              <p class="description">
                Sobald der Gegenstand erfolgreich zurückgegeben wurde, kann der Eintrag hier
                abgeschlossen werden.
              </p>
            </div>

            <div v-if="returnErrorMessage" class="inline-message error-message">
              {{ returnErrorMessage }}
            </div>

            <div v-if="returnSuccessMessage" class="inline-message success-message">
              {{ returnSuccessMessage }}
            </div>

            <button
              v-if="item.status !== 'RETURNED'"
              type="button"
              class="btn-primary"
              :disabled="isReturning"
              @click="openReturnDialog"
            >
              {{ isReturning ? 'Wird bestätigt...' : 'Rückgabe bestätigen' }}
            </button>

            <div v-else class="completed-box">
              Dieser Eintrag wurde bereits als zurückgegeben markiert.
            </div>
          </article>

          <article class="card contact-request-card">
            <div>
              <p class="eyebrow small-eyebrow">Kontakt aufnehmen</p>
              <h2>Kontaktanfrage senden</h2>
              <p class="description">
                Du denkst, dass dieser Gegenstand zu dir gehört oder du weitere Informationen hast?
                Dann sende eine Kontaktanfrage an die meldende Person.
              </p>
            </div>

            <form class="contact-request-form" @submit.prevent="submitContactRequest">
              <div class="form-grid contact-form-grid">
                <div class="form-group">
                  <label for="senderName">Dein Name</label>
                  <input
                    id="senderName"
                    v-model="contactForm.senderName"
                    type="text"
                    placeholder="Max Mustermann"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="senderEmail">Deine E-Mail</label>
                  <input
                    id="senderEmail"
                    v-model="contactForm.senderEmail"
                    type="email"
                    placeholder="max@example.com"
                    required
                  />
                </div>

                <div class="form-group full-width">
                  <label for="message">Nachricht</label>
                  <textarea
                    id="message"
                    v-model="contactForm.message"
                    placeholder="Beschreibe kurz, warum du die Person kontaktieren möchtest."
                    required
                  ></textarea>
                </div>
              </div>

              <div v-if="contactErrorMessage" class="inline-message error-message">
                {{ contactErrorMessage }}
              </div>

              <div v-if="contactSuccessMessage" class="inline-message success-message">
                {{ contactSuccessMessage }}
              </div>

              <div class="actions form-actions">
                <button type="submit" class="btn-primary" :disabled="isSubmittingContact">
                  {{ isSubmittingContact ? 'Wird gesendet...' : 'Kontaktanfrage senden' }}
                </button>
              </div>
            </form>
          </article>
        </div>

        <aside class="detail-sidebar">
          <div class="card contact-card">
            <h2>Gemeldet von</h2>

            <div class="user-avatar">
              {{ item.user.name.charAt(0).toUpperCase() }}
            </div>

            <strong>{{ item.user.name }}</strong>
            <p>{{ item.user.email }}</p>

            <div v-if="deleteErrorMessage" class="inline-message error-message">
              {{ deleteErrorMessage }}
            </div>

            <div class="actions sidebar-actions">
              <template v-if="canManageCurrentItem">
                <RouterLink :to="`/items/${item.id}/edit`" class="btn-primary">
                  Bearbeiten
                </RouterLink>

                <button type="button" class="btn-danger" @click="openDeleteDialog">
                  Löschen
                </button>
              </template>

              <RouterLink to="/items" class="btn-secondary">
                Zurück zur Übersicht
              </RouterLink>
            </div>
          </div>

          <div class="card process-card">
            <h2>Prozessstatus</h2>

            <ol>
              <li class="done">Eintrag wurde erstellt</li>
              <li :class="{ done: item.status !== 'OPEN' }">Kontaktanfrage gesendet</li>
              <li :class="{ done: matches.length > 0 }">Mögliche Treffer geprüft</li>
              <li :class="{ done: item.status === 'RETURNED' }">Rückgabe bestätigt</li>
            </ol>
          </div>
        </aside>
      </div>

      <div v-else class="card empty-state">
        <h1>Eintrag nicht gefunden</h1>
        <p>
          {{
            errorMessage ||
            'Der gesuchte Gegenstand existiert nicht oder wurde bereits gelöscht.'
          }}
        </p>
        <RouterLink to="/items" class="btn-primary">Zurück zur Übersicht</RouterLink>
      </div>
    </div>

    <ActionDialog
      :is-open="isDialogOpen"
      :title="dialogTitle"
      :message="dialogMessage"
      :accept-text="dialogAcceptText"
      cancel-text="Abbrechen"
      :variant="dialogVariant"
      :is-loading="isDialogLoading"
      @cancel="closeDialog"
      @accept="runDialogAction"
    />
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

.detail-header,
.matches-header {
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

.badge-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.badge-row.left {
  justify-content: flex-start;
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

.matches-card,
.return-card,
.contact-request-card {
  display: grid;
  gap: 24px;
}

.match-count {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #eff6ff;
  color: var(--primary);
  font-weight: 900;
  font-size: 1.3rem;
}

.matches-grid {
  display: grid;
  gap: 16px;
}

.match-item {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: #f8fafc;
  display: grid;
  gap: 12px;
}

.match-item h3 {
  margin: 0;
}

.match-item p {
  margin: 0;
  color: var(--muted);
}

.mini-state {
  padding: 18px;
  border-radius: 18px;
  background: #f8fafc;
  color: var(--muted);
  font-weight: 800;
}

.contact-request-form {
  display: grid;
  gap: 18px;
}

.contact-form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.full-width {
  grid-column: 1 / -1;
}

.contact-request-form textarea {
  min-height: 140px;
}

.inline-message {
  padding: 14px 16px;
  border-radius: 16px;
  font-weight: 700;
}

.error-message {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.success-message {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.completed-box {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  color: var(--muted);
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
  overflow-wrap: anywhere;
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

.process-card ol {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 12px;
  color: var(--muted);
  font-weight: 700;
}

.process-card li.done {
  color: var(--success);
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

  .detail-header,
  .matches-header {
    flex-direction: column;
  }

  .badge-row {
    justify-content: flex-start;
  }

  .info-grid,
  .contact-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>