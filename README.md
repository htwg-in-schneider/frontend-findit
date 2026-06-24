# findIT Frontend

findIT ist eine Webanwendung für verlorene und gefundene Gegenstände auf dem Campus. Nutzerinnen und Nutzer können Gegenstände melden, Einträge durchsuchen, Kontaktanfragen senden und mögliche Treffer prüfen. Administratorinnen und Administratoren können zusätzlich Nutzer, Kategorien und Kontaktanfragen verwalten.

## Technologien

* Vue 3
* TypeScript
* Vite
* Vue Router
* Pinia
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

```
http://localhost:5173
```

## Verbindung zum Backend

Die Backend-URL wird über eine Environment Variable gesetzt.

Für lokale Entwicklung liegt diese Datei im Frontend-Projekt:

```
.env.development
```

Inhalt:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Dadurch greift das Frontend lokal auf das Backend unter `http://localhost:8080/api` zu.

Für die produktive Umgebung muss die Variable auf die echte Backend-Adresse zeigen, zum Beispiel:

```env
VITE_API_BASE_URL=https://findit-backend.example.com/api
```

## Wichtige Routen

```
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

## Rollen im Frontend

### Gast

Ein Gast kann die Startseite, Einträge, Detailseiten, die Karte, Impressum und Datenschutzerklärung aufrufen. Außerdem kann ein Gast Kontaktanfragen zu Einträgen senden.

### Nutzer

Ein angemeldeter Nutzer kann zusätzlich eigene Gegenstände melden, eigene Einträge bearbeiten, eigene Einträge löschen und eigene Einträge als zurückgegeben markieren.

### Admin

Ein Admin kann zusätzlich alle Einträge verwalten, Nutzer verwalten, Kategorien verwalten und Kontaktanfragen nachvollziehen und bearbeiten.

## Demo-Zugänge

Für die Entwicklung werden folgende Demo-Zugänge im Frontend angeboten:

| Rolle  | Name           | E-Mail                                                                    |
| ------ | -------------- | ------------------------------------------------------------------------- |
| Nutzer | Max Mustermann | [max.mustermann@htwg-konstanz.de](mailto:max.mustermann@htwg-konstanz.de) |
| Nutzer | Dennis Müller  | [dennis.mueller@htwg-konstanz.de](mailto:dennis.mueller@htwg-konstanz.de) |
| Admin  | Admin findIT   | [admin@findit.htwg-konstanz.de](mailto:admin@findit.htwg-konstanz.de)     |

Der aktuelle Login ist ein Demo-Login im Frontend. Für eine produktive Anwendung müsste dieser durch eine vollständige Authentifizierung, zum Beispiel über Auth0, ersetzt werden.

## Build für Produktion

```bash
npm run build
```

Der Produktionsbuild wird im Ordner `dist` erstellt.

## Produktionsbuild lokal testen

```bash
npm run preview
```

## Deployment

Das Frontend soll für die Abgabe als GitHub Page deployed werden. Dafür muss beim Build die produktive Backend-URL gesetzt sein:

```env
VITE_API_BASE_URL=https://DEINE-BACKEND-ADRESSE/api
```

Nach Änderung dieser Variable muss das Frontend neu gebaut und neu deployed werden, da Vite Environment Variables beim Build in den Code einbettet.
