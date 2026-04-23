/**
 * Lektion-Parser – Hilfsfunktionen für das YAML-basierte Lektionsplanungssystem.
 *
 * Dateiname-Format: yyyymmdd-weekNN-wochentag-fach-klasse-lektionszahl.yaml
 * Beispiel:         20260422-week17-mittwoch-mathematik-5a-1.yaml
 */

const WOCHENTAGE = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/**
 * Parst den Dateinamen einer Lektion in seine Bestandteile.
 * @param {string} filename  z.B. "20260422-week17-mittwoch-mathematik-5a-1.yaml"
 * @returns {{ filename, datum, datumRaw, woche, wochentag, fach, klasse, lektionszahl } | null}
 */
export function parseLektionFilename(filename) {
	const base = filename.replace(/\.yaml$/, '');
	const parts = base.split('-');
	if (parts.length < 6) return null;

	const datumRaw = parts[0]; // yyyymmdd
	if (!/^\d{8}$/.test(datumRaw)) return null;

	const wochePart = parts[1]; // week17
	if (!/^week\d+$/i.test(wochePart)) return null;

	const wochentag = parts[2]; // mittwoch
	// lektionszahl is the last part, klasse is second-to-last, fach is everything in between
	const lektionszahl = parseInt(parts[parts.length - 1], 10);
	const klasse = parts[parts.length - 2];
	const fach = parts.slice(3, parts.length - 2).join('-');

	const datum = `${datumRaw.slice(0, 4)}-${datumRaw.slice(4, 6)}-${datumRaw.slice(6, 8)}`;
	const woche = parseInt(wochePart.replace(/^week/i, ''), 10);

	return { filename, datum, datumRaw, woche, wochentag, fach, klasse, lektionszahl };
}

/**
 * Baut den Dateinamen aus den Metadaten zusammen.
 * @param {{ datum: string, woche: number, wochentag: string, fach: string, klasse: string, lektionszahl: number }} meta
 * @returns {string}  z.B. "20260422-week17-mittwoch-mathematik-5a-1.yaml"
 */
export function buildLektionFilename(meta) {
	const datumRaw = meta.datum.replace(/-/g, '');
	const wocheStr = `week${String(meta.woche).padStart(2, '0')}`;
	const fach = normalizePart(meta.fach);
	const klasse = meta.klasse.toLowerCase().replace(/\s+/g, '');
	const wochentag = meta.wochentag.toLowerCase();
	return `${datumRaw}-${wocheStr}-${wochentag}-${fach}-${klasse}-${meta.lektionszahl}.yaml`;
}

/**
 * Normalisiert einen String für den Dateinamen (Kleinbuchstaben, Umlaute, Leerzeichen → Bindestriche).
 * @param {string} str
 * @returns {string}
 */
export function normalizePart(str) {
	return str
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9\-]/g, '');
}

/**
 * Berechnet die ISO-Kalenderwoche für ein gegebenes Datum.
 * @param {Date} date
 * @returns {number}
 */
export function getKW(date) {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * Gibt den Wochentag als deutschen String zurück.
 * @param {Date} date
 * @returns {string}  z.B. "mittwoch"
 */
export function getWochentag(date) {
	return WOCHENTAGE[date.getDay()];
}

/**
 * Berechnet das Datum des Montags der KW, in der `datum` liegt.
 * @param {string} datum  ISO-Datum (YYYY-MM-DD)
 * @returns {string}  ISO-Datum des Montags
 */
export function getMontag(datum) {
	const d = new Date(datum);
	const day = d.getDay() || 7; // Sonntag → 7
	d.setDate(d.getDate() - day + 1);
	return d.toISOString().slice(0, 10);
}

/**
 * Gibt das Datum +7 Tage zurück (nächste Woche, gleicher Wochentag).
 * @param {string} datum  ISO-Datum (YYYY-MM-DD)
 * @returns {string}
 */
export function naechsteWoche(datum) {
	const d = new Date(datum);
	d.setDate(d.getDate() + 7);
	return d.toISOString().slice(0, 10);
}

/**
 * Erstellt eine leere Lektion mit Standardwerten.
 * @param {Partial<Lektion>} overrides
 * @returns {Lektion}
 */
export function createEmptyLektion(overrides = {}) {
	const heute = new Date();
	const datum = heute.toISOString().slice(0, 10);
	return {
		datum,
		woche: getKW(heute),
		wochentag: getWochentag(heute),
		fach: '',
		klasse: '',
		lektionszahl: 1,
		startzeit: '08:00',
		endzeit: '08:45',
		thema: '',
		lernziele: [],
		materialien: [],
		notizen: '',
		phasen: [],
		...overrides
	};
}

/**
 * Formatiert eine Lektion für die Anzeige in der Sidebar.
 * @param {{ datum: string, wochentag: string, fach: string, klasse: string, lektionszahl: number, thema?: string }} lektion
 * @returns {string}
 */
export function lektionLabel(lektion) {
	const d = new Date(lektion.datum);
	const tag = WOCHENTAGE_KURZ[d.getDay()] || lektion.wochentag;
	return `${lektion.datum} ${tag} – ${lektion.fach} ${lektion.klasse} (${lektion.lektionszahl}.)`;
}

/**
 * Gruppiert ein Array von Lektions-Metadaten nach KW.
 * @param {Array} lektionen
 * @returns {Map<number, Array>}  KW → Lektionen
 */
export function gruppiereNachKW(lektionen) {
	const map = new Map();
	for (const l of lektionen) {
		if (!map.has(l.woche)) map.set(l.woche, []);
		map.get(l.woche).push(l);
	}
	// Sort within each week by datum then lektionszahl
	for (const [, arr] of map) {
		arr.sort((a, b) => a.datum.localeCompare(b.datum) || a.lektionszahl - b.lektionszahl);
	}
	return map;
}

/**
 * Gibt eine Standard-Phase zurück.
 * @returns {Phase}
 */
export function createEmptyPhase() {
	return {
		name: 'Neue Phase',
		dauer: 10, // Minuten
		icon: '📝',
		farbe: '#007BC0',
		beschreibung: ''
	};
}
