# Neue Landing Page - VSCode-Admin mit Arbeitsverzeichnis-Management

## Übersicht

Die Landing Page (`/`) ist jetzt die Hauptarbeitsumgebung im VSCode-Stil. Beim ersten Start wird automatisch das letzte Arbeitsverzeichnis geöffnet, oder es erscheint eine Auswahl mit zuletzt geöffneten Verzeichnissen.

## Features

### 🏠 Smart Landing Page

**Automatisches Verhalten:**
1. **Letztes Verzeichnis vorhanden** → Öffnet direkt die Datei-Ansicht
2. **Kein Verzeichnis** → Zeigt Welcome Screen mit Recent Directories

### 📁 Welcome Screen

**Wird angezeigt wenn:**
- Beim ersten Start (kein Arbeitsverzeichnis)
- Wenn kein Verzeichnis ausgewählt ist

**Features:**
- 📁 **"Verzeichnis öffnen"** Button - Öffnet Datei-Dialog
- 📋 **"Zuletzt geöffnet"** Liste - Zeigt bis zu 10 letzte Verzeichnisse
- ⏰ **Relative Zeit-Anzeige** - "vor 5 Minuten", "vor 2 Stunden", etc.
- 🎨 **Schönes Design** - Animiertes Logo, moderne UI

### 📂 Recent Directories

**Automatisch verwaltet:**
- Speichert bis zu 10 letzte Verzeichnisse
- Zeigt Name, Pfad und letzte Zugriffs-Zeit
- Sortiert nach Aktualität (neueste zuerst)
- Klick auf Eintrag → Verzeichnis öffnen

**Gespeichert in:** `~/.config/atelier/settings.json`

```json
{
  "workingDirectory": "/home/user/Documents/Schule-2024",
  "recentDirectories": [
    {
      "path": "/home/user/Documents/Schule-2024",
      "name": "Schule-2024",
      "lastAccessed": 1234567890
    },
    {
      "path": "/home/user/Nextcloud/Unterricht",
      "name": "Unterricht",
      "lastAccessed": 1234567880
    }
  ]
}
```

### 🔄 Verzeichnis wechseln

**Im Header:**
- **"📁 Verzeichnis wechseln"** Button
- Öffnet Datei-Dialog
- Wechselt sofort zum neuen Verzeichnis
- Aktualisiert Recent Directories automatisch

### 💾 Persistenz

**Was wird gespeichert:**
- Aktuelles Arbeitsverzeichnis
- Liste der letzten 10 Verzeichnisse
- Zeitstempel des letzten Zugriffs

**Wo gespeichert:**
- Global: `~/.config/atelier/settings.json`
- Lokal: `<arbeitsverzeichnis>/.atelier/settings.json`

## User Flow

### Erster Start

```
1. App startet
2. Kein Arbeitsverzeichnis gefunden
3. ↓
4. Welcome Screen erscheint
   - Große "Verzeichnis öffnen" Button
   - Keine Recent Directories (erste Mal)
5. ↓
6. User klickt "Verzeichnis öffnen"
7. Dialog erscheint
8. User wählt Verzeichnis (z.B. ~/Documents/Schule-2024)
9. ↓
10. Verzeichnis wird gespeichert
11. File Explorer lädt .atelier/ Struktur
12. Hauptansicht (VSCode-Style) erscheint
```

### Zweiter Start

```
1. App startet
2. Letztes Arbeitsverzeichnis gefunden: ~/Documents/Schule-2024
3. ↓
4. Hauptansicht öffnet direkt
   - File Explorer zeigt .atelier/ Dateien
   - Header zeigt "📁 Schule-2024"
5. ↓
6. User arbeitet normal
```

### Verzeichnis wechseln

```
1. User klickt "📁 Verzeichnis wechseln" im Header
2. Dialog erscheint
3. User wählt neues Verzeichnis (z.B. ~/Nextcloud/Unterricht)
4. ↓
5. App speichert neues Verzeichnis
6. Recent Directories wird aktualisiert
7. Page reload
8. ↓
9. Hauptansicht mit neuem Verzeichnis
```

### Recent Directories nutzen

```
1. Kein Arbeitsverzeichnis aktiv
2. Welcome Screen erscheint
3. ↓
4. "Zuletzt geöffnet" Liste zeigt:
   - Schule-2024 (vor 2 Stunden)
   - Unterricht (vor 3 Tagen)
   - Projekte-2023 (vor 1 Woche)
5. ↓
6. User klickt auf "Unterricht"
7. Verzeichnis öffnet sofort
8. ↓
9. Hauptansicht mit Unterricht-Verzeichnis
```

