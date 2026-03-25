# Atelier

Ein Unterrichtsmanagement-System nach dem Atelier-Prinzip, gebaut mit SvelteKit, Vite und automatischem GitHub Pages Deployment.

## Features

### Unterrichtsverwaltung
- **Zeitplan-Management** - Erstellen und verwalten Sie Zeitpläne für verschiedene Klassen und Lektionen
- **Vordefinierte Phasen** - Nutzen Sie Standardphasen wie "Einstieg", "Instruktion", "Freie Arbeitsphase", "Präsentation", "Reflexion" und "Pause"
- **Benutzerdefinierte Phasen** - Erstellen Sie eigene Phasen mit individuellen Namen, Icons und Farben
- **Live-Anzeige** - Beamer-Ansicht zeigt den aktuellen Unterrichtsverlauf mit Countdown und Fortschrittsbalken
- **Schüler-Timer** - Individuelle Timer für Schülerinnen und Schüler während freier Arbeitsphasen
- **Session-Steuerung** - Starten, pausieren, stoppen und navigieren Sie durch die Unterrichtsphasen

### Technologie
- **SvelteKit** - Modernes Web-Framework mit Svelte 5 und Runes
- **Vite** - Schnelles Build-Tool und Dev-Server
- **localStorage** - Alle Daten werden lokal im Browser gespeichert
- **Dunkles Theme** - Elegantes Design mit Hauptfarbe #007BC0
- **Responsive Design** - Optimiert für Desktop, Tablet und Mobile
- **GitHub Actions** - Automatisches Deployment auf GitHub Pages bei Push auf `main`
- **Static Site Generation (SSG)** - Prerendered Pages für optimale Performance

## Entwicklung

### Voraussetzungen

- Node.js 20 oder höher
- npm

### Installation

```bash
npm install
```

### Development Server starten

```bash
npm run dev
```

Die App ist dann unter `http://localhost:5173` verfügbar.

Um den Dev-Server in einem neuen Browser-Tab zu öffnen:

```bash
npm run dev -- --open
```

### Production Build

```bash
npm run build
```

Der Build wird im `build/` Verzeichnis erstellt.

### Production Build lokal testen

```bash
npm run preview
```

## Deployment

Das Projekt ist konfiguriert für automatisches Deployment auf GitHub Pages:

1. **Automatisches Deployment**: Bei jedem Push auf den `main` Branch wird automatisch ein Build erstellt und auf GitHub Pages deployed
2. **GitHub Pages URL**: `https://gymmu.github.io/atelier/`
3. **GitHub Actions Workflow**: `.github/workflows/deploy.yml`

### GitHub Repository Setup

Um GitHub Pages zu aktivieren:

1. Gehe zu deinen Repository Settings
2. Navigiere zu **Pages** im linken Menü
3. Unter **Source** wähle **GitHub Actions**
4. Der erste Push auf `main` triggert das Deployment

## Verwendung

### Admin-Bereich (`/admin`)

1. **Zeitplan erstellen**: Klicken Sie auf "+ Neu" in der linken Seitenleiste
2. **Phasen hinzufügen**: Wählen Sie vordefinierte Phasen oder erstellen Sie eigene
3. **Session starten**: Klicken Sie auf "Session starten" um den Unterricht zu beginnen
4. **Timer hinzufügen**: Fügen Sie individuelle Timer für Schülerinnen und Schüler hinzu
5. **Beamer-Ansicht öffnen**: Klicken Sie auf "🖥️ Beamer-Ansicht öffnen" für die Live-Anzeige

### Beamer-Ansicht (`/display`)

Die Beamer-Ansicht zeigt:
- Aktuelle Unterrichtsphase mit großem Countdown
- Gesamtfortschritt und Phasenfortschritt
- Nächste Phase in der Übersicht
- Alle aktiven Schüler-Timer
- Aktuelle Uhrzeit und Datum

💡 **Tipp**: Drücken Sie F11 für Vollbildmodus auf dem Beamer

## Projektstruktur

```
atelier/
├── .github/
│   └── workflows/
│       └── deploy.yml                 # GitHub Actions Workflow
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── admin/                # Admin-Interface Components
│   │   │   │   ├── ClassSelector.svelte
│   │   │   │   ├── PhaseForm.svelte
│   │   │   │   ├── ScheduleEditor.svelte
│   │   │   │   └── TimerManager.svelte
│   │   │   ├── display/              # Beamer-Ansicht Components
│   │   │   │   ├── CurrentPhase.svelte
│   │   │   │   ├── NextPhase.svelte
│   │   │   │   ├── ProgressBar.svelte
│   │   │   │   └── StudentTimers.svelte
│   │   │   └── shared/               # Gemeinsame Components
│   │   │       ├── PhaseIcon.svelte
│   │   │       └── Timer.svelte
│   │   ├── stores/                   # Svelte 5 Stores (Runes)
│   │   │   ├── schedule.svelte.js
│   │   │   └── timers.svelte.js
│   │   └── utils/                    # Utility-Funktionen
│   │       ├── constants.js
│   │       ├── storage.js
│   │       └── timer.js
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── +page.svelte          # Admin-Interface
│   │   │   └── +page.js
│   │   ├── display/
│   │   │   ├── +page.svelte          # Beamer-Ansicht
│   │   │   └── +page.js
│   │   ├── +layout.svelte            # Layout mit globalem CSS
│   │   ├── +layout.js                # Prerender Konfiguration
│   │   └── +page.svelte              # Landing Page
│   ├── app.html                      # HTML Template
│   └── app.css                       # Globale Styles
├── static/
│   └── .nojekyll                     # Wichtig für GitHub Pages
├── svelte.config.js                  # SvelteKit Konfiguration
├── vite.config.js                    # Vite Konfiguration
└── package.json
```

## Technologien

- **SvelteKit** `^2.50.2` - Framework
- **Svelte** `^5.54.0` - UI Library
- **Vite** `^7.3.1` - Build Tool
- **@sveltejs/adapter-static** `^3.0.10` - Static Site Adapter für GitHub Pages

## Design

- **Hauptfarbe**: #007BC0 (Blau)
- **Hintergrund**: Dunkle Farbpalette (#0d1117, #010409)
- **Text**: Helle Schrift (#e6edf3)
- **Animationen**: Fade-in und Slide-in Effekte
