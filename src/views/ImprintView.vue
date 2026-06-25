<template>
  <section class="page-section legal-page">
    <div class="container">
      <p class="eyebrow">Rechtliches</p>
      <h1 class="section-title">Impressum</h1>

      <article class="card legal-card">
        <h2>Angaben gemäß § 5 DDG</h2>

        <p>
          findIT ist ein studentisches Webprojekt im Rahmen der Vorlesung
          Web-Technologien an der HTWG Konstanz.
        </p>

        <div class="legal-block">
          <h3>Verantwortlich für den Inhalt</h3>
          <p>
            Haris Melunovic<br />
            Amil Melunovic<br />
            Hochschule Konstanz Technik, Wirtschaft und Gestaltung<br />
            Alfred-Wachtel-Straße 8<br />
            78462 Konstanz
          </p>
        </div>

        <div class="legal-block">
          <h3>Kontakt</h3>
          <p>
            E-Mail:
            <a href="mailto:haris.melunovic@htwg-konstanz.de">
              haris.melunovic@htwg-konstanz.de
            </a>
            <br />
            E-Mail:
            <a href="mailto:amil.melunovic@htwg-konstanz.de">
              amil.melunovic@htwg-konstanz.de
            </a>
          </p>
        </div>

        <div class="legal-block">
          <h3>Hinweis</h3>
          <p>
            Diese Website dient ausschließlich Studien- und Demonstrationszwecken.
            Es handelt sich nicht um ein kommerzielles Angebot.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.legal-page {
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 30%),
    linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.legal-card {
  max-width: 860px;
}

.legal-card p {
  color: var(--muted);
  line-height: 1.8;
}

.legal-block {
  margin-top: 28px;
}

.legal-block h3 {
  margin-bottom: 10px;
}

.legal-block a {
  color: var(--primary);
  font-weight: 800;
  text-decoration: none;
}

.legal-block a:hover {
  text-decoration: underline;
}
</style>