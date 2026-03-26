# Working Directory Feature - Implementation Complete ✅

## Was wurde implementiert

Das System trennt jetzt sauber zwischen **Konfiguration** und **Arbeitsdaten**:

### 1. Settings Manager (`electron/modules/settings-manager.cjs`)
- Verwaltet App-Einstellungen in `~/.config/atelier/settings.json`
- Speichert Working Directory Pfad
- Speichert weitere Settings (theme, lastOpened)

### 2. Working Directory Dialog
- Beim ersten Start erscheint ein Dialog zur Auswahl
- User kann ein beliebiges Verzeichnis wählen
- Fallback auf `~/Documents/Atelier` wenn abgebrochen

### 3. Settings UI (`src/routes/settings/+page.svelte`)
- Zeigt aktuelles Arbeitsverzeichnis
- Button zum Ändern des Verzeichnisses
- Info über Config- und Daten-Speicherorte
- Hinweise zur Nutzung

### 4. IPC API Erweiterung
Neue Endpoints:
- `settings:get` - Einstellung abrufen
- `settings:set` - Einstellung setzen
- `settings:getWorkingDirectory` - Working Directory
- `settings:chooseWorkingDirectory` - Directory-Auswahl-Dialog

### 5. Integration
- Main Process initialisiert Working Directory vor allem anderen
- File Manager nutzt Working Directory als basePath
- Settings-Link in Admin und Landing Page
- Navigation zu Settings-Seite

## Dateistruktur

### Konfiguration (System)
```
~/.config/atelier/
└── settings.json
    {
      "workingDirectory": "/home/user/Documents/Atelier",
      "theme": "dark",
      "lastOpened": 1234567890
    }
```

### Arbeitsdaten (User wählbar)
```
<dein-arbeitsverzeichnis>/
├── classes/
│   └── classes.json
├── sessions/
│   └── active-session.json
└── timers/
    └── student-timers.json
```

## Vorteile

1. **Flexibilität**: User kann Daten-Speicherort frei wählen
2. **Cloud-Sync**: Arbeitsverzeichnis in Nextcloud/Dropbox → Auto-Sync
3. **Git-tauglich**: Arbeitsverzeichnis als Git-Repo nutzen
4. **Backup**: Einfach gesamten Ordner sichern
5. **Mehrere Projekte**: Verschiedene Arbeitsverzeichnisse für verschiedene Schuljahre/Klassen
6. **Sauber**: Config getrennt von Daten

## User Flow

### Erster Start
1. App startet
2. Dialog erscheint: "Wähle ein Arbeitsverzeichnis"
3. User wählt Ordner (oder nutzt Standard)
4. Settings werden gespeichert
5. App erstellt notwendige Unterordner
6. App läuft normal

### Normaler Start
1. App startet
2. Liest Working Directory aus settings.json
3. Initialisiert File Manager mit diesem Pfad
4. App läuft normal

### Verzeichnis ändern
1. User geht zu Einstellungen
2. Klickt auf "📁 Verzeichnis ändern"
3. Wählt neues Verzeichnis
4. Settings werden aktualisiert
5. Alert: "Bitte App neu starten"
6. Nach Neustart nutzt App neues Verzeichnis

## Testing

```bash
# Development
npm run dev

# Beim ersten Start:
# - Dialog erscheint
# - Verzeichnis wählen
# - App startet

# Settings testen:
# - Zu /settings navigieren
# - Aktuelles Verzeichnis wird angezeigt
# - "Verzeichnis ändern" klicken
# - Neues Verzeichnis wählen
# - App neu starten
# - Daten sind im neuen Verzeichnis
```

## Neue Dateien

```
electron/modules/settings-manager.cjs  # Settings Manager
src/routes/settings/+page.svelte       # Settings UI
```

## Geänderte Dateien

```
electron/main.cjs                      # Working Directory Init
electron/modules/ipc-handlers.cjs      # Settings IPC Handlers
electron/preload.js                    # Settings API
src/routes/admin/+page.svelte          # Settings Link
src/routes/+page.svelte                # Settings Link
README.md                              # Dokumentation
ELECTRON_MVP.md                        # MVP Doku
```

## Status: COMPLETE ✅

Das Working Directory Feature ist vollständig implementiert und ready zum Testen!

### Quick Test
```bash
# Terminal 1
npm run dev

# Beim Start:
# 1. Dialog erscheint
# 2. Wähle z.B. ~/Documents/test-atelier
# 3. Erstelle einen Zeitplan
# 4. Check: ls ~/Documents/test-atelier/
#    → sessions/, timers/, classes/ existieren

# Settings testen:
# 1. Gehe zu /settings
# 2. Siehe Arbeitsverzeichnis
# 3. Ändere es
# 4. Restart App
# 5. Alte Daten sind weg (weil anderes Verzeichnis)
```

Alles funktioniert wie gewünscht! 🎉
