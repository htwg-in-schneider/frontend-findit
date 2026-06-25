<script setup lang="ts">
import { reactive, ref } from 'vue'
import MiniMapPreview from '../components/MiniMapPreview.vue'

const contactForm = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const contactErrorMessage = ref('')
const contactSuccessMessage = ref('')

function prepareContactMail() {
  contactErrorMessage.value = ''
  contactSuccessMessage.value = ''

  if (
    !contactForm.name.trim() ||
    !contactForm.email.trim() ||
    !contactForm.subject.trim() ||
    !contactForm.message.trim()
  ) {
    contactErrorMessage.value = 'Bitte fülle alle Felder aus.'
    return
  }

  if (!contactForm.email.includes('@')) {
    contactErrorMessage.value = 'Bitte gib eine gültige E-Mail-Adresse ein.'
    return
  }

  const recipients = 'haris.melunovic@htwg-konstanz.de'
  const cc = 'amil.melunovic@htwg-konstanz.de'
  const subject = encodeURIComponent(`[findIT] ${contactForm.subject.trim()}`)
  const body = encodeURIComponent(
    [
      'Hallo findIT-Team,',
      '',
      contactForm.message.trim(),
      '',
      '---',
      `Name: ${contactForm.name.trim()}`,
      `E-Mail: ${contactForm.email.trim()}`,
    ].join('\n'),
  )

  window.location.href = `mailto:${recipients}?cc=${encodeURIComponent(cc)}&subject=${subject}&body=${body}`

  contactSuccessMessage.value = 'Dein E-Mail-Programm wurde geöffnet.'
}
</script>

<template>
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-content">
        <p class="eyebrow">Campus Lost & Found</p>

        <h1>Verloren? Gefunden? findIT bringt Dinge zurück.</h1>

        <p class="hero-text">
          findIT hilft Studierenden dabei, verlorene und gefundene Gegenstände auf dem Campus
          strukturiert zu melden, zu suchen und wieder an die richtige Person zurückzugeben.
        </p>

        <div class="actions">
          <RouterLink to="/items/new" class="btn-primary">Gegenstand melden</RouterLink>
          <RouterLink to="/items" class="btn-secondary">Einträge ansehen</RouterLink>
        </div>
      </div>

      <div class="hero-card">
        <MiniMapPreview />

        <div class="preview-list">
          <div class="preview-item">
            <span class="badge badge-found">Gefunden</span>
            <strong>Live-Karte</strong>
            <small>Einträge mit echten Kartenpositionen</small>
          </div>

          <div class="preview-item">
            <span class="badge badge-lost">Verloren</span>
            <strong>Campusübersicht</strong>
            <small>Fund- und Verlustorte direkt sichtbar</small>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="page-section">
    <div class="container">
      <h2 class="section-title">So funktioniert findIT</h2>
      <p class="section-subtitle">
        Die Anwendung verbindet Meldungen zu verlorenen und gefundenen Gegenständen mit Suche,
        Filtern, Eintragsdetails und einer interaktiven Kartenansicht.
      </p>

      <div class="grid grid-3 feature-grid">
        <article class="card feature-card">
          <div class="feature-icon">📝</div>
          <h3>Gegenstand erfassen</h3>
          <p>
            Nutzer melden verlorene oder gefundene Gegenstände mit Titel, Kategorie, Ort, Datum,
            Beschreibung und automatisch ermittelter Kartenposition.
          </p>
        </article>

        <article class="card feature-card">
          <div class="feature-icon">🔎</div>
          <h3>Suchen und filtern</h3>
          <p>
            Einträge können nach Suchbegriffen sowie Kriterien wie Typ, Kategorie, Ort und Status
            eingegrenzt werden.
          </p>
        </article>

        <article class="card feature-card">
          <div class="feature-icon">🗺️</div>
          <h3>Auf der Karte anzeigen</h3>
          <p>
            Fund- und Verlustorte werden anhand gespeicherter Koordinaten auf einer echten
            OpenStreetMap-Karte dargestellt.
          </p>
        </article>
      </div>
    </div>
  </section>

  <section id="kontakt" class="page-section contact-section">
    <div class="container contact-grid">
      <div>
        <p class="eyebrow">Kontakt</p>
        <h2 class="section-title">Fragen oder Hinweise?</h2>
        <p class="section-subtitle">
          Über das Kontaktformular kann schnell eine Nachricht an das findIT-Team vorbereitet
          werden. Der Versand erfolgt über dein eigenes E-Mail-Programm.
        </p>
      </div>

      <form class="card contact-form" @submit.prevent="prepareContactMail" novalidate>
        <div v-if="contactErrorMessage" class="contact-error">
          {{ contactErrorMessage }}
        </div>

        <div v-if="contactSuccessMessage" class="contact-success">
          {{ contactSuccessMessage }}
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="name">Name</label>
            <input
              id="name"
              v-model="contactForm.name"
              name="name"
              type="text"
              autocomplete="name"
              placeholder="Dein Name"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">E-Mail</label>
            <input
              id="email"
              v-model="contactForm.email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="deine.mail@example.com"
              required
            />
          </div>

          <div class="form-group full-width">
            <label for="subject">Betreff</label>
            <input
              id="subject"
              v-model="contactForm.subject"
              name="subject"
              type="text"
              placeholder="Worum geht es?"
              required
            />
          </div>

          <div class="form-group full-width">
            <label for="message">Nachricht</label>
            <textarea
              id="message"
              v-model="contactForm.message"
              name="message"
              autocomplete="off"
              placeholder="Beschreibe dein Anliegen kurz."
              required
            ></textarea>
          </div>
        </div>

        <div class="actions form-actions">
          <button type="submit" class="btn-primary">Nachricht vorbereiten</button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 88px 0 72px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 34%),
    linear-gradient(135deg, #eff6ff 0%, #ffffff 46%, #fff7ed 100%);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 48px;
  align-items: center;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.7rem, 6vw, 5rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.hero-text {
  margin: 24px 0;
  color: var(--muted);
  font-size: 1.15rem;
  line-height: 1.8;
  max-width: 650px;
}

.hero-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 32px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.preview-list {
  display: grid;
  gap: 14px;
  padding: 22px;
}

.preview-item {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
}

.preview-item small {
  color: var(--muted);
}

.feature-grid {
  margin-top: 32px;
}

.feature-card h3 {
  margin: 14px 0 8px;
}

.feature-card p {
  color: var(--muted);
  line-height: 1.7;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #eff6ff;
  font-size: 1.5rem;
}

.contact-section {
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
}

.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1.15fr);
  gap: 40px;
  align-items: start;
}

.contact-form {
  padding: 28px;
}

.contact-error,
.contact-success {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 16px;
  font-weight: 800;
}

.contact-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.contact-success {
  border: 1px solid #bbf7d0;
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 850px) {
  .hero {
    padding: 56px 0;
  }

  .hero-grid,
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>