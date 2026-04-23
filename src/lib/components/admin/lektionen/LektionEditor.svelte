<script>
	import MonacoEditor from '$lib/components/shared/MonacoEditor.svelte';
	import KopierenDialog from './KopierenDialog.svelte';
	import { lektionenStore } from '$lib/stores/lektionen.svelte.js';
	import { createEmptyPhase, buildLektionFilename, getKW } from '$lib/utils/lektion-parser.js';

	let { onRunLektion = () => {} } = $props();

	let editMode = $state('ui'); // 'ui' | 'yaml'
	let localLektion = $state(null); // lokale Kopie der Lektionsdaten
	let yamlContent = $state('');
	let unsaved = $state(false);
	let saveError = $state(null);
	let showKopierenDialog = $state(false);

	// Wenn sich die gewählte Lektion im Store ändert, lokale Kopie aktualisieren
	$effect(() => {
		const sl = lektionenStore.selectedLektion;
		if (sl) {
			localLektion = JSON.parse(JSON.stringify(sl));
			if (editMode === 'yaml') {
				refreshYaml();
			}
			unsaved = false;
			saveError = null;
		} else {
			localLektion = null;
			yamlContent = '';
			unsaved = false;
		}
	});

	function refreshYaml() {
		if (!localLektion) return;
		// Serialisierung ohne _filename
		const { _filename, ...data } = localLektion;
		try {
			// Wir formatieren YAML manuell über den Electron-Weg nicht; im Frontend
			// nutzen wir eine einfache JSON→YAML-Darstellung via Monaco-Editor.
			// Für ein echtes YAML im Renderer bräuchten wir das yaml-Paket als Browser-Bundle.
			// Wir verwenden hier einen lesbaren JSON-ähnlichen YAML-String.
			yamlContent = toYamlString(data);
		} catch {
			yamlContent = JSON.stringify(data, null, 2);
		}
	}

	/**
	 * Einfache YAML-Serialisierung für den Editor (kein vollständiger Parser im Browser).
	 * Wird nur für die Anzeige genutzt – gespeichert wird immer localLektion (strukturiert).
	 */
	function toYamlString(obj, indent = 0) {
		const lines = [];
		const pad = ' '.repeat(indent);
		for (const [key, value] of Object.entries(obj)) {
			if (value === null || value === undefined) {
				lines.push(`${pad}${key}: null`);
			} else if (Array.isArray(value)) {
				if (value.length === 0) {
					lines.push(`${pad}${key}: []`);
				} else if (typeof value[0] === 'object') {
					lines.push(`${pad}${key}:`);
					for (const item of value) {
						const itemLines = toYamlString(item, indent + 4).split('\n');
						lines.push(`${pad}  - ${itemLines[0].trimStart()}`);
						for (let i = 1; i < itemLines.length; i++) {
							if (itemLines[i].trim()) lines.push(`${pad}    ${itemLines[i].trimStart()}`);
						}
					}
				} else {
					lines.push(`${pad}${key}:`);
					for (const item of value) {
						lines.push(`${pad}  - ${typeof item === 'string' ? item : JSON.stringify(item)}`);
					}
				}
			} else if (typeof value === 'object') {
				lines.push(`${pad}${key}:`);
				lines.push(toYamlString(value, indent + 2));
			} else if (typeof value === 'string' && (value.includes(':') || value.includes('#') || value.includes('\n'))) {
				lines.push(`${pad}${key}: "${value.replace(/"/g, '\\"')}"`);
			} else {
				lines.push(`${pad}${key}: ${value}`);
			}
		}
		return lines.join('\n');
	}

	function markUnsaved() {
		unsaved = true;
		saveError = null;
	}

	function switchMode(mode) {
		if (mode === editMode) return;
		if (mode === 'yaml') {
			refreshYaml();
		}
		editMode = mode;
	}

	async function handleSave() {
		if (!localLektion) return;
		saveError = null;
		const result = await lektionenStore.saveLektion(localLektion);
		if (result.success) {
			unsaved = false;
		} else {
			saveError = result.error ?? 'Unbekannter Fehler';
		}
	}

	// Keyboard shortcut
	function handleKeydown(e) {
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			if (unsaved) handleSave();
		}
	}

	// Metadaten-Update löst Dateiname-Änderung aus
	function updateMeta(key, value) {
		localLektion = { ...localLektion, [key]: value };
		// Automatisch Woche und Wochentag aktualisieren wenn Datum geändert
		if (key === 'datum' && value) {
			const d = new Date(value);
			const tage = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
			localLektion = {
				...localLektion,
				datum: value,
				woche: getKW(d),
				wochentag: tage[d.getDay()]
			};
		}
		markUnsaved();
	}

	// Phasen-Operationen
	function addPhase() {
		localLektion = {
			...localLektion,
			phasen: [...(localLektion.phasen ?? []), createEmptyPhase()]
		};
		markUnsaved();
	}

	function removePhase(index) {
		const phasen = localLektion.phasen.filter((_, i) => i !== index);
		localLektion = { ...localLektion, phasen };
		markUnsaved();
	}

	function movePhase(index, dir) {
		const newIndex = dir === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= localLektion.phasen.length) return;
		const phasen = [...localLektion.phasen];
		[phasen[index], phasen[newIndex]] = [phasen[newIndex], phasen[index]];
		localLektion = { ...localLektion, phasen };
		markUnsaved();
	}

	function updatePhase(index, key, value) {
		const phasen = localLektion.phasen.map((p, i) => i === index ? { ...p, [key]: value } : p);
		localLektion = { ...localLektion, phasen };
		markUnsaved();
	}

	// Listen-Felder (Lernziele, Materialien)
	function updateListField(field, index, value) {
		const arr = [...(localLektion[field] ?? [])];
		arr[index] = value;
		localLektion = { ...localLektion, [field]: arr };
		markUnsaved();
	}

	function addListItem(field) {
		const arr = [...(localLektion[field] ?? []), ''];
		localLektion = { ...localLektion, [field]: arr };
		markUnsaved();
	}

	function removeListItem(field, index) {
		const arr = (localLektion[field] ?? []).filter((_, i) => i !== index);
		localLektion = { ...localLektion, [field]: arr };
		markUnsaved();
	}

	// Dateiname-Vorschau
	let filenamePreview = $derived.by(() => {
		if (!localLektion?.datum || !localLektion?.fach || !localLektion?.klasse) return '';
		try {
			return buildLektionFilename(localLektion);
		} catch {
			return '';
		}
	});

	// Gesamtdauer berechnen
	let gesamtDauer = $derived.by(() => {
		if (!localLektion?.phasen) return 0;
		return localLektion.phasen.reduce((sum, p) => sum + (Number(p.dauer) || 0), 0);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="lektion-editor">
	{#if !localLektion}
		<div class="empty-state">
			<div class="empty-icon">📅</div>
			<h2>Keine Lektion ausgewählt</h2>
			<p>Wähle eine Lektion aus der Sidebar oder erstelle eine neue.</p>
		</div>
	{:else}
		<!-- Editor-Header -->
		<div class="editor-header">
			<div class="header-left">
				<div class="mode-toggle">
					<button
						class="mode-btn"
						class:active={editMode === 'ui'}
						onclick={() => switchMode('ui')}
					>
						Formular
					</button>
					<button
						class="mode-btn"
						class:active={editMode === 'yaml'}
						onclick={() => switchMode('yaml')}
					>
						YAML
					</button>
				</div>
				{#if filenamePreview}
					<span class="filename-badge">{filenamePreview}</span>
				{/if}
			</div>
			<div class="header-actions">
				{#if unsaved}
					<button class="btn-save" onclick={handleSave}>
						Speichern
					</button>
				{/if}
				<button class="btn-kopieren" onclick={() => (showKopierenDialog = true)} title="Lektion kopieren">
					⧉ Kopieren
				</button>
				<button class="btn-run" onclick={() => onRunLektion(localLektion)} title="Im Beamer öffnen">
					Beamer
				</button>
			</div>
		</div>

		{#if saveError}
			<div class="save-error">Fehler: {saveError}</div>
		{/if}

		<!-- Editor-Inhalt -->
		<div class="editor-body">
			{#if editMode === 'yaml'}
				<!-- YAML-Ansicht (read-only Darstellung, Bearbeitung über UI) -->
				<div class="yaml-view">
					<div class="yaml-hint">
						Diese Ansicht zeigt die YAML-Darstellung. Bearbeite die Daten im Formular-Tab.
					</div>
					<MonacoEditor
						value={yamlContent}
						language="yaml"
						onChange={() => {}}
					/>
				</div>
			{:else}
				<!-- UI-Formular -->
				<div class="ui-form">

					<!-- ── Metadaten ── -->
					<section class="form-section">
						<h3 class="section-title">Metadaten</h3>
						<div class="meta-grid">
							<div class="field">
								<label>Datum *</label>
								<input
									type="date"
									value={localLektion.datum}
									onchange={(e) => updateMeta('datum', e.target.value)}
								/>
							</div>
							<div class="field">
								<label>Fach *</label>
								<input
									type="text"
									placeholder="z.B. Mathematik"
									value={localLektion.fach}
									oninput={(e) => updateMeta('fach', e.target.value)}
								/>
							</div>
							<div class="field">
								<label>Klasse *</label>
								<input
									type="text"
									placeholder="z.B. 5a"
									value={localLektion.klasse}
									oninput={(e) => updateMeta('klasse', e.target.value)}
								/>
							</div>
							<div class="field">
								<label>Lekt.-Nr. *</label>
								<input
									type="number"
									min="1"
									value={localLektion.lektionszahl}
									oninput={(e) => updateMeta('lektionszahl', Number(e.target.value))}
								/>
							</div>
							<div class="field field-readonly">
								<label>KW</label>
								<input type="text" value={localLektion.woche} readonly />
							</div>
							<div class="field field-readonly">
								<label>Wochentag</label>
								<input type="text" value={localLektion.wochentag} readonly />
							</div>
						</div>
					</section>

					<!-- ── Zeitinfo ── -->
					<section class="form-section">
						<h3 class="section-title">Zeitinfo</h3>
						<div class="time-grid">
							<div class="field">
								<label>Startzeit</label>
								<input
									type="time"
									value={localLektion.startzeit}
									oninput={(e) => updateMeta('startzeit', e.target.value)}
								/>
							</div>
							<div class="field">
								<label>Endzeit</label>
								<input
									type="time"
									value={localLektion.endzeit}
									oninput={(e) => updateMeta('endzeit', e.target.value)}
								/>
							</div>
						</div>
					</section>

					<!-- ── Thema & Lernziele ── -->
					<section class="form-section">
						<h3 class="section-title">Thema & Lernziele</h3>
						<div class="field">
							<label>Thema</label>
							<input
								type="text"
								placeholder="z.B. Bruchrechnen – Einführung"
								value={localLektion.thema ?? ''}
								oninput={(e) => updateMeta('thema', e.target.value)}
							/>
						</div>
						<div class="field">
							<label>Lernziele</label>
							<div class="list-field">
								{#each (localLektion.lernziele ?? []) as ziel, i}
									<div class="list-row">
										<input
											type="text"
											placeholder="Lernziel..."
											value={ziel}
											oninput={(e) => updateListField('lernziele', i, e.target.value)}
										/>
										<button class="btn-list-remove" onclick={() => removeListItem('lernziele', i)}>✕</button>
									</div>
								{/each}
								<button class="btn-list-add" onclick={() => addListItem('lernziele')}>
									+ Lernziel hinzufügen
								</button>
							</div>
						</div>
					</section>

					<!-- ── Materialien ── -->
					<section class="form-section">
						<h3 class="section-title">Materialien</h3>
						<div class="list-field">
							{#each (localLektion.materialien ?? []) as mat, i}
								<div class="list-row">
									<input
										type="text"
										placeholder="Material, Link, Datei..."
										value={mat}
										oninput={(e) => updateListField('materialien', i, e.target.value)}
									/>
									<button class="btn-list-remove" onclick={() => removeListItem('materialien', i)}>✕</button>
								</div>
							{/each}
							<button class="btn-list-add" onclick={() => addListItem('materialien')}>
								+ Material hinzufügen
							</button>
						</div>
					</section>

					<!-- ── Notizen ── -->
					<section class="form-section">
						<h3 class="section-title">Notizen</h3>
						<textarea
							class="notizen-field"
							placeholder="Freitext für Bemerkungen, Notizen, Differenzierungen..."
							value={localLektion.notizen ?? ''}
							oninput={(e) => updateMeta('notizen', e.target.value)}
							rows="3"
						></textarea>
					</section>

					<!-- ── Phasen ── -->
					<section class="form-section">
						<div class="section-header-row">
							<h3 class="section-title">
								Ablaufplan
								{#if localLektion.phasen?.length > 0}
									<span class="phase-count">({localLektion.phasen.length} Phasen · {gesamtDauer} Min.)</span>
								{/if}
							</h3>
							<button class="btn-add-phase" onclick={addPhase}>+ Phase</button>
						</div>

						{#if !localLektion.phasen?.length}
							<div class="phases-empty">
								Noch keine Phasen. Klicke auf "+ Phase" um den Ablaufplan zu strukturieren.
							</div>
						{:else}
							<div class="phases-list">
								{#each localLektion.phasen as phase, i}
									<div class="phase-card">
										<div class="phase-controls">
											<button
												class="btn-phase-ctrl"
												onclick={() => movePhase(i, 'up')}
												disabled={i === 0}
												title="Nach oben"
											>↑</button>
											<button
												class="btn-phase-ctrl"
												onclick={() => movePhase(i, 'down')}
												disabled={i === localLektion.phasen.length - 1}
												title="Nach unten"
											>↓</button>
											<button
												class="btn-phase-ctrl btn-phase-remove"
												onclick={() => removePhase(i)}
												title="Phase löschen"
											>✕</button>
										</div>

										<div class="phase-fields">
											<div class="phase-top-row">
												<input
													type="text"
													class="phase-name-input"
													placeholder="Phasenname"
													value={phase.name}
													oninput={(e) => updatePhase(i, 'name', e.target.value)}
												/>
												<div class="phase-meta-row">
													<input
														type="number"
														class="phase-dauer-input"
														placeholder="Min."
														min="1"
														value={phase.dauer}
														oninput={(e) => updatePhase(i, 'dauer', Number(e.target.value))}
														title="Dauer in Minuten"
													/>
													<span class="dauer-unit">Min.</span>
													<input
														type="text"
														class="phase-icon-input"
														placeholder="🎯"
														value={phase.icon ?? ''}
														oninput={(e) => updatePhase(i, 'icon', e.target.value)}
														title="Icon (Emoji)"
													/>
													<input
														type="color"
														class="phase-color-input"
														value={phase.farbe ?? '#007BC0'}
														oninput={(e) => updatePhase(i, 'farbe', e.target.value)}
														title="Farbe"
													/>
												</div>
											</div>
											<textarea
												class="phase-desc-input"
												placeholder="Beschreibung (optional)"
												value={phase.beschreibung ?? ''}
												oninput={(e) => updatePhase(i, 'beschreibung', e.target.value)}
												rows="2"
											></textarea>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</section>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Kopieren-Dialog -->
{#if showKopierenDialog && localLektion}
	<KopierenDialog
		modus="einzeln"
		quellFilename={localLektion._filename}
		quellLektion={localLektion}
		alleKlassen={lektionenStore.alleKlassen}
		onKopieren={async (opts) => {
			showKopierenDialog = false;
			await lektionenStore.copyLektion(localLektion._filename, opts);
		}}
		onAbbrechen={() => (showKopierenDialog = false)}
	/>
{/if}

<style>
	.lektion-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #0d1117;
		color: #e6edf3;
		overflow: hidden;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #8b949e;
		text-align: center;
		padding: 2rem;
	}

	.empty-icon {
		font-size: 3.5rem;
		margin-bottom: 1rem;
		opacity: 0.4;
	}

	.empty-state h2 {
		margin: 0 0 0.5rem;
		color: #e6edf3;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	/* Header */
	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 1rem;
		background: #161b22;
		border-bottom: 1px solid #30363d;
		flex-shrink: 0;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.mode-toggle {
		display: flex;
		background: #0d1117;
		border-radius: 6px;
		padding: 0.2rem;
		gap: 0.2rem;
		flex-shrink: 0;
	}

	.mode-btn {
		padding: 0.25rem 0.625rem;
		background: transparent;
		border: none;
		color: #8b949e;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.15s;
	}

	.mode-btn:hover { color: #e6edf3; background: #21262d; }
	.mode-btn.active { color: white; background: #1f6feb; }

	.filename-badge {
		font-size: 0.65rem;
		color: #484f58;
		font-family: 'Courier New', monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.btn-save {
		padding: 0.375rem 0.875rem;
		background: #1f6feb;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}
	.btn-save:hover { background: #388bfd; }

	.btn-kopieren {
		padding: 0.375rem 0.75rem;
		background: transparent;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #8b949e;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.btn-kopieren:hover { background: #21262d; color: #e6edf3; border-color: #484f58; }

	.btn-run {
		padding: 0.375rem 0.875rem;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.15s, box-shadow 0.15s;
	}
	.btn-run:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4); }

	.save-error {
		padding: 0.5rem 1rem;
		background: rgba(248, 81, 73, 0.1);
		border-bottom: 1px solid rgba(248, 81, 73, 0.3);
		color: #f85149;
		font-size: 0.8rem;
		flex-shrink: 0;
	}

	/* Body */
	.editor-body {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	/* YAML view */
	.yaml-view {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.yaml-hint {
		padding: 0.5rem 1rem;
		background: rgba(56, 139, 253, 0.1);
		border-bottom: 1px solid rgba(56, 139, 253, 0.2);
		font-size: 0.75rem;
		color: #58a6ff;
		flex-shrink: 0;
	}

	/* UI Form */
	.ui-form {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-title {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: #8b949e;
		border-bottom: 1px solid #21262d;
		padding-bottom: 0.5rem;
	}

	.section-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #21262d;
		padding-bottom: 0.5rem;
	}

	.phase-count {
		font-size: 0.7rem;
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
		color: #484f58;
		margin-left: 0.5rem;
	}

	/* Grids */
	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.75rem;
	}

	.time-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field label {
		font-size: 0.7rem;
		font-weight: 600;
		color: #8b949e;
	}

	.field input,
	.field select,
	.field textarea {
		padding: 0.5rem 0.625rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		font-size: 0.875rem;
		transition: border-color 0.15s;
	}

	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		outline: none;
		border-color: #1f6feb;
	}

	.field-readonly input {
		color: #484f58;
		cursor: default;
	}

	/* Listen-Felder */
	.list-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.list-row {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}

	.list-row input {
		flex: 1;
		padding: 0.4rem 0.5rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 5px;
		color: #e6edf3;
		font-size: 0.8rem;
	}

	.list-row input:focus {
		outline: none;
		border-color: #1f6feb;
	}

	.btn-list-remove {
		width: 1.5rem;
		height: 1.5rem;
		background: transparent;
		border: none;
		color: #484f58;
		cursor: pointer;
		font-size: 0.7rem;
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s, color 0.15s;
	}

	.btn-list-remove:hover { background: #da3633; color: white; }

	.btn-list-add {
		padding: 0.35rem 0.5rem;
		background: transparent;
		border: 1px dashed #30363d;
		border-radius: 5px;
		color: #484f58;
		font-size: 0.75rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s;
	}

	.btn-list-add:hover { border-color: #1f6feb; color: #58a6ff; background: rgba(31, 111, 235, 0.05); }

	/* Notizen */
	.notizen-field {
		width: 100%;
		padding: 0.625rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
		transition: border-color 0.15s;
		box-sizing: border-box;
	}

	.notizen-field:focus { outline: none; border-color: #1f6feb; }

	/* Phasen */
	.btn-add-phase {
		padding: 0.3rem 0.625rem;
		background: #1f6feb;
		border: none;
		border-radius: 5px;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}
	.btn-add-phase:hover { background: #388bfd; }

	.phases-empty {
		padding: 1rem;
		text-align: center;
		color: #484f58;
		font-size: 0.8rem;
		background: #161b22;
		border: 1px dashed #30363d;
		border-radius: 6px;
	}

	.phases-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.phase-card {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 8px;
	}

	.phase-controls {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex-shrink: 0;
	}

	.btn-phase-ctrl {
		width: 1.75rem;
		height: 1.75rem;
		background: #21262d;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.75rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
	}

	.btn-phase-ctrl:hover:not(:disabled) { background: #30363d; }
	.btn-phase-ctrl:disabled { opacity: 0.3; cursor: not-allowed; }
	.btn-phase-ctrl.btn-phase-remove { margin-top: auto; }
	.btn-phase-ctrl.btn-phase-remove:hover { background: #da3633; border-color: #da3633; }

	.phase-fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.phase-top-row {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.phase-name-input {
		padding: 0.4rem 0.5rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 5px;
		color: #e6edf3;
		font-size: 0.875rem;
		font-weight: 600;
		width: 100%;
		box-sizing: border-box;
	}

	.phase-name-input:focus { outline: none; border-color: #1f6feb; }

	.phase-meta-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.phase-dauer-input {
		width: 70px;
		padding: 0.35rem 0.5rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.8rem;
		flex-shrink: 0;
	}

	.phase-dauer-input:focus { outline: none; border-color: #1f6feb; }

	.dauer-unit {
		font-size: 0.7rem;
		color: #484f58;
		flex-shrink: 0;
	}

	.phase-icon-input {
		width: 50px;
		padding: 0.35rem 0.25rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.875rem;
		text-align: center;
		flex-shrink: 0;
	}

	.phase-icon-input:focus { outline: none; border-color: #1f6feb; }

	.phase-color-input {
		width: 36px;
		height: 32px;
		padding: 0.1rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.phase-desc-input {
		padding: 0.4rem 0.5rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.8rem;
		font-family: inherit;
		resize: vertical;
		width: 100%;
		box-sizing: border-box;
	}

	.phase-desc-input:focus { outline: none; border-color: #1f6feb; }

	/* Scrollbar */
	.ui-form::-webkit-scrollbar { width: 8px; }
	.ui-form::-webkit-scrollbar-track { background: #0d1117; }
	.ui-form::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
	.ui-form::-webkit-scrollbar-thumb:hover { background: #484f58; }
</style>
