# VSCode-ähnliche Admin-Ansicht

## Übersicht

Die neue Admin-Ansicht ist wie VSCode aufgebaut und zeigt das `.atelier/` Verzeichnis als Dateibaum an. Alle Dateien können direkt im Browser bearbeitet werden.

## Zugriff

**Neue Admin-Ansicht:** `/admin-new`
**Alte Admin-Ansicht:** `/admin` (noch verfügbar)

## Features

### 📁 File Explorer (Sidebar)

- **Dateibaum-Ansicht** des `.atelier/` Verzeichnisses
- **Icons**:
  - 📁 Geschlossener Ordner
  - 📂 Geöffneter Ordner
  - 📄 JSON-Datei
  - 📝 Markdown-Datei
  - 📊 CSV-Datei
- **Dateigrößen** werden angezeigt
- **Expandieren/Kollabieren** von Ordnern per Klick
- **3-Level-Tiefe** Navigation

### 📝 Editor-Bereich

- **Monaco Editor** (VS Code Editor)
- **Tabs** für mehrere geöffnete Dateien
- **Syntax-Highlighting**:
  - JSON
  - Markdown
  - CSV (als Text)
- **Unsaved Changes Indicator** (● Punkt bei ungespeicherten Änderungen)
- **Auto-Save** mit `Ctrl+S` / `Cmd+S`

### Datei-Operationen

**Aktuell:**
- ✅ Datei öffnen
- ✅ Datei bearbeiten
- ✅ Datei speichern (Ctrl+S)
- ✅ Tab schließen (mit Warnung bei ungespeicherten Änderungen)

**Geplant:**
- [ ] Neue Datei erstellen
- [ ] Datei löschen
- [ ] Datei umbenennen
- [ ] Ordner erstellen

## Verwendung

### Datei öffnen

1. Klicken Sie auf eine Datei im Explorer
2. Datei wird in einem neuen Tab geöffnet
3. Monaco Editor lädt automatisch

### Datei bearbeiten

1. Öffnen Sie eine Datei
2. Bearbeiten Sie den Inhalt im Monaco Editor
3. Unsaved-Indicator (●) erscheint im Tab
4. Drücken Sie `Ctrl+S` zum Speichern

### Zwischen Dateien wechseln

1. Klicken Sie auf einen Tab
2. Oder öffnen Sie eine neue Datei im Explorer

### Tab schließen

1. Klicken Sie auf das ✕ im Tab
2. Bei ungespeicherten Änderungen erscheint eine Warnung

## Dateistruktur

```
.atelier/
├── plans/
│   ├── plans.json          # Index aller Pläne
│   ├── {planId}.json       # Plan-Daten
│   └── {planId}.md         # Plan als Markdown
├── classes/
│   ├── classes.json        # Klassen-Index
│   └── {classId}/
│       ├── class.json
│       ├── students.csv
│       ├── notes.md
│       └── schedules/
│           └── {scheduleId}.md
├── sessions/
│   └── active-session.json
└── timers/
    └── student-timers.json
```

## Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Datei speichern |
| (mehr folgt) | |

## Technische Details

### Komponenten

**FileExplorer.svelte** (`src/lib/components/admin/FileExplorer.svelte`)
- Dateibaum-Navigation
- Ordner expandieren/kollabieren
- Datei-Auswahl

**EditorPanel.svelte** (`src/lib/components/admin/EditorPanel.svelte`)
- Tab-Management
- Monaco Editor Integration
- Speichern/Laden von Dateien
- Unsaved Changes Tracking

**Admin-New Page** (`src/routes/admin-new/+page.svelte`)
- VSCode-ähnliches Layout
- Sidebar + Editor-Bereich

### IPC-Handler

Neue Electron IPC-Handler für Datei-Operationen:

- `fs:readDirectory` - Verzeichnis auslesen
- `fs:readFile` - Datei lesen
- `fs:writeFile` - Datei schreiben
- `fs:deleteFile` - Datei löschen
- `fs:createDirectory` - Verzeichnis erstellen

### Vorteile

1. **Direkte Datei-Bearbeitung**: Keine Abstraktionsschicht
2. **Transparenz**: Sehen Sie genau was gespeichert wird
3. **Flexibilität**: Bearbeiten Sie Dateien wie in VSCode
4. **Mehrere Dateien**: Arbeiten Sie an mehreren Dateien gleichzeitig
5. **Syntax-Highlighting**: Bessere Lesbarkeit

## Migration von alter Admin-Ansicht

Die alte Admin-Ansicht (`/admin`) funktioniert weiterhin und nutzt die gleichen Dateien.

**Unterschiede:**
- **Alt**: Formular-basiert, versteckt Dateistruktur
- **Neu**: Datei-Explorer, direkter Zugriff auf Dateien

Sie können beide Ansichten parallel nutzen!

## Nächste Schritte

1. **Kontextmenü** für Dateien (Rechtsklick)
2. **Neue Datei/Ordner** erstellen
3. **Drag & Drop** zum Verschieben
4. **Search** in Dateien
5. **Git Integration** (optional)

## Testing

```bash
npm run dev
```

Navigieren Sie zu `/admin-new` um die neue Ansicht zu sehen.

## Bekannte Einschränkungen

- Keine Datei-Suche (noch)
- Kein Kontextmenü (Rechtsklick)
- Ordner können nur 3 Level tief navigiert werden (kann erweitert werden)
- Keine Drag & Drop Unterstützung

---

Entwickelt für Atelier Desktop Edition
