<script>
	import { lektionenStore } from '$lib/stores/lektionen.svelte.js';
	import { createEmptyLektion, buildLektionFilename, getKW, getMontag } from '$lib/utils/lektion-parser.js';
	import KopierenDialog from './KopierenDialog.svelte';

	let {
		onSelectLektion = () => {},
		onNewLektion = () => {}
	} = $props();

	// Neue Lektion Dialog
	let showNewForm = $state(false);
	let newLektion = $state(createEmptyLektion());
	let newFilenamePreview = $derived(
		newLektion.datum && newLektion.fach && newLektion.klasse && newLektion.wochentag
			? buildLektionFilename(newLektion)
			: '(Felder ausfüllen...)'
	);

	// KW-Kopieren Dialog
	let showWocheKopierenDialog = $state(false);
	let wocheKopierenKW = $state(null);

	// Wochentage in Kurzform für Anzeige
	const WOCHENTAGE_KURZ = { montag: 'Mo', dienstag: 'Di', mittwoch: 'Mi', donnerstag: 'Do', freitag: 'Fr', samstag: 'Sa', sonntag: 'So' };

	function handleSelectLektion(filename) {
		lektionenStore.selectLektion(filename);
		onSelectLektion(filename);
	}

	async function handleCreateLektion() {
		if (!newLektion.fach || !newLektion.klasse) return;
		const result = await lektionenStore.createLektion(newLektion);
		if (result.success) {
			showNewForm = false;
			newLektion = createEmptyLektion();
			onNewLektion(result.filename);
		}
	}

	async function handleDeleteLektion(filename, event) {
		event.stopPropagation();
		if (!confirm(`Lektion "${filename}" wirklich löschen?`)) return;
		await lektionenStore.deleteLektion(filename);
	}

	function handleOpenWocheKopieren(kw, event) {
		event.stopPropagation();
		wocheKopierenKW = kw;
		showWocheKopierenDialog = true;
	}

	function updateNewLektionDatum(datum) {
		if (!datum) return;
		const d = new Date(datum);
		const tage = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
		newLektion = {
			...newLektion,
			datum,
			woche: getKW(d),
			wochentag: tage[d.getDay()]
		};
	}
</script>