## Komponenten

### WelcomeScreen.svelte

**Location:** `src/lib/components/admin/WelcomeScreen.svelte`

**Props:**
- `onDirectorySelect(path)` - Callback wenn Verzeichnis gewählt wurde

**Features:**
- Animiertes Logo (float animation)
- "Verzeichnis öffnen" Button
- Recent Directories Liste
- Relative Zeit-Formatierung

### Landing Page (+page.svelte)

**Location:** `src/routes/+page.svelte`

**State Management:**
- `hasWorkingDirectory` - Boolean, ob Verzeichnis vorhanden
- `workingDirectoryPath` - Aktueller Pfad
- `openFiles` - Liste geöffneter Dateien
- `activeFile` - Aktuell aktive Datei

**Logic:**
1. `onMount` → Check Working Directory
2. Wenn vorhanden → Zeige Admin-Ansicht
3. Wenn nicht → Zeige Welcome Screen

## Settings Manager Erweiterungen

**Neue Methoden:**

```javascript
// Recent Directories hinzufügen
await settingsManager.addToRecentDirectories(path);

// Recent Directories abrufen
const recent = settingsManager.getRecentDirectories();
// Returns: [{ path, name, lastAccessed }, ...]
```

**Auto-Update:**
- Wird automatisch bei `setWorkingDirectory()` aufgerufen
- Hält nur 10 neueste Einträge
- Entfernt Duplikate

## IPC-Handler

**Neue Handler:**

```javascript
// Recent Directories abrufen
ipcMain.handle('settings:getRecentDirectories', async () => {
  return settingsManager.getRecentDirectories();
});
```

**Preload API:**

```javascript
window.electronAPI.getRecentDirectories()
// Returns: Promise<Array<{path, name, lastAccessed}>>
```

## Vorteile

### Für Benutzer:
✅ **Schneller Start** - Letztes Verzeichnis öffnet automatisch
✅ **Einfacher Wechsel** - Zwischen Projekten wechseln ohne Menü
✅ **Übersicht** - Sehen alle zuletzt geöffneten Projekte
✅ **Keine Verwirrung** - Klares Visual Feedback welches Verzeichnis aktiv ist

### Für Lehrer:
✅ **Multi-Projekt** - Verschiedene Schuljahre/Klassen trennen
✅ **Cloud-Sync** - Nextcloud/Dropbox direkt öffnen
✅ **Schneller Zugriff** - Recent List für häufig genutzte Verzeichnisse

## Migration

**Von alter Version:**
- Alte Landing Page (`/`) ersetzt durch neue Admin-Ansicht
- Alte Admin (`/admin`) bleibt verfügbar als `/admin`
- Neue Admin auch unter `/admin-new` verfügbar (wird deprecated)
- Settings bleiben kompatibel

**Breaking Changes:**
- ❌ Keine - Alte Links funktionieren weiter

## Testing

```bash
npm run dev
```

**Test-Szenarien:**

1. **Erster Start:**
   - Delete `~/.config/atelier/settings.json`
   - Start app
   - → Welcome Screen sollte erscheinen

2. **Mit Verzeichnis:**
   - Wähle ein Verzeichnis
   - Restart app
   - → Sollte direkt File Explorer öffnen

3. **Recent Directories:**
   - Öffne 3 verschiedene Verzeichnisse
   - Close und öffne Welcome Screen
   - → Sollte alle 3 in Recent List zeigen

4. **Verzeichnis wechseln:**
   - Klick "Verzeichnis wechseln"
   - Wähle neues Verzeichnis
   - → Sollte sofort wechseln

## Bekannte Einschränkungen

- **Reload beim Wechsel:** Page reload nötig beim Verzeichniswechsel (kann später mit state management verbessert werden)
- **Max 10 Recent:** Nur 10 letzte Verzeichnisse gespeichert (erweiterbar)

## Zukunft (Optional)

- [ ] **Favoriten** - Verzeichnisse als Favoriten markieren
- [ ] **Suche** in Recent Directories
- [ ] **Thumbnail/Preview** für Verzeichnisse
- [ ] **Projekt-Metadaten** (z.B. Schuljahr, Fach)
- [ ] **Ohne Reload wechseln** - State management verbessern

---

✅ **Implementation Complete**
