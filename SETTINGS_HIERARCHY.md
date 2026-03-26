# Settings Hierarchie - Implementation Complete ✅

## Was wurde implementiert

Das System nutzt jetzt eine **Settings-Hierarchie** mit lokalen Settings im Projekt und versteckten Daten:

### 1. Settings-Hierarchie (Priorität)
1. **Lokal** (höchste Priorität): `<arbeitsverzeichnis>/.atelier/settings.json`
2. **Global** (Fallback): `~/.config/atelier/settings.json`

Lokale Settings im Projekt überschreiben immer die globalen Settings!

### 2. Versteckte Daten
Alle Daten liegen jetzt im versteckten `.atelier/` Ordner im Arbeitsverzeichnis:

```
<arbeitsverzeichnis>/
└── .atelier/                    # Versteckter Ordner (Linux: ls -la)
    ├── settings.json            # Lokale Settings
    ├── classes/
    │   └── classes.json
    ├── sessions/
    │   └── active-session.json
    └── timers/
        └── student-timers.json
```

### 3. Settings Manager Erweiterungen
- `loadFromFile()` - Lädt Settings von spezifischer Datei
- `load()` - Lädt mit Hierarchie: lokal vor global
- `save()` - Speichert lokal (wenn Working Directory gesetzt) + Backup global
- `getSettingsLocation()` - Zeigt an welche Settings aktiv sind

### 4. File Manager Anpassung
- Base Path ist jetzt `<arbeitsverzeichnis>/.atelier/`
- Alle Daten gehen automatisch in den versteckten Ordner
- `.atelier/` wird automatisch erstellt

## Wie es funktioniert

### Beim ersten Start
1. Keine globalen Settings → Dialog erscheint
2. User wählt Arbeitsverzeichnis (z.B. `~/Documents/MeinProjekt`)
3. Settings Manager erstellt:
   - `~/.config/atelier/settings.json` (global)
   - `~/Documents/MeinProjekt/.atelier/` (Verzeichnis)
   - `~/Documents/MeinProjekt/.atelier/settings.json` (lokal)
4. Lokale Settings werden genutzt

### Bei späteren Starts
1. Settings Manager lädt globale Settings
2. Liest Working Directory: `~/Documents/MeinProjekt`
3. Prüft ob lokale Settings existieren: `~/Documents/MeinProjekt/.atelier/settings.json`
4. **JA** → Nutzt lokale Settings (Priorität!)
5. **NEIN** → Nutzt globale Settings

### Beim Speichern
- Lokale Settings werden in `.atelier/settings.json` gespeichert
- Zusätzlich Backup in globale Settings (für Working Directory Referenz)

### Beim Ändern des Verzeichnisses
1. User wählt neues Verzeichnis: `~/Documents/NeuesProjekt`
2. Settings Manager aktualisiert beide Settings-Dateien
3. `.atelier/` wird im neuen Verzeichnis erstellt
4. Bei Neustart werden lokale Settings aus neuem Verzeichnis geladen

## Code-Änderungen

### Neue Features in Settings Manager
```javascript
// Hierarchische Laden
async load() {
  // 1. Lade globale Settings
  let globalSettings = await this.loadFromFile(this.globalSettingsFile);
  
  // 2. Wenn Working Directory gesetzt, prüfe lokale Settings
  if (globalSettings?.workingDirectory) {
    this.localSettingsFile = path.join(
      globalSettings.workingDirectory, 
      '.atelier', 
      'settings.json'
    );
    const localSettings = await this.loadFromFile(this.localSettingsFile);
    
    // 3. Lokale Settings haben Vorrang!
    if (localSettings) {
      this.settings = localSettings;
      this.isLocalSettings = true;
      return this.settings;
    }
  }
  
  // 4. Fallback auf globale Settings
  this.settings = globalSettings;
  this.isLocalSettings = false;
  return this.settings;
}

// Speichern mit Backup
async save() {
  let targetFile = this.globalSettingsFile;
  
  // Speichere lokal wenn möglich
  if (this.localSettingsFile && this.settings?.workingDirectory) {
    targetFile = this.localSettingsFile;
    await fs.mkdir(path.dirname(this.localSettingsFile), { recursive: true });
    this.isLocalSettings = true;
  }
  
  await fs.writeFile(targetFile, JSON.stringify(this.settings, null, 2));
  
  // Backup in global (für Working Directory Referenz)
  if (this.isLocalSettings) {
    await fs.writeFile(this.globalSettingsFile, JSON.stringify(this.settings, null, 2));
  }
}
```

