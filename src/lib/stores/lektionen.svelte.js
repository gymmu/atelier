/**
 * Lektionen Store – Verwaltet YAML-basierte Lektionspläne
 * Verwendet Svelte 5 Runes für Reaktivität
 */

import { lektionenAPI } from '$lib/api/lektionen.js';
import { gruppiereNachKW, getKW, getMontag } from '$lib/utils/lektion-parser.js';

// ─── State ────────────────────────────────────────────────────────────────────

let lektionenMeta = $state([]); // Array von { filename, datum, woche, wochentag, fach, klasse, lektionszahl }
let selectedFilename = $state(null); // aktuell geöffnete Lektion (Dateiname)
let selectedLektion = $state(null); // vollständige Lektionsdaten (inkl. _filename)
let initialized = $state(false);
let loading = $state(false);
let error = $state(null);

// Filter
let filterKW = $state(null); // null = alle Wochen
let filterKlasse = $state(''); // '' = alle Klassen
let filterFach = $state('');   // '' = alle Fächer

// ─── Derived ──────────────────────────────────────────────────────────────────

let gefiltert = $derived.by(() => {
	let liste = lektionenMeta;
	if (filterKW !== null) liste = liste.filter((l) => l.woche === filterKW);
	if (filterKlasse) liste = liste.filter((l) => l.klasse === filterKlasse);
	if (filterFach) liste = liste.filter((l) => l.fach.toLowerCase().includes(filterFach.toLowerCase()));
	return liste;
});

let nachKW = $derived.by(() => gruppiereNachKW(gefiltert));

let alleKlassen = $derived.by(() => {
	const set = new Set(lektionenMeta.map((l) => l.klasse).filter(Boolean));
	return [...set].sort();
});

let alleFaecher = $derived.by(() => {
	const set = new Set(lektionenMeta.map((l) => l.fach).filter(Boolean));
	return [...set].sort();
});

let alleKW = $derived.by(() => {
	const set = new Set(lektionenMeta.map((l) => l.woche));
	return [...set].sort((a, b) => a - b);
});

// ─── Store-Objekt ────────────────────────────────────────────────────────────

export const lektionenStore = {
	// ── Getters ──
	get list() { return lektionenMeta; },
	get lektionenMeta() { return lektionenMeta; },
	get gefiltert() { return gefiltert; },
	get nachKW() { return nachKW; },
	get selectedFilename() { return selectedFilename; },
	get selectedLektion() { return selectedLektion; },
	get initialized() { return initialized; },
	get loading() { return loading; },
	get error() { return error; },
	get filterKW() { return filterKW; },
	get filterKlasse() { return filterKlasse; },
	get filterFach() { return filterFach; },
	get alleKlassen() { return alleKlassen; },
	get alleFaecher() { return alleFaecher; },
	get alleKW() { return alleKW; },

	// ── Initialisierung ──
	async init() {
		if (initialized) return;
		await this.loadLektionen();
		initialized = true;
	},

	// ── Lektionen laden ──
	async loadLektionen() {
		loading = true;
		error = null;
		try {
			lektionenMeta = await lektionenAPI.getAll();
		} catch (err) {
			error = err.message;
			console.error('Fehler beim Laden der Lektionen:', err);
		} finally {
			loading = false;
		}
	},

	// ── Lektion auswählen ──
	async selectLektion(filename) {
		if (selectedFilename === filename) return;
		selectedFilename = filename;
		selectedLektion = null;

		if (!filename) return;

		loading = true;
		try {
			selectedLektion = await lektionenAPI.get(filename);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	},

	// ── Lektion laden (ohne Auswahl zu ändern) ──
	async loadLektion(filename) {
		try {
			return await lektionenAPI.get(filename);
		} catch (err) {
			console.error('Fehler beim Laden der Lektion:', err);
			return null;
		}
	},

	// ── Auswahl zurücksetzen ──
	clearSelection() {
		selectedFilename = null;
		selectedLektion = null;
	},

	// ── Neue Lektion erstellen ──
	async createLektion(lektionData) {
		loading = true;
		error = null;
		try {
			const result = await lektionenAPI.save(lektionData);
			if (result.success) {
				await this.loadLektionen();
				await this.selectLektion(result.filename);
			}
			return result;
		} catch (err) {
			error = err.message;
			return { success: false, error: err.message };
		} finally {
			loading = false;
		}
	},

	// ── Lektion speichern ──
	async saveLektion(lektionData) {
		loading = true;
		error = null;
		try {
			const result = await lektionenAPI.save(lektionData);
			if (result.success) {
				await this.loadLektionen();
				// Falls Dateiname geändert (wegen Metadaten-Änderung), neue Auswahl setzen
				if (result.filename !== selectedFilename) {
					selectedFilename = result.filename;
				}
				// Reload selected lektion
				selectedLektion = await lektionenAPI.get(result.filename);
			}
			return result;
		} catch (err) {
			error = err.message;
			return { success: false, error: err.message };
		} finally {
			loading = false;
		}
	},

	// ── Lektion löschen ──
	async deleteLektion(filename) {
		loading = true;
		error = null;
		try {
			const result = await lektionenAPI.delete(filename);
			if (result.success) {
				if (selectedFilename === filename) {
					selectedFilename = null;
					selectedLektion = null;
				}
				await this.loadLektionen();
			}
			return result;
		} catch (err) {
			error = err.message;
			return { success: false, error: err.message };
		} finally {
			loading = false;
		}
	},

	// ── Lektion kopieren ──
	async copyLektion(filename, opts) {
		loading = true;
		error = null;
		try {
			const result = await lektionenAPI.copy(filename, opts);
			if (result.success) {
				await this.loadLektionen();
				await this.selectLektion(result.filename);
			}
			return result;
		} catch (err) {
			error = err.message;
			return { success: false, error: err.message };
		} finally {
			loading = false;
		}
	},

	// ── Ganze Woche kopieren ──
	async copyWeek(quellWoche, zielDatumErsterTag, zielKlasse = null) {
		loading = true;
		error = null;
		try {
			const result = await lektionenAPI.copyWeek(quellWoche, zielDatumErsterTag, zielKlasse);
			if (result.success) {
				await this.loadLektionen();
			}
			return result;
		} catch (err) {
			error = err.message;
			return { success: false, error: err.message };
		} finally {
			loading = false;
		}
	},

	// ── Filter setzen ──
	setFilterKW(kw) { filterKW = kw; },
	setFilterKlasse(klasse) { filterKlasse = klasse; },
	setFilterFach(fach) { filterFach = fach; },
	clearFilter() {
		filterKW = null;
		filterKlasse = '';
		filterFach = '';
	},

	// ── Aktuelle KW hervorheben ──
	setFilterToCurrentWeek() {
		filterKW = getKW(new Date());
	}
};
