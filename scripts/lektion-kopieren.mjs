#!/usr/bin/env node
/**
 * lektion-kopieren.mjs
 *
 * CLI-Skript zum Kopieren von Lektions-YAML-Dateien auf ein anderes Datum,
 * eine andere Klasse oder in eine andere Woche.
 *
 * Verwendung:
 *   node scripts/lektion-kopieren.mjs --help
 *
 * Beispiele:
 *   # Einzelne Lektion → nächste Woche (gleicher Wochentag)
 *   node scripts/lektion-kopieren.mjs \
 *     --quelle 20260422-week17-mittwoch-mathematik-5a-1.yaml \
 *     --naechste-woche
 *
 *   # Einzelne Lektion → beliebiges Datum
 *   node scripts/lektion-kopieren.mjs \
 *     --quelle 20260422-week17-mittwoch-mathematik-5a-1.yaml \
 *     --ziel-datum 2026-05-06
 *
 *   # Einzelne Lektion → andere Klasse
 *   node scripts/lektion-kopieren.mjs \
 *     --quelle 20260422-week17-mittwoch-mathematik-5a-1.yaml \
 *     --ziel-klasse 5b
 *
 *   # Kombination: andere Klasse + nächste Woche
 *   node scripts/lektion-kopieren.mjs \
 *     --quelle 20260422-week17-mittwoch-mathematik-5a-1.yaml \
 *     --naechste-woche --ziel-klasse 5b
 *
 *   # Ganze Woche kopieren (KW17 → KW18)
 *   node scripts/lektion-kopieren.mjs \
 *     --woche 17 \
 *     --ziel-montag 2026-04-28
 *
 *   # Ganze Woche + andere Klasse
 *   node scripts/lektion-kopieren.mjs \
 *     --woche 17 \
 *     --ziel-montag 2026-04-28 \
 *     --ziel-klasse 5b
 */

import fs from 'fs/promises';
import path from 'path';
import { parse as parseYAML, stringify as stringifyYAML } from 'yaml';
import { parseArgs } from 'util';

// ─── Hilfsfunktionen (dupliziert vom Frontend-Utility) ──────────────────────

const WOCHENTAGE = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];

function parseLektionFilename(filename) {
	const base = filename.replace(/\.yaml$/, '');
	const parts = base.split('-');
	if (parts.length < 6) return null;

	const datumRaw = parts[0];
	if (!/^\d{8}$/.test(datumRaw)) return null;

	const wochePart = parts[1];
	if (!/^week\d+$/i.test(wochePart)) return null;

	const wochentag = parts[2];
	const lektionszahl = parseInt(parts[parts.length - 1], 10);
	const klasse = parts[parts.length - 2];
	const fach = parts.slice(3, parts.length - 2).join('-');
	const datum = `${datumRaw.slice(0, 4)}-${datumRaw.slice(4, 6)}-${datumRaw.slice(6, 8)}`;
	const woche = parseInt(wochePart.replace(/^week/i, ''), 10);

	return { filename, datum, datumRaw, woche, wochentag, fach, klasse, lektionszahl };
}

function normalizePart(str) {
	return str
		.toLowerCase()
		.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9\-]/g, '');
}

function buildLektionFilename(meta) {
	const datumRaw = meta.datum.replace(/-/g, '');
	const wocheStr = `week${String(meta.woche).padStart(2, '0')}`;
	const fach = normalizePart(meta.fach);
	const klasse = meta.klasse.toLowerCase().replace(/\s+/g, '');
	const wochentag = meta.wochentag.toLowerCase();
	return `${datumRaw}-${wocheStr}-${wochentag}-${fach}-${klasse}-${meta.lektionszahl}.yaml`;
}