<div class="lektionen-sidebar">
	<!-- Header -->
	<div class="sidebar-header">
		<span class="sidebar-title">Lektionen</span>
		<button
			class="btn-icon-header"
			title="Neue Lektion"
			onclick={() => (showNewForm = !showNewForm)}
		>
			{showNewForm ? '✕' : '+'}
		</button>
	</div>

	<!-- Filter -->
	<div class="filter-bar">
		<select
			class="filter-select"
			value={lektionenStore.filterKlasse}
			onchange={(e) => lektionenStore.setFilterKlasse(e.target.value)}
			title="Klasse filtern"
		>
			<option value="">Alle Klassen</option>
			{#each lektionenStore.alleKlassen as klasse}
				<option value={klasse}>{klasse}</option>
			{/each}
		</select>

		<select
			class="filter-select"
			value={lektionenStore.filterKW ?? ''}
			onchange={(e) => lektionenStore.setFilterKW(e.target.value ? Number(e.target.value) : null)}
			title="Kalenderwoche filtern"
		>
			<option value="">Alle KW</option>
			{#each lektionenStore.alleKW as kw}
				<option value={kw}>KW {kw}</option>
			{/each}
		</select>

		{#if lektionenStore.filterKW !== null || lektionenStore.filterKlasse || lektionenStore.filterFach}
			<button class="btn-clear-filter" onclick={() => lektionenStore.clearFilter()} title="Filter zurücksetzen">
				✕
			</button>
		{/if}
	</div>

	<!-- Neue Lektion Formular -->
	{#if showNewForm}
		<div class="new-form">
			<div class="form-row">
				<label>Datum</label>
				<input
					type="date"
					value={newLektion.datum}
					onchange={(e) => updateNewLektionDatum(e.target.value)}
				/>
			</div>
			<div class="form-row">
				<label>Fach</label>
				<input
					type="text"
					placeholder="z.B. Mathematik"
					bind:value={newLektion.fach}
				/>
			</div>
			<div class="form-row">
				<label>Klasse</label>
				<input
					type="text"
					placeholder="z.B. 5a"
					bind:value={newLektion.klasse}
				/>
			</div>
			<div class="form-row">
				<label>Lekt. Nr.</label>
				<input
					type="number"
					min="1"
					bind:value={newLektion.lektionszahl}
				/>
			</div>
			<div class="filename-preview">
				{newFilenamePreview}
			</div>
			<div class="form-actions">
				<button
					class="btn-create"
					onclick={handleCreateLektion}
					disabled={!newLektion.fach || !newLektion.klasse}
				>
					Erstellen
				</button>
				<button class="btn-cancel" onclick={() => (showNewForm = false)}>Abbrechen</button>
			</div>
		</div>
	{/if}

	<!-- Lektionen-Liste -->
	<div class="lektionen-list">
		{#if lektionenStore.loading}
			<div class="loading">Laden...</div>
		{:else if [...lektionenStore.nachKW.keys()].length === 0}
			<div class="empty-state">
				<p>Keine Lektionen vorhanden.</p>
				<p>Klicke auf "+" um eine neue Lektion zu erstellen.</p>
			</div>
		{:else}
			{#each [...lektionenStore.nachKW.entries()].sort((a, b) => b[0] - a[0]) as [kw, lektionen] (kw)}
				<div class="kw-group">
					<div class="kw-header">
						<span class="kw-label">KW {kw}</span>
						<button
							class="btn-copy-week"
							title="Ganze Woche kopieren"
							onclick={(e) => handleOpenWocheKopieren(kw, e)}
						>
							⧉
						</button>
					</div>

					{#each lektionen as meta (meta.filename)}
						<div
							class="lektion-item"
							class:active={lektionenStore.selectedFilename === meta.filename}
							role="button"
							tabindex="0"
							onclick={() => handleSelectLektion(meta.filename)}
							onkeydown={(e) => e.key === 'Enter' && handleSelectLektion(meta.filename)}
						>
							<div class="lektion-info">
								<div class="lektion-header-line">
									<span class="lektion-tag">{WOCHENTAGE_KURZ[meta.wochentag] ?? meta.wochentag}</span>
									<span class="lektion-datum">{meta.datum}</span>
								</div>
								<div class="lektion-title">{meta.fach} · {meta.klasse}</div>
								<div class="lektion-sub">{meta.lektionszahl}. Lektion</div>
							</div>
							<button
								class="btn-delete"
								title="Löschen"
								onclick={(e) => handleDeleteLektion(meta.filename, e)}
							>
								🗑
							</button>
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Woche Kopieren Dialog -->
{#if showWocheKopierenDialog && wocheKopierenKW !== null}
	<KopierenDialog
		modus="woche"
		quellWoche={wocheKopierenKW}
		alleKlassen={lektionenStore.alleKlassen}
		onKopieren={async (opts) => {
			await lektionenStore.copyWeek(opts.quellWoche, opts.zielMontag, opts.zielKlasse || null);
			showWocheKopierenDialog = false;
		}}
		onAbbrechen={() => (showWocheKopierenDialog = false)}
	/>
{/if}

<style>
	.lektionen-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.sidebar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #30363d;
		flex-shrink: 0;
	}

	.sidebar-title {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #8b949e;
	}

	.btn-icon-header {
		width: 1.5rem;
		height: 1.5rem;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: #8b949e;
		cursor: pointer;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}

	.btn-icon-header:hover {
		background: #21262d;
		color: #e6edf3;
	}

	.filter-bar {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem 0.5rem;
		border-bottom: 1px solid #30363d;
		flex-shrink: 0;
	}

	.filter-select {
		flex: 1;
		min-width: 0;
		padding: 0.25rem 0.375rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.7rem;
		cursor: pointer;
	}

	.filter-select:focus {
		outline: none;
		border-color: #1f6feb;
	}

	.btn-clear-filter {
		width: 1.5rem;
		padding: 0.25rem;
		background: transparent;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #8b949e;
		cursor: pointer;
		font-size: 0.7rem;
		flex-shrink: 0;
	}

	.btn-clear-filter:hover {
		background: #21262d;
		color: #e6edf3;
	}

	/* Neue Lektion Formular */
	.new-form {
		padding: 0.75rem;
		background: #161b22;
		border-bottom: 1px solid #30363d;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.form-row {
		display: grid;
		grid-template-columns: 60px 1fr;
		align-items: center;
		gap: 0.5rem;
	}

	.form-row label {
		font-size: 0.7rem;
		color: #8b949e;
		font-weight: 600;
	}

	.form-row input {
		padding: 0.25rem 0.375rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.75rem;
	}

	.form-row input:focus {
		outline: none;
		border-color: #1f6feb;
	}

	.filename-preview {
		font-size: 0.65rem;
		color: #484f58;
		font-family: 'Courier New', monospace;
		padding: 0.25rem;
		background: #0d1117;
		border-radius: 3px;
		word-break: break-all;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-create {
		flex: 1;
		padding: 0.375rem;
		background: #1f6feb;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-create:hover:not(:disabled) {
		background: #388bfd;
	}

	.btn-create:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-cancel {
		padding: 0.375rem 0.5rem;
		background: transparent;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #8b949e;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.btn-cancel:hover {
		background: #21262d;
		color: #e6edf3;
	}

	/* Lektionen-Liste */
	.lektionen-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
	}

	.loading,
	.empty-state {
		padding: 1rem 0.75rem;
		color: #484f58;
		font-size: 0.75rem;
		text-align: center;
	}

	.empty-state p {
		margin: 0.25rem 0;
	}

	/* KW-Gruppe */
	.kw-group {
		margin-bottom: 0.5rem;
	}

	.kw-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0.75rem 0.25rem 0.5rem;
		position: sticky;
		top: 0;
		background: #0d1117;
		z-index: 1;
	}

	.kw-label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #484f58;
	}

	.btn-copy-week {
		padding: 0.125rem 0.25rem;
		background: transparent;
		border: none;
		border-radius: 3px;
		color: #484f58;
		cursor: pointer;
		font-size: 0.85rem;
		line-height: 1;
		transition: color 0.15s, background 0.15s;
	}

	.btn-copy-week:hover {
		color: #8b949e;
		background: #21262d;
	}

	/* Einzel-Lektion */
	.lektion-item {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 0.375rem 0.5rem 0.375rem 1rem;
		background: transparent;
		border: none;
		color: #cdd9e5;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
		gap: 0.5rem;
	}

	.lektion-item:hover {
		background: #21262d;
	}

	.lektion-item.active {
		background: rgba(31, 111, 235, 0.15);
		color: #58a6ff;
	}

	.lektion-info {
		flex: 1;
		min-width: 0;
	}

	.lektion-header-line {
		display: flex;
		gap: 0.375rem;
		align-items: baseline;
		margin-bottom: 0.1rem;
	}

	.lektion-tag {
		font-size: 0.65rem;
		font-weight: 700;
		color: #58a6ff;
		background: rgba(31, 111, 235, 0.15);
		padding: 0.1rem 0.3rem;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.lektion-item.active .lektion-tag {
		background: rgba(31, 111, 235, 0.3);
	}

	.lektion-datum {
		font-size: 0.65rem;
		color: #484f58;
	}

	.lektion-title {
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.lektion-sub {
		font-size: 0.65rem;
		color: #484f58;
	}

	.btn-delete {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 0.75rem;
		color: #484f58;
		padding: 0.25rem;
		border-radius: 3px;
		opacity: 0;
		transition: opacity 0.15s, background 0.15s;
		flex-shrink: 0;
	}

	.lektion-item:hover .btn-delete {
		opacity: 1;
	}

	.btn-delete:hover {
		background: #da3633;
		color: white;
	}

	/* Scrollbar */
	.lektionen-list::-webkit-scrollbar {
		width: 4px;
	}
	.lektionen-list::-webkit-scrollbar-track {
		background: transparent;
	}
	.lektionen-list::-webkit-scrollbar-thumb {
		background: #30363d;
		border-radius: 2px;
	}
</style>
