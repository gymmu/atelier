<script>
	import { getMontag, getKW, buildLektionFilename } from '$lib/utils/lektion-parser.js';

	let {
		modus = 'einzeln',     // 'einzeln' | 'woche'
		quellFilename = null,  // Dateiname der Quelllektion (modus='einzeln')
		quellLektion = null,   // Vollständige Lektionsdaten (modus='einzeln')
		quellWoche = null,     // KW-Nummer (modus='woche')
		alleKlassen = [],
		onKopieren = () => {},
		onAbbrechen = () => {}
	} = $props();

	// Formularwerte
	let zielDatum = $state(berechneMorgen());
	let zielKlasse = $state('');
	let zielMontag = $state(berechneNaechstenMontag());
	let naechsteWocheChecked = $state(true);

	function berechneMorgen() {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		return d.toISOString().slice(0, 10);
	}

	function berechneNaechstenMontag() {
		const d = new Date();
		const day = d.getDay();
		const daysToMonday = day === 0 ? 1 : 8 - day;
		d.setDate(d.getDate() + daysToMonday);
		return d.toISOString().slice(0, 10);
	}

	function toggleNaechsteWoche() {
		naechsteWocheChecked = !naechsteWocheChecked;
		if (naechsteWocheChecked && quellLektion?.datum) {
			// +7 Tage vom Quelldatum
			const d = new Date(quellLektion.datum);
			d.setDate(d.getDate() + 7);
			zielDatum = d.toISOString().slice(0, 10);
		}
	}

	// Vorschau des neuen Dateinamens (nur bei Einzellektion)
	let filenamePreview = $derived.by(() => {
		if (modus !== 'einzeln' || !quellLektion) return '';
		try {
			const d = new Date(zielDatum);
			const tage = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
			const preview = {
				datum: zielDatum,
				woche: getKW(d),
				wochentag: tage[d.getDay()],
				fach: quellLektion.fach,
				klasse: zielKlasse || quellLektion.klasse,
				lektionszahl: quellLektion.lektionszahl
			};
			return buildLektionFilename(preview);
		} catch {
			return '(ungültiges Datum)';
		}
	});

	function handleKopieren() {
		if (modus === 'einzeln') {
			const opts = {};
			if (zielDatum) opts.zielDatum = zielDatum;
			if (zielKlasse) opts.zielKlasse = zielKlasse;
			onKopieren(opts);
		} else {
			// Woche
			onKopieren({
				quellWoche,
				zielMontag,
				zielKlasse: zielKlasse || null
			});
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') onAbbrechen();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Modal-Overlay -->
<div class="overlay" onclick={onAbbrechen} role="presentation">
	<div class="dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
		<div class="dialog-header">
			<h3>
				{#if modus === 'woche'}
					KW {quellWoche} kopieren
				{:else}
					Lektion kopieren
				{/if}
			</h3>
			<button class="btn-close" onclick={onAbbrechen}>✕</button>
		</div>

		<div class="dialog-body">
			{#if modus === 'einzeln'}
				<!-- Quelle -->
				{#if quellLektion}
					<div class="info-row">
						<span class="info-label">Quelle</span>
						<span class="info-value">{quellFilename ?? ''}</span>
					</div>
				{/if}

				<!-- Schnell: nächste Woche -->
				{#if quellLektion?.datum}
					<button
						class="btn-quick"
						class:active={naechsteWocheChecked}
						onclick={toggleNaechsteWoche}
					>
						<span>+7 Tage (nächste Woche)</span>
						{#if naechsteWocheChecked}
							<span class="check">✓</span>
						{/if}
					</button>
				{/if}

				<div class="form-group">
					<label for="ziel-datum">Zieldatum</label>
					<input
						id="ziel-datum"
						type="date"
						bind:value={zielDatum}
						onchange={() => (naechsteWocheChecked = false)}
					/>
				</div>
			{:else}
				<!-- Woche-Modus -->
				<div class="info-row">
					<span class="info-label">Quellwoche</span>
					<span class="info-value">KW {quellWoche}</span>
				</div>

				<div class="form-group">
					<label for="ziel-montag">Montag der Zielwoche</label>
					<input
						id="ziel-montag"
						type="date"
						bind:value={zielMontag}
					/>
					<span class="field-hint">Wähle den Montag der Zielwoche. Der Wochentag jeder Lektion bleibt erhalten.</span>
				</div>
			{/if}

			<!-- Klasse überschreiben (beide Modi) -->
			<div class="form-group">
				<label for="ziel-klasse">Klasse überschreiben <span class="optional">(optional)</span></label>
				{#if alleKlassen.length > 0}
					<div class="klasse-input-group">
						<select
							value={zielKlasse}
							onchange={(e) => (zielKlasse = e.target.value)}
						>
							<option value="">– Klasse beibehalten –</option>
							{#each alleKlassen as k}
								<option value={k}>{k}</option>
							{/each}
						</select>
						<span class="or-divider">oder</span>
						<input
							id="ziel-klasse"
							type="text"
							placeholder="Neue Klasse eingeben"
							bind:value={zielKlasse}
						/>
					</div>
				{:else}
					<input
						id="ziel-klasse"
						type="text"
						placeholder="z.B. 5b"
						bind:value={zielKlasse}
					/>
				{/if}
			</div>

			<!-- Dateiname-Vorschau (nur Einzellektion) -->
			{#if modus === 'einzeln' && filenamePreview}
				<div class="preview">
					<span class="preview-label">Neue Datei</span>
					<code class="preview-filename">{filenamePreview}</code>
				</div>
			{/if}
		</div>

		<div class="dialog-footer">
			<button class="btn-kopieren" onclick={handleKopieren}>
				{modus === 'woche' ? 'Woche kopieren' : 'Lektion kopieren'}
			</button>
			<button class="btn-abbrechen" onclick={onAbbrechen}>Abbrechen</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(2px);
	}

	.dialog {
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 10px;
		width: 400px;
		max-width: 90vw;
		display: flex;
		flex-direction: column;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #30363d;
	}

	.dialog-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #e6edf3;
	}

	.btn-close {
		width: 1.5rem;
		height: 1.5rem;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: #8b949e;
		cursor: pointer;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-close:hover {
		background: #30363d;
		color: #e6edf3;
	}

	.dialog-body {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-row {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
	}

	.info-label {
		font-size: 0.75rem;
		color: #8b949e;
		font-weight: 600;
		flex-shrink: 0;
		width: 60px;
	}

	.info-value {
		font-size: 0.75rem;
		color: #cdd9e5;
		font-family: 'Courier New', monospace;
		word-break: break-all;
	}

	.btn-quick {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #8b949e;
		font-size: 0.8rem;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
		width: 100%;
		text-align: left;
	}

	.btn-quick:hover {
		border-color: #484f58;
		color: #cdd9e5;
	}

	.btn-quick.active {
		border-color: #1f6feb;
		color: #58a6ff;
		background: rgba(31, 111, 235, 0.1);
	}

	.check {
		font-size: 0.85rem;
		color: #3fb950;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-group label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #8b949e;
	}

	.optional {
		font-weight: 400;
		color: #484f58;
	}

	.form-group input,
	.form-group select {
		padding: 0.5rem 0.625rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		font-size: 0.875rem;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #1f6feb;
	}

	.klasse-input-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.klasse-input-group select,
	.klasse-input-group input {
		flex: 1;
	}

	.or-divider {
		font-size: 0.7rem;
		color: #484f58;
		flex-shrink: 0;
	}

	.field-hint {
		font-size: 0.7rem;
		color: #484f58;
		line-height: 1.4;
	}

	.preview {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.625rem;
		background: #0d1117;
		border-radius: 6px;
		border: 1px solid #30363d;
	}

	.preview-label {
		font-size: 0.65rem;
		color: #8b949e;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.preview-filename {
		font-size: 0.7rem;
		color: #3fb950;
		font-family: 'Courier New', monospace;
		word-break: break-all;
	}

	.dialog-footer {
		display: flex;
		gap: 0.5rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid #30363d;
	}

	.btn-kopieren {
		flex: 1;
		padding: 0.625rem;
		background: #1f6feb;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-kopieren:hover {
		background: #388bfd;
	}

	.btn-abbrechen {
		padding: 0.625rem 1rem;
		background: transparent;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #8b949e;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.btn-abbrechen:hover {
		background: #21262d;
		color: #e6edf3;
	}
</style>
