<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	let workingDirectory = $state('');
	let settingsLocation = $state('');
	let isLoading = $state(true);

	onMount(async () => {
		if (window.electronAPI) {
			workingDirectory = await window.electronAPI.getWorkingDirectory();
			settingsLocation = await window.electronAPI.getSettingsLocation();
		}
		isLoading = false;
	});

	async function changeWorkingDirectory() {
		if (!window.electronAPI) return;

		const newPath = await window.electronAPI.chooseWorkingDirectory();
		if (newPath) {
			workingDirectory = newPath;
			alert('Arbeitsverzeichnis geändert!\n\nBitte starte die App neu, damit die Änderungen wirksam werden.');
		}
	}

	function openWorkingDirectory() {
		if (window.electronAPI && workingDirectory) {
			// This would require an additional IPC handler to open the folder in file explorer
			// For now, we just show the path
			alert(`Arbeitsverzeichnis:\n${workingDirectory}`);
		}
	}
</script>

<svelte:head>
	<title>Einstellungen - Atelier</title>
</svelte:head>

<div class="settings-page">
	<header class="settings-header">
		<h1>⚙️ Einstellungen</h1>
		<a href="{base}/admin" class="btn btn-secondary">
			← Zurück zur Administration
		</a>
	</header>

	<div class="settings-content">
		{#if isLoading}
			<p>Lädt...</p>
		{:else}
			<section class="settings-section">
				<h2>Arbeitsverzeichnis</h2>
				<p class="description">
					Hier werden alle deine Atelier-Daten gespeichert (Klassen, Zeitpläne, Sessions, Timer).
				</p>

				<div class="working-dir-display">
					<div class="path-display">
						<span class="label">Aktueller Pfad:</span>
						<code class="path">{workingDirectory || 'Nicht festgelegt'}</code>
					</div>

					<div class="actions">
						<button onclick={changeWorkingDirectory} class="btn btn-primary">
							📁 Verzeichnis ändern
						</button>
						{#if workingDirectory}
							<button onclick={openWorkingDirectory} class="btn btn-secondary">
								🔍 Pfad anzeigen
							</button>
						{/if}
					</div>
				</div>

				<div class="info-box">
					<h3>ℹ️ Hinweise</h3>
					<ul>
						<li>Das Arbeitsverzeichnis kann ein beliebiger Ordner auf deinem Computer sein</li>
						<li>Du kannst den Ordner z.B. in einem Cloud-Ordner (Nextcloud, Dropbox) anlegen</li>
						<li>Alle Daten werden versteckt im <code>.atelier/</code> Unterordner gespeichert</li>
						<li>Lokale Settings haben Vorrang vor globalen Settings</li>
						<li>Alle Daten werden in lesbaren Dateiformaten gespeichert (JSON, CSV, Markdown)</li>
						<li>Nach einer Änderung muss die App neu gestartet werden</li>
					</ul>
				</div>
			</section>

			<section class="settings-section">
				<h2>Konfigurationsdateien</h2>
				<p class="description">
					Atelier nutzt eine Hierarchie für Einstellungen: Lokale Settings im Projekt haben Vorrang vor globalen Settings.
				</p>

				<div class="info-box">
					<h3>📍 Speicherorte</h3>
					<ul>
						<li><strong>Arbeitsverzeichnis:</strong> <code>{workingDirectory || 'Nicht festgelegt'}</code></li>
						<li><strong>Daten & lokale Settings:</strong> <code>{workingDirectory ? workingDirectory + '/.atelier/' : 'Nicht festgelegt'}</code></li>
						<li><strong>Aktive Settings:</strong> <code>{settingsLocation || 'Lädt...'}</code></li>
						<li><strong>Globale Settings (Fallback):</strong> <code>~/.config/atelier/settings.json</code> (Linux)</li>
					</ul>
				</div>

				<div class="info-box" style="margin-top: 1rem; background: rgba(255, 193, 7, 0.1); border-color: rgba(255, 193, 7, 0.3);">
					<h3>⚠️ Hierarchie</h3>
					<ul>
						<li><strong>1. Priorität:</strong> Lokale Settings in <code>/.atelier/settings.json</code> (im Arbeitsverzeichnis)</li>
						<li><strong>2. Priorität:</strong> Globale Settings in <code>~/.config/atelier/settings.json</code></li>
						<li>Alle Daten liegen versteckt im <code>.atelier/</code> Ordner</li>
					</ul>
				</div>
			</section>
		{/if}
	</div>
</div>

<style>
	.settings-page {
		min-height: 100vh;
		background: var(--color-bg-darker);
		color: var(--color-text);
	}

	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem;
		background: var(--color-bg-dark);
		border-bottom: 1px solid var(--color-border);
	}

	.settings-header h1 {
		margin: 0;
		font-size: 2rem;
	}

	.settings-content {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}

	.settings-section {
		background: var(--color-bg-dark);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.settings-section h2 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: var(--color-primary);
		font-size: 1.5rem;
	}

	.description {
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
	}

	.working-dir-display {
		background: var(--color-bg-darker);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.path-display {
		margin-bottom: 1rem;
	}

	.label {
		display: block;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-bottom: 0.5rem;
	}

	.path {
		display: block;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		color: var(--color-primary);
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		word-break: break-all;
	}

	.actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover {
		background: #0096e0;
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: var(--color-primary);
	}

	.info-box {
		background: rgba(0, 123, 192, 0.1);
		border: 1px solid rgba(0, 123, 192, 0.3);
		border-radius: 6px;
		padding: 1.5rem;
	}

	.info-box h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: var(--color-primary);
		font-size: 1.1rem;
	}

	.info-box ul {
		margin: 0;
		padding-left: 1.5rem;
		line-height: 1.8;
	}

	.info-box li {
		color: var(--color-text-secondary);
		margin-bottom: 0.5rem;
	}

	.info-box code {
		background: rgba(0, 0, 0, 0.3);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		color: var(--color-primary);
	}
</style>
