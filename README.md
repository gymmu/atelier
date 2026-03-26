# Atelier - Desktop Edition

Ein natives Desktop-Unterrichtsmanagement-System nach dem Atelier-Prinzip, gebaut mit Electron, SvelteKit und dateibasierter Speicherung.

## Features

### Unterrichtsverwaltung
- **Zeitplan-Management** - Erstellen und verwalten Sie Zeitpläne für verschiedene Klassen und Lektionen
- **Vordefinierte Phasen** - Nutzen Sie Standardphasen wie "Einstieg", "Instruktion", "Freie Arbeitsphase", "Präsentation", "Reflexion" und "Pause"
- **Benutzerdefinierte Phasen** - Erstellen Sie eigene Phasen mit individuellen Namen, Icons und Farben
- **Live-Anzeige** - Beamer-Ansicht in separatem Fenster zeigt den aktuellen Unterrichtsverlauf mit Countdown und Fortschrittsbalken
- **Schüler-Timer** - Individuelle Timer für Schülerinnen und Schüler während freier Arbeitsphasen
- **Session-Steuerung** - Starten, pausieren, stoppen und navigieren Sie durch die Unterrichtsphasen
- **Multi-Window Support** - Admin und Beamer-Ansicht in separaten Fenstern mit Live-Sync

### Technologie
- **Electron** - Native Desktop-Applikation für Linux (erweiterbar auf Windows/macOS)
- **SvelteKit** - Modernes Web-Framework mit Svelte 5 und Runes
- **Vite** - Schnelles Build-Tool und Dev-Server
- **File-based Storage** - Alle Daten werden in JSON/CSV/Markdown-Dateien gespeichert
- **Dunkles Theme** - Elegantes Design mit Hauptfarbe #007BC0
- **IPC Communication** - Sichere Kommunikation zwischen Main und Renderer Process

## Daten-Speicherort

Alle Daten werden im Electron userData-Verzeichnis gespeichert:

- **Linux**: `~/.config/atelier/`
- **Windows**: `%APPDATA%/atelier/`
- **macOS**: `~/Library/Application Support/atelier/`

### Dateistruktur

```
~/.config/atelier/
├── classes/
│   └── classes.json          # Liste aller Klassen
├── sessions/
│   └── active-session.json   # Aktive Session
└── timers/
    └── student-timers.json   # Schüler-Timer
```

## Entwicklung

### Voraussetzungen

- Node.js 20 oder höher
- npm

### Installation

```bash
npm install
```

### Development Server starten

**Wichtig**: Das `dev` Script startet sowohl Vite als auch Electron:

```bash
npm run dev
```

Dies startet:
1. Vite Dev Server auf `http://localhost:5173`
2. Electron Desktop App (wartet auf Vite)

Die Electron-App öffnet sich automatisch sobald Vite bereit ist.

### Production Build

```bash
npm run build
```

Der Build wird im `build/` Verzeichnis erstellt.

### Electron App packen

**Für Linux:**
```bash
npm run package:linux
```

Erstellt:
- `dist/Atelier-1.0.0.AppImage`
- `dist/atelier_1.0.0_amd64.deb`

**Für alle Plattformen (Windows, macOS, Linux):**
```bash
npm run package:all
```

## Installation (für Endnutzer)

### Linux

**AppImage:**
```bash
chmod +x Atelier-1.0.0.AppImage
./Atelier-1.0.0.AppImage
```

**Debian/Ubuntu (.deb):**
```bash
sudo dpkg -i atelier_1.0.0_amd64.deb
```

Nach der Installation kann die App über das Anwendungsmenü gestartet werden.

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
├── electron/                         # Electron Main Process
│   ├── main.js                      # Entry Point
│   ├── preload.js                   # Context Bridge
│   └── modules/
│       ├── file-manager.js          # Datei I/O
│       ├── window-manager.js        # Multi-Window
│       └── ipc-handlers.js          # IPC Handlers
├── static/
├── svelte.config.js                  # SvelteKit Konfiguration
├── vite.config.js                    # Vite Konfiguration
├── electron-builder.yml              # Electron Builder Config
└── package.json
```

## Technologien

- **Electron** `^41.0.4` - Desktop App Framework
- **SvelteKit** `^2.50.2` - Web Framework
- **Svelte** `^5.54.0` - UI Library
- **Vite** `^7.3.1` - Build Tool
- **@sveltejs/adapter-static** `^3.0.10` - Static Site Adapter
- **csv-parse/stringify** - CSV Handling
- **marked** - Markdown Parser
- **gray-matter** - Markdown Frontmatter

## Design

- **Hauptfarbe**: #007BC0 (Blau)
- **Hintergrund**: Dunkle Farbpalette (#0d1117, #010409)
- **Text**: Helle Schrift (#e6edf3)
- **Animationen**: Fade-in und Slide-in Effekte

## Quick Start Guide

1. **Installation:**
   ```bash
   npm install
   ```

2. **Development starten:**
   ```bash
   npm run dev
   ```
   Die Electron-App öffnet sich automatisch.

3. **Ersten Zeitplan erstellen:**
   - Klicke auf "+ Neu" in der linken Sidebar
   - Gib einen Namen ein (z.B. "Mathe Lektion 1")
   - Füge Phasen hinzu (vordefiniert oder custom)
   - Speichere den Zeitplan

4. **Session starten:**
   - Klicke auf "Session starten"
   - Optional: Öffne "🖥️ Beamer-Ansicht" in separatem Fenster
   - Die Phase-Timer laufen automatisch

5. **Daten finden:**
   - Linux: `~/.config/atelier/`
   - Alle Daten als JSON-Dateien

## Bekannte Einschränkungen (MVP)

- Klassenmanagement: Basis-Implementation (noch keine UI)
- Markdown-Editor: Noch nicht implementiert
- CSV-Editor: Noch nicht implementiert
- Unsaved Changes Indicator: Noch nicht implementiert

Diese Features sind geplant für zukünftige Versionen.

## Troubleshooting

**Electron startet nicht:**
- Stelle sicher dass Vite läuft (`http://localhost:5173`)
- Prüfe `NODE_ENV=development` in package.json dev script

**Daten werden nicht gespeichert:**
- Prüfe ob `~/.config/atelier/` existiert
- Electron sollte automatisch das Verzeichnis erstellen

**DevTools öffnen:**
- Im Development Mode öffnet sich DevTools automatisch
- Oder: View → Toggle Developer Tools

## Lizenz

MIT
