<template>
  <section class="admin-page">
    <div class="container">
      <div class="admin-hero">
        <div>
          <p class="eyebrow">Admin-Bereich</p>
          <h1 class="section-title">findIT verwalten</h1>
          <p class="section-subtitle">
            Im Admin-Bereich können Einträge, Nutzer, Kategorien und Vorgänge zentral überprüft
            und verwaltet werden.
          </p>
        </div>

        <RouterLink to="/items/new" class="btn-primary">Neuen Eintrag erstellen</RouterLink>
      </div>

      <div class="admin-stats">
        <article class="stat-card">
          <span>Einträge</span>
          <strong>CRUD</strong>
          <p>Gegenstände anzeigen, bearbeiten und löschen.</p>
        </article>

        <article class="stat-card">
          <span>Vorgänge</span>
          <strong>Kontakt</strong>
          <p>Kontaktanfragen und Rückgaben nachvollziehen.</p>
        </article>

        <article class="stat-card">
          <span>Stammdaten</span>
          <strong>User & Kategorien</strong>
          <p>Nutzer und Kategorien administrieren.</p>
        </article>
      </div>

      <div class="admin-grid">
        <RouterLink to="/items" class="admin-card">
          <div class="admin-icon">📦</div>
          <div>
            <h2>Einträge verwalten</h2>
            <p>
              Alle verlorenen und gefundenen Gegenstände einsehen, suchen, bearbeiten oder löschen.
            </p>
          </div>
          <span>Öffnen →</span>
        </RouterLink>

        <RouterLink to="/map" class="admin-card">
          <div class="admin-icon">🗺️</div>
          <div>
            <h2>Kartenansicht prüfen</h2>
            <p>
              Kontrollieren, ob Einträge korrekt auf der Campuskarte dargestellt werden.
            </p>
          </div>
          <span>Öffnen →</span>
        </RouterLink>

        <RouterLink to="/admin/contact-requests" class="admin-card">
          <div class="admin-icon">💬</div>
          <div>
            <h2>Kontaktanfragen</h2>
            <p>
              Eingegangene Kontaktanfragen und Rückgabeprozesse nachvollziehen.
            </p>
          </div>
          <span>Öffnen →</span>
        </RouterLink>

<RouterLink to="/admin/users" class="admin-card">
  <div class="admin-icon">👥</div>
  <div>
    <h2>Nutzerverwaltung</h2>
    <p>
      Nutzer anzeigen, bearbeiten und später Rollen wie User/Admin verwalten.
    </p>
  </div>
  <span>Öffnen →</span>
</RouterLink>

<RouterLink to="/admin/categories" class="admin-card">
  <div class="admin-icon">🏷️</div>
  <div>
    <h2>Kategorien</h2>
    <p>
      Kategorien und Stammdaten der Anwendung zentral verwalten.
    </p>
  </div>
  <span>Öffnen →</span>
</RouterLink>

        <RouterLink to="/datenschutz" class="admin-card">
          <div class="admin-icon">🔒</div>
          <div>
            <h2>Datenschutz prüfen</h2>
            <p>
              Prüfen, ob Datenschutzhinweise zu Nutzerdaten, Auth und Hosting vorhanden sind.
            </p>
          </div>
          <span>Öffnen →</span>
        </RouterLink>
      </div>
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

.admin-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 28px;
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
  display: block;
  color: var(--primary);
  font-size: 1.6rem;
  margin-bottom: 8px;
}

.stat-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.admin-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  align-items: center;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 28px;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: 0.2s ease;
}

.admin-card:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: var(--shadow-md);
}

.admin-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: #eff6ff;
  font-size: 1.6rem;
}

.admin-card h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
}

.admin-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.admin-card span {
  color: var(--primary);
  font-weight: 900;
  white-space: nowrap;
}

.disabled-card {
  opacity: 0.82;
}

.disabled-card span {
  color: var(--accent);
}

@media (max-width: 900px) {
  .admin-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-stats,
  .admin-grid {
    grid-template-columns: 1fr;
  }

  .admin-card {
    grid-template-columns: 1fr;
  }
}
</style>