function getKW(date) {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function addDays(isoDate, days) {
	const d = new Date(isoDate);
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

function kopiereMeta(source, { zielDatum, zielKlasse }) {
	const kopie = { ...source };

	if (zielDatum) {
		const d = new Date(zielDatum);
		kopie.datum = zielDatum;
		kopie.woche = getKW(d);
		kopie.wochentag = WOCHENTAGE[d.getDay()];
	}
	if (zielKlasse) {
		kopie.klasse = zielKlasse;
	}
	return kopie;
}

// ─── Hauptprogramm ──────────────────────────────────────────────────────────

const HELP = `
lektion-kopieren.mjs – Lektions-YAML-Dateien kopieren

VERWENDUNG
  node scripts/lektion-kopieren.mjs [Optionen]

OPTIONEN (einzelne Lektion)
  --quelle <datei>          Quelldatei (Dateiname oder vollständiger Pfad)
  --naechste-woche          Auf gleichen Wochentag der nächsten Woche kopieren
  --ziel-datum <YYYY-MM-DD> Auf beliebiges Datum kopieren
  --ziel-klasse <klasse>    Klasse überschreiben (z.B. 5b)

OPTIONEN (ganze Woche)
  --woche <KW>              Quell-Kalenderwoche (Zahl, z.B. 17)
  --ziel-montag <YYYY-MM-DD> Montag der Zielwoche
  --ziel-klasse <klasse>    Klasse für alle Lektionen überschreiben

GEMEINSAME OPTIONEN
  --dir <pfad>              Arbeitsverzeichnis (Standard: aktuelles Verzeichnis)
                            Erwartet, dass .atelier/lektionen/ darin existiert
  --trocken-lauf            Zeigt an, was kopiert würde, ohne Dateien zu schreiben
  --hilfe, --help           Diese Hilfe anzeigen

BEISPIELE
  # Nächste Woche
  node scripts/lektion-kopieren.mjs \\
    --quelle 20260422-week17-mittwoch-mathematik-5a-1.yaml \\
    --naechste-woche

  # Beliebiges Datum + andere Klasse
  node scripts/lektion-kopieren.mjs \\
    --quelle 20260422-week17-mittwoch-mathematik-5a-1.yaml \\
    --ziel-datum 2026-05-06 --ziel-klasse 5b

  # Ganze KW17 nach KW18
  node scripts/lektion-kopieren.mjs \\
    --woche 17 --ziel-montag 2026-04-28

  # Trockenlauf
  node scripts/lektion-kopieren.mjs \\
    --woche 17 --ziel-montag 2026-04-28 --trocken-lauf
`.trim();

async function main() {
	const { values } = parseArgs({
		options: {
			quelle:         { type: 'string' },
			'naechste-woche': { type: 'boolean', default: false },
			'ziel-datum':   { type: 'string' },
			'ziel-klasse':  { type: 'string' },
			woche:          { type: 'string' },
			'ziel-montag':  { type: 'string' },
			dir:            { type: 'string', default: process.cwd() },
			'trocken-lauf': { type: 'boolean', default: false },
			hilfe:          { type: 'boolean', default: false },
			help:           { type: 'boolean', default: false }
		},
		strict: false
	});

	if (values.hilfe || values.help) {
		console.log(HELP);
		process.exit(0);
	}

	const lektionenDir = path.join(values.dir, '.atelier', 'lektionen');
	const trockenLauf = values['trocken-lauf'];

	// Verzeichnis prüfen
	try {
		await fs.access(lektionenDir);
	} catch {
		console.error(`Fehler: Verzeichnis nicht gefunden: ${lektionenDir}`);
		console.error('Stelle sicher, dass --dir auf das richtige Arbeitsverzeichnis zeigt.');
		process.exit(1);
	}

	// ── Modus: ganze Woche ──
	if (values.woche) {
		const quellKW = parseInt(values.woche, 10);
		const zielMontag = values['ziel-montag'];
		const zielKlasse = values['ziel-klasse'] ?? null;

		if (!zielMontag) {
			console.error('Fehler: --ziel-montag ist erforderlich wenn --woche angegeben wird.');
			process.exit(1);
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(zielMontag)) {
			console.error('Fehler: --ziel-montag muss im Format YYYY-MM-DD sein.');
			process.exit(1);
		}

		const alleFiles = await fs.readdir(lektionenDir);
		const quellLektionen = alleFiles
			.filter((f) => f.endsWith('.yaml'))
			.map(parseLektionFilename)
			.filter((m) => m && m.woche === quellKW);

		if (quellLektionen.length === 0) {
			console.error(`Keine Lektionen in KW ${quellKW} gefunden.`);
			process.exit(1);
		}

		console.log(`Kopiere ${quellLektionen.length} Lektion(en) von KW ${quellKW} nach Woche ab ${zielMontag}${zielKlasse ? ` (Klasse: ${zielKlasse})` : ''}...\n`);

		const tageMap = { montag: 0, dienstag: 1, mittwoch: 2, donnerstag: 3, freitag: 4, samstag: 5, sonntag: 6 };

		for (const meta of quellLektionen) {
			const sourceFile = path.join(lektionenDir, meta.filename);
			const sourceContent = await fs.readFile(sourceFile, 'utf8');
			const sourceData = parseYAML(sourceContent);

			const offset = tageMap[meta.wochentag] ?? 0;
			const zielDatum = addDays(zielMontag, offset);
			const kopie = kopiereMeta(sourceData, { zielDatum, zielKlasse });

			const newFilename = buildLektionFilename({
				datum: kopie.datum,
				woche: kopie.woche,
				wochentag: kopie.wochentag,
				fach: kopie.fach,
				klasse: kopie.klasse,
				lektionszahl: kopie.lektionszahl
			});

			const zielFile = path.join(lektionenDir, newFilename);

			if (trockenLauf) {
				console.log(`  [TROCKEN] ${meta.filename} → ${newFilename}`);
			} else {
				// Prüfen ob Zieldatei bereits existiert
				try {
					await fs.access(zielFile);
					console.warn(`  WARNUNG: Datei existiert bereits, wird überschrieben: ${newFilename}`);
				} catch { /* nicht vorhanden, gut */ }

				await fs.writeFile(zielFile, stringifyYAML(kopie, { lineWidth: 0 }), 'utf8');
				console.log(`  OK  ${meta.filename} → ${newFilename}`);
			}
		}

		if (trockenLauf) {
			console.log('\nTrockenlauf abgeschlossen. Keine Dateien wurden geschrieben.');
		} else {
			console.log(`\n${quellLektionen.length} Lektion(en) erfolgreich kopiert.`);
		}
		return;
	}

	// ── Modus: einzelne Lektion ──
	if (!values.quelle) {
		console.error('Fehler: --quelle oder --woche ist erforderlich.');
		console.log('\n' + HELP);
		process.exit(1);
	}

	const quelldatei = path.basename(values.quelle); // Nur Dateiname, kein Pfad
	const sourceFile = path.join(lektionenDir, quelldatei);

	// Quelldatei lesen
	let sourceContent;
	try {
		sourceContent = await fs.readFile(sourceFile, 'utf8');
	} catch {
		console.error(`Fehler: Quelldatei nicht gefunden: ${sourceFile}`);
		process.exit(1);
	}

	const sourceData = parseYAML(sourceContent);
	const sourceMeta = parseLektionFilename(quelldatei);

	if (!sourceMeta) {
		console.error(`Fehler: Dateiname entspricht nicht dem erwarteten Format: ${quelldatei}`);
		console.error('Erwartet: yyyymmdd-weekNN-wochentag-fach-klasse-lektionszahl.yaml');
		process.exit(1);
	}

	// Zieldatum berechnen
	let zielDatum = values['ziel-datum'] ?? null;
	const zielKlasse = values['ziel-klasse'] ?? null;

	if (values['naechste-woche']) {
		zielDatum = addDays(sourceMeta.datum, 7);
	}

	if (!zielDatum && !zielKlasse) {
		console.error('Fehler: Mindestens eine Option ist erforderlich: --naechste-woche, --ziel-datum oder --ziel-klasse');
		process.exit(1);
	}

	if (zielDatum && !/^\d{4}-\d{2}-\d{2}$/.test(zielDatum)) {
		console.error('Fehler: --ziel-datum muss im Format YYYY-MM-DD sein.');
		process.exit(1);
	}

	const kopie = kopiereMeta(sourceData, { zielDatum, zielKlasse });

	const newFilename = buildLektionFilename({
		datum: kopie.datum,
		woche: kopie.woche,
		wochentag: kopie.wochentag,
		fach: kopie.fach,
		klasse: kopie.klasse,
		lektionszahl: kopie.lektionszahl
	});

	const zielFile = path.join(lektionenDir, newFilename);

	console.log(`Quelle:  ${quelldatei}`);
	console.log(`Ziel:    ${newFilename}`);
	if (zielDatum)   console.log(`Datum:   ${sourceMeta.datum} → ${kopie.datum}`);
	if (zielKlasse)  console.log(`Klasse:  ${sourceMeta.klasse} → ${kopie.klasse}`);

	if (trockenLauf) {
		console.log('\nTrockenlauf – keine Datei geschrieben.');
		return;
	}

	// Prüfen ob Zieldatei bereits existiert
	try {
		await fs.access(zielFile);
		console.warn('\nWARNUNG: Zieldatei existiert bereits und wird überschrieben.');
	} catch { /* nicht vorhanden, gut */ }

	await fs.writeFile(zielFile, stringifyYAML(kopie, { lineWidth: 0 }), 'utf8');
	console.log('\nErfolgreich kopiert.');
}

main().catch((err) => {
	console.error('Unerwarteter Fehler:', err.message);
	process.exit(1);
});
