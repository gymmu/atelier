# Atelier

Eine moderne Landing Page gebaut mit SvelteKit, Vite und automatischem GitHub Pages Deployment.

## Features

- **SvelteKit** - Modernes Web-Framework mit Svelte 5
- **Vite** - Schnelles Build-Tool und Dev-Server
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

## Projektstruktur

```
atelier/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions Workflow
├── src/
│   ├── routes/
│   │   ├── +layout.svelte      # Layout mit globalem CSS Import
│   │   ├── +layout.js          # Prerender Konfiguration
│   │   └── +page.svelte        # Landing Page
│   ├── app.html                # HTML Template
│   └── app.css                 # Globale Styles
├── static/
│   └── .nojekyll               # Wichtig für GitHub Pages
├── svelte.config.js            # SvelteKit Konfiguration
├── vite.config.js              # Vite Konfiguration
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
