# Standardziel: bauen und installieren
default: install

# Nur die SvelteKit-UI bauen
build-ui:
    npm run build

# App als AppImage paketieren (baut UI automatisch vorher)
package: build-ui
    npx electron-builder --linux AppImage

# App installieren nach ~/.local/bin/atelier + Desktop-Eintrag
install: package
    mkdir -p ~/.local/bin
    cp dist/Atelier-*.AppImage ~/.local/bin/atelier
    chmod +x ~/.local/bin/atelier
    mkdir -p ~/.local/share/icons/hicolor/scalable/apps
    cp src/lib/assets/favicon.svg ~/.local/share/icons/hicolor/scalable/apps/atelier.svg
    mkdir -p ~/.local/share/applications
    printf '[Desktop Entry]\nName=Atelier\nExec=%s/.local/bin/atelier\nIcon=atelier\nType=Application\nCategories=Education;\nComment=Atelier Lernumgebung\n' "$HOME" > ~/.local/share/applications/atelier.desktop
    update-desktop-database ~/.local/share/applications || true
    @echo "Installiert: ~/.local/bin/atelier"
    @echo "Desktop-Eintrag: ~/.local/share/applications/atelier.desktop"

# AppImage entfernen
uninstall:
    rm -f ~/.local/bin/atelier
    rm -f ~/.local/share/applications/atelier.desktop
    rm -f ~/.local/share/icons/hicolor/scalable/apps/atelier.svg
    update-desktop-database ~/.local/share/applications || true
    @echo "Deinstalliert."

# Alle Build-Artefakte löschen
clean:
    rm -rf dist/ build/