### File Manager Anpassung
```javascript
constructor(workingDirectory) {
  // Alle Daten in .atelier/ Unterordner
  this.basePath = path.join(workingDirectory, '.atelier');
  this.ensureDirectories();
}
```

## Vorteile

### 1. Projekt-spezifische Settings
```
Projekt A: ~/Documents/ProjektA/
  └── .atelier/settings.json → theme: "dark", ...

Projekt B: ~/Documents/ProjektB/
  └── .atelier/settings.json → theme: "light", ...
```

Jedes Projekt kann eigene Settings haben!

### 2. Cloud-Sync freundlich
```
~/Nextcloud/Atelier-Schuljahr-2024/
└── .atelier/  ← Alles hier wird synchronisiert
```

Ein Ordner = Ein komplettes Projekt mit Settings + Daten

### 3. Git-tauglich
```bash
cd ~/Documents/MeinProjekt
git init
git add .atelier/
git commit -m "Initial project"
```

Komplettes Projekt inkl. Settings in Git!

### 4. Versteckt aber sichtbar
```bash
# Normal: .atelier/ ist versteckt
ls ~/Documents/MeinProjekt/
# → (leer oder andere Dateien)

# Mit versteckten Dateien:
ls -la ~/Documents/MeinProjekt/
# → .atelier/
```

Stört nicht im Hauptverzeichnis, aber bei Bedarf sichtbar.

## Settings-Seite

Die Settings-Seite zeigt jetzt:
- Aktuelles Arbeitsverzeichnis
- Daten-Verzeichnis (`.atelier/`)
- **Aktive Settings-Datei** (lokal oder global)
- Globale Settings (Fallback)
- Hierarchie-Erklärung

## Testing

```bash
# Test 1: Erster Start
rm -rf ~/.config/atelier/
npm run dev
# → Dialog erscheint
# → Wähle ~/Documents/TestProjekt1
# → Prüfe: ls -la ~/Documents/TestProjekt1/.atelier/
# → settings.json, classes/, sessions/, timers/

# Test 2: Lokale Settings haben Vorrang
# Ändere lokal: ~/Documents/TestProjekt1/.atelier/settings.json
# → theme: "light"
# Ändere global: ~/.config/atelier/settings.json
# → theme: "dark"
# Restart App
# → Lokale Settings werden genutzt (theme: light)

# Test 3: Multi-Projekt
# Erstelle Zeitplan in Projekt 1
# Ändere Working Directory zu ~/Documents/TestProjekt2
# → Zeitplan ist weg (anderes Projekt)
# Ändere zurück zu TestProjekt1
# → Zeitplan ist wieder da

# Test 4: Console-Output beim Start
npm run dev
# Console zeigt:
# Working directory: /home/user/Documents/TestProjekt1
# Settings location: /home/user/Documents/TestProjekt1/.atelier/settings.json
# Data directory: /home/user/Documents/TestProjekt1/.atelier
```

## Status: COMPLETE ✅

Die Settings-Hierarchie mit lokalen Settings in `.atelier/` ist vollständig implementiert!

### Was jetzt funktioniert
- ✅ Lokale Settings in `.atelier/settings.json` haben Vorrang
- ✅ Globale Settings als Fallback in `~/.config/atelier/settings.json`
- ✅ Alle Daten versteckt in `.atelier/` Ordner
- ✅ Projekt-spezifische Konfiguration möglich
- ✅ Cloud-Sync und Git-tauglich
- ✅ UI zeigt aktive Settings-Datei an
- ✅ Console-Output beim Start zur Debugging

Genau wie gewünscht! 🎉
