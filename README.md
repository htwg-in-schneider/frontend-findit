# findIT Frontend

findIT ist eine Webanwendung für verlorene und gefundene Gegenstände auf dem Campus. Nutzerinnen und Nutzer können Gegenstände melden, Einträge durchsuchen, Kontaktanfragen senden und mögliche Treffer prüfen. Administratorinnen und Administratoren können zusätzlich Nutzer, Kategorien und Kontaktanfragen verwalten.

## Technologien

* Vue 3
* TypeScript
* Vite
* Vue Router
* Pinia
* Auth0 Vue SDK
* Leaflet / OpenStreetMap
* REST-Anbindung an ein Spring-Boot-Backend

## Lokale Installation

```bash
npm install
```

## Lokaler Start

```bash
npm run dev
```

Das Frontend läuft lokal standardmäßig unter:

```text
http://localhost:5173
```

## Backend-Verbindung

Die Backend-URL wird über eine Environment Variable gesetzt.

Für lokale Entwicklung liegt diese Datei im Frontend-Projekt:

```text
.env.development
```

Inhalt:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Dadurch greift das Frontend lokal auf das Backend unter `http://localhost:8080/api` zu.

Für Deployment muss diese Variable auf die echte Backend-Adresse zeigen:

```env
VITE_API_BASE_URL=https://DEINE-BACKEND-ADRESSE.onrender.com/api
```

## Authentifizierung

Lokal nutzt findIT standardmäßig einen Demo-Login. Dadurch kann die Anwendung ohne Auth0-Konfiguration entwickelt und getestet werden.

Lokale Einstellung:

```env
VITE_AUTH_ENABLED=false
```

Für Deployment kann Auth0 aktiviert werden:

```env
VITE_AUTH_ENABLED=true
VITE_AUTH0_DOMAIN=DEINE-AUTH0-DOMAIN.eu.auth0.com
VITE_AUTH0_CLIENT_ID=DEINE_AUTH0_CLIENT_ID
VITE_AUTH0_AUDIENCE=https://findit-api
VITE_AUTH0_REDIRECT_URI=https://DEIN-GITHUB-USERNAME.github.io/DEIN-FRONTEND-REPO/
VITE_AUTH0_LOGOUT_RETURN_TO=https://DEIN-GITHUB-USERNAME.github.io/DEIN-FRONTEND-REPO/
```

Wenn Auth0 aktiviert ist, sendet das Frontend bei geschützten API-Anfragen automatisch ein JWT im Header:

```text
Authorization: Bearer <token>
```

Das Backend kann dieses Token prüfen und daraus den aktuellen Nutzer ermitteln.

## Demo-Zugänge für lokale Entwicklung

| Rolle  | Name           | E-Mail                                                                    |
| ------ | -------------- | ------------------------------------------------------------------------- |
| Nutzer | Max Mustermann | [max.mustermann@htwg-konstanz.de](mailto:max.mustermann@htwg-konstanz.de) |
| Nutzer | Dennis Müller  | [dennis.mueller@htwg-konstanz.de](mailto:dennis.mueller@htwg-konstanz.de) |
| Admin  | Admin findIT   | [admin@findit.htwg-konstanz.de](mailto:admin@findit.htwg-konstanz.de)     |

Für echtes Auth0 müssen Auth0-Nutzer mit passenden E-Mail-Adressen angelegt werden. Das Backend verknüpft den Auth0-Nutzer über die E-Mail-Adresse mit dem findIT-Nutzer in der Datenbank.

## Rollen und Rechte

### Gast

Ein Gast kann:

* Startseite ansehen
* Einträge ansehen
* Detailseiten ansehen
* Karte ansehen
* Kontaktanfragen senden
* Impressum und Datenschutzerklärung ansehen

### Nutzer

Ein angemeldeter Nutzer kann zusätzlich:

* eigene Gegenstände melden
* eigene Einträge bearbeiten
* eigene Einträge löschen
* eigene Einträge als zurückgegeben markieren

### Admin

Ein Admin kann zusätzlich:

* alle Einträge verwalten
* Nutzer verwalten
* Kategorien verwalten
* Kontaktanfragen verwalten
* Admin-Dashboard nutzen

## Wichtige Routen

```text
/                         Startseite
/login                    Login
/items                    Eintragsübersicht
/items/new                Gegenstand melden
/items/:id                Detailseite eines Eintrags
/items/:id/edit           Eintrag bearbeiten
/map                      Karte
/admin                    Admin-Dashboard
/admin/users              Nutzerverwaltung
/admin/categories         Kategorienverwaltung
/admin/contact-requests   Kontaktanfragenverwaltung
/impressum                Impressum
/datenschutz              Datenschutzerklärung
```

## Build für Produktion

```bash
npm run build
```

Der Produktionsbuild wird im Ordner `dist` erstellt.

## Produktionsbuild lokal testen

```bash
npm run preview
```

## Deployment über GitHub Pages

Das Frontend ist für GitHub Pages vorbereitet.

Der Workflow liegt unter:

```text
.github/workflows/deploy.yml
```

Der Workflow wird beim Push auf `main` ausgeführt.

In GitHub müssen für das Frontend-Repository folgende Secrets gesetzt werden:

```text
VITE_API_BASE_URL
VITE_AUTH_ENABLED
VITE_AUTH0_DOMAIN
VITE_AUTH0_CLIENT_ID
VITE_AUTH0_AUDIENCE
VITE_AUTH0_REDIRECT_URI
VITE_AUTH0_LOGOUT_RETURN_TO
```

Beispielwerte:

```env
VITE_API_BASE_URL=https://findit-backend.onrender.com/api
VITE_AUTH_ENABLED=true
VITE_AUTH0_DOMAIN=deine-domain.eu.auth0.com
VITE_AUTH0_CLIENT_ID=deine-client-id
VITE_AUTH0_AUDIENCE=https://findit-api
VITE_AUTH0_REDIRECT_URI=https://DEIN-GITHUB-USERNAME.github.io/frontend-findit/
VITE_AUTH0_LOGOUT_RETURN_TO=https://DEIN-GITHUB-USERNAME.github.io/frontend-findit/
```

Der Vite-Base-Pfad wird im GitHub-Actions-Workflow automatisch über den Repository-Namen gesetzt:

```env
VITE_BASE_PATH=/${{ github.event.repository.name }}/
```

Dadurch funktioniert die Anwendung auch, wenn sie auf GitHub Pages in einem Unterpfad liegt.

## Lokaler Test vor Abgabe

Vor einem Push auf `main` sollte lokal geprüft werden:

```bash
npm install
npm run build
npm run dev
```

Anschließend sollten diese Bereiche getestet werden:

```text
/login
/items
/items/new
/items/:id
/map
/admin
/admin/users
/admin/categories
/admin/contact-requests
/impressum
/datenschutz
```
