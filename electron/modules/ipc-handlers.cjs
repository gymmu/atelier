const { ipcMain, dialog } = require('electron');

function registerHandlers(fileManager, windowManager, settingsManager) {
	// Classes
	ipcMain.handle('classes:list', async () => {
		return await fileManager.readJSON('classes/classes.json', []);
	});

	ipcMain.handle('classes:get', async (event, classId) => {
		return await fileManager.readJSON(`classes/${classId}/class.json`, null);
	});

	ipcMain.handle('classes:save', async (event, data) => {
		const classId = data.id;
		await fileManager.writeJSON(`classes/${classId}/class.json`, data);

		// Update classes.json
		const classes = await fileManager.readJSON('classes/classes.json', []);
		const index = classes.findIndex((c) => c.id === classId);
		if (index >= 0) {
			classes[index] = data;
		} else {
			classes.push(data);
		}
		await fileManager.writeJSON('classes/classes.json', classes);
		return data;
	});

	ipcMain.handle('classes:delete', async (event, classId) => {
		// Delete class directory
		await fileManager.deleteDirectory(`classes/${classId}`);

		// Update classes.json
		const classes = await fileManager.readJSON('classes/classes.json', []);
		const filtered = classes.filter((c) => c.id !== classId);
		await fileManager.writeJSON('classes/classes.json', filtered);
		return true;
	});

	// Students
	ipcMain.handle('students:get', async (event, classId) => {
		return await fileManager.readCSV(`classes/${classId}/students.csv`);
	});

	ipcMain.handle('students:save', async (event, classId, data) => {
		await fileManager.writeCSV(`classes/${classId}/students.csv`, data);
		return data;
	});

	// Schedules
	ipcMain.handle('schedules:list', async (event, classId) => {
		const files = await fileManager.listFiles(`classes/${classId}/schedules`);
		return files.filter((f) => f.endsWith('.md'));
	});

	ipcMain.handle('schedules:get', async (event, classId, scheduleId) => {
		const markdown = await fileManager.readMarkdown(
			`classes/${classId}/schedules/${scheduleId}.md`
		);
		return markdown;
	});

	ipcMain.handle('schedules:save', async (event, classId, scheduleId, content, meta) => {
		await fileManager.writeMarkdown(
			`classes/${classId}/schedules/${scheduleId}.md`,
			content,
			meta
		);
		return { content, meta };
	});

	ipcMain.handle('schedules:delete', async (event, classId, scheduleId) => {
		await fileManager.deleteFile(`classes/${classId}/schedules/${scheduleId}.md`);
		return true;
	});

	// Notes
	ipcMain.handle('notes:get', async (event, classId) => {
		const result = await fileManager.readMarkdown(`classes/${classId}/notes.md`);
		return result.content;
	});

	ipcMain.handle('notes:save', async (event, classId, content) => {
		await fileManager.writeMarkdown(`classes/${classId}/notes.md`, content);
		return content;
	});

	// Sessions
	ipcMain.handle('session:get', async () => {
		return await fileManager.readJSON('sessions/active-session.json', null);
	});

	ipcMain.handle('session:save', async (event, data) => {
		await fileManager.writeJSON('sessions/active-session.json', data);
		// Broadcast to all windows
		windowManager.broadcastToAll('session:update', data);
		return data;
	});

	ipcMain.handle('session:clear', async () => {
		await fileManager.deleteFile('sessions/active-session.json');
		windowManager.broadcastToAll('session:update', null);
		return true;
	});

	// Timers
	ipcMain.handle('timers:get', async () => {
		return await fileManager.readJSON('timers/student-timers.json', []);
	});

	ipcMain.handle('timers:save', async (event, data) => {
		await fileManager.writeJSON('timers/student-timers.json', data);
		windowManager.broadcastToAll('timers:update', data);
		return data;
	});

	// Plans
	ipcMain.handle('plans:list', async () => {
		return await fileManager.readJSON('plans/plans.json', []);
	});

	ipcMain.handle('plans:get', async (event, planId) => {
		return await fileManager.readJSON(`plans/${planId}.json`, null);
	});

	ipcMain.handle('plans:getMarkdown', async (event, planId) => {
		return await fileManager.readMarkdown(`plans/${planId}.md`);
	});

	ipcMain.handle('plans:save', async (event, data) => {
		const planId = data.id;
		
		// Save JSON version
		await fileManager.writeJSON(`plans/${planId}.json`, data);

		// Update plans.json index
		const plans = await fileManager.readJSON('plans/plans.json', []);
		const index = plans.findIndex((p) => p.id === planId);
		const planMeta = {
			id: data.id,
			name: data.name,
			classId: data.classId || null,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt
		};
		
		if (index >= 0) {
			plans[index] = planMeta;
		} else {
			plans.push(planMeta);
		}
		await fileManager.writeJSON('plans/plans.json', plans);
		
		// Return a plain serializable object instead of the original data
		return { success: true, id: planId };
	});

	ipcMain.handle('plans:saveMarkdown', async (event, planId, content, frontmatter) => {
		await fileManager.writeMarkdown(`plans/${planId}.md`, content, frontmatter);
		// Return a simple success response instead of potentially problematic objects
		return { success: true, planId };
	});

	ipcMain.handle('plans:delete', async (event, planId) => {
		// Delete both JSON and Markdown files
		await fileManager.deleteFile(`plans/${planId}.json`);
		await fileManager.deleteFile(`plans/${planId}.md`);

		// Update plans.json index
		const plans = await fileManager.readJSON('plans/plans.json', []);
		const filtered = plans.filter((p) => p.id !== planId);
		await fileManager.writeJSON('plans/plans.json', filtered);
		
		return true;
	});

	ipcMain.handle('plans:migrate', async (event, localStoragePlans) => {
		// Migration from localStorage to file system
		if (!localStoragePlans || localStoragePlans.length === 0) {
			return { success: true, migrated: 0 };
		}

		let migrated = 0;
		const plans = await fileManager.readJSON('plans/plans.json', []);

		for (const plan of localStoragePlans) {
			// Check if already exists
			if (plans.find((p) => p.id === plan.id)) {
				continue; // Skip duplicates
			}

			// Save plan
			await fileManager.writeJSON(`plans/${plan.id}.json`, plan);
			
			// Add to index
			plans.push({
				id: plan.id,
				name: plan.name,
				classId: plan.classId || null,
				createdAt: plan.createdAt,
				updatedAt: plan.updatedAt
			});
			
			migrated++;
		}

		// Save updated index
		await fileManager.writeJSON('plans/plans.json', plans);

		return { success: true, migrated };
	});

	// Lektionen
	// Parses filename like: 20260422-week17-mittwoch-mathematik-5a-1.yaml
	function parseLektionFilename(filename) {
		const base = filename.replace(/\.yaml$/, '');
		const parts = base.split('-');
		if (parts.length < 6) return null;

		const datumRaw = parts[0]; // yyyymmdd
		const woche = parts[1]; // week17
		const wochentag = parts[2];
		// fach and klasse can contain hyphens, lektionszahl is the last segment
		const lektionszahl = parseInt(parts[parts.length - 1], 10);
		const klasse = parts[parts.length - 2];
		const fach = parts.slice(3, parts.length - 2).join('-');

		const datum = `${datumRaw.slice(0, 4)}-${datumRaw.slice(4, 6)}-${datumRaw.slice(6, 8)}`;
		const wocheNr = parseInt(woche.replace('week', ''), 10);

		return { filename, datum, datumRaw, woche: wocheNr, wochentag, fach, klasse, lektionszahl };
	}

	function buildLektionFilename(meta) {
		const datumRaw = meta.datum.replace(/-/g, '');
		const woche = `week${String(meta.woche).padStart(2, '0')}`;
		const fach = meta.fach.toLowerCase().replace(/\s+/g, '-').replace(/[äöü]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c]));
		const klasse = meta.klasse.toLowerCase().replace(/\s+/g, '');
		const wochentag = meta.wochentag.toLowerCase();
		return `${datumRaw}-${woche}-${wochentag}-${fach}-${klasse}-${meta.lektionszahl}.yaml`;
	}

	ipcMain.handle('lektionen:list', async () => {
		const files = await fileManager.listLektionen();
		const result = [];
		for (const filename of files) {
			const meta = parseLektionFilename(filename);
			if (meta) result.push(meta);
		}
		return result;
	});

	ipcMain.handle('lektionen:get', async (event, filename) => {
		const data = await fileManager.readYAML(`lektionen/${filename}`);
		if (!data) return null;
		return { ...data, _filename: filename };
	});

	ipcMain.handle('lektionen:save', async (event, data) => {
		const { _filename: oldFilename, ...lektionData } = data;

		// Build new filename from metadata in the data
		const newFilename = buildLektionFilename({
			datum: lektionData.datum,
			woche: lektionData.woche,
			wochentag: lektionData.wochentag,
			fach: lektionData.fach,
			klasse: lektionData.klasse,
			lektionszahl: lektionData.lektionszahl
		});

		// If filename changed, delete old file
		if (oldFilename && oldFilename !== newFilename) {
			await fileManager.deleteFile(`lektionen/${oldFilename}`);
		}

		await fileManager.writeYAML(`lektionen/${newFilename}`, lektionData);
		return { success: true, filename: newFilename };
	});

	ipcMain.handle('lektionen:delete', async (event, filename) => {
		await fileManager.deleteFile(`lektionen/${filename}`);
		return { success: true };
	});

	ipcMain.handle('lektionen:copy', async (event, filename, opts) => {
		// opts: { zielDatum, zielKlasse }
		const source = await fileManager.readYAML(`lektionen/${filename}`);
		if (!source) return { success: false, error: 'Quelldatei nicht gefunden' };

		const kopie = { ...source };

		if (opts.zielDatum) {
			const d = new Date(opts.zielDatum);
			kopie.datum = opts.zielDatum;
			// Recalculate week number
			const startOfYear = new Date(d.getFullYear(), 0, 1);
			const dayOfYear = Math.floor((d - startOfYear) / 86400000);
			kopie.woche = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
			// Recalculate weekday
			const tage = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
			kopie.wochentag = tage[d.getDay()];
		}

		if (opts.zielKlasse) {
			kopie.klasse = opts.zielKlasse;
		}

		const newFilename = buildLektionFilename({
			datum: kopie.datum,
			woche: kopie.woche,
			wochentag: kopie.wochentag,
			fach: kopie.fach,
			klasse: kopie.klasse,
			lektionszahl: kopie.lektionszahl
		});

		await fileManager.writeYAML(`lektionen/${newFilename}`, kopie);
		return { success: true, filename: newFilename };
	});

	ipcMain.handle('lektionen:copyWeek', async (event, quellWoche, zielDatumErsterTag, zielKlasse) => {
		// quellWoche: KW-Nummer (number)
		// zielDatumErsterTag: ISO-Datum des Montags der Zielwoche
		// zielKlasse: optional, überschreibt Klasse
		const allFiles = await fileManager.listLektionen();
		const quellLektionen = allFiles
			.map(parseLektionFilename)
			.filter((m) => m && m.woche === quellWoche);

		if (quellLektionen.length === 0) {
			return { success: false, error: `Keine Lektionen in KW ${quellWoche} gefunden` };
		}

		const zielMontag = new Date(zielDatumErsterTag);
		const tageMap = { montag: 0, dienstag: 1, mittwoch: 2, donnerstag: 3, freitag: 4, samstag: 5, sonntag: 6 };
		const tage = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
		const created = [];

		for (const meta of quellLektionen) {
			const source = await fileManager.readYAML(`lektionen/${meta.filename}`);
			if (!source) continue;

			const kopie = { ...source };
			const offset = tageMap[meta.wochentag] ?? 0;
			const zielTag = new Date(zielMontag);
			zielTag.setDate(zielMontag.getDate() + offset);

			kopie.datum = zielTag.toISOString().slice(0, 10);
			kopie.wochentag = tage[zielTag.getDay()];

			// Recalculate KW
			const startOfYear = new Date(zielTag.getFullYear(), 0, 1);
			const dayOfYear = Math.floor((zielTag - startOfYear) / 86400000);
			kopie.woche = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

			if (zielKlasse) kopie.klasse = zielKlasse;

			const newFilename = buildLektionFilename({
				datum: kopie.datum,
				woche: kopie.woche,
				wochentag: kopie.wochentag,
				fach: kopie.fach,
				klasse: kopie.klasse,
				lektionszahl: kopie.lektionszahl
			});

			await fileManager.writeYAML(`lektionen/${newFilename}`, kopie);
			created.push(newFilename);
		}

		return { success: true, created };
	});

	// Multi-Window
	ipcMain.handle('window:open-display', async () => {
		windowManager.openDisplayWindow();
		return true;
	});

	ipcMain.handle('window:close-display', async () => {
		windowManager.closeDisplayWindow();
		return true;
	});

	// File System Explorer
	ipcMain.handle('fs:readDirectory', async (event, dirPath) => {
		const fs = require('fs').promises;
		const path = require('path');
		
		const fullPath = dirPath ? path.join(fileManager.basePath, dirPath) : fileManager.basePath;
		
		try {
			const entries = await fs.readdir(fullPath, { withFileTypes: true });
			
			const items = await Promise.all(
				entries.map(async (entry) => {
					const itemPath = path.join(fullPath, entry.name);
					const stats = await fs.stat(itemPath);
					const relativePath = dirPath ? path.join(dirPath, entry.name) : entry.name;
					
					return {
						name: entry.name,
						path: relativePath,
						type: entry.isDirectory() ? 'directory' : 'file',
						size: stats.size,
						modified: stats.mtime.toISOString()
					};
				})
			);
			
			// Sort: directories first, then alphabetically
			return items.sort((a, b) => {
				if (a.type !== b.type) {
					return a.type === 'directory' ? -1 : 1;
				}
				return a.name.localeCompare(b.name);
			});
		} catch (err) {
			console.error('Error reading directory:', err);
			return [];
		}
	});

	ipcMain.handle('fs:readFile', async (event, filePath) => {
		const fs = require('fs').promises;
		const path = require('path');
		
		const fullPath = path.join(fileManager.basePath, filePath);
		
		try {
			const content = await fs.readFile(fullPath, 'utf8');
			return { success: true, content };
		} catch (err) {
			return { success: false, error: err.message };
		}
	});

	ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
		const fs = require('fs').promises;
		const path = require('path');
		
		const fullPath = path.join(fileManager.basePath, filePath);
		
		try {
			await fs.mkdir(path.dirname(fullPath), { recursive: true });
			await fs.writeFile(fullPath, content, 'utf8');
			return { success: true };
		} catch (err) {
			return { success: false, error: err.message };
		}
	});

	ipcMain.handle('fs:deleteFile', async (event, filePath) => {
		await fileManager.deleteFile(filePath);
		return { success: true };
	});

	ipcMain.handle('fs:createDirectory', async (event, dirPath) => {
		const fs = require('fs').promises;
		const path = require('path');
		
		const fullPath = path.join(fileManager.basePath, dirPath);
		
		try {
			await fs.mkdir(fullPath, { recursive: true });
			return { success: true };
		} catch (err) {
			return { success: false, error: err.message };
		}
	});

	// Settings
	ipcMain.handle('settings:get', async (event, key) => {
		if (key) {
			return settingsManager.get(key);
		}
		return settingsManager.settings;
	});

	ipcMain.handle('settings:set', async (event, key, value) => {
		await settingsManager.set(key, value);
		return true;
	});

	ipcMain.handle('settings:getWorkingDirectory', async () => {
		return settingsManager.getWorkingDirectory();
	});

	ipcMain.handle('settings:getSettingsLocation', async () => {
		return settingsManager.getSettingsLocation();
	});

	ipcMain.handle('settings:getRecentDirectories', async () => {
		return settingsManager.getRecentDirectories();
	});

	ipcMain.handle('settings:chooseWorkingDirectory', async () => {
		const result = await dialog.showOpenDialog({
			title: 'Wähle ein Arbeitsverzeichnis',
			properties: ['openDirectory', 'createDirectory'],
			buttonLabel: 'Auswählen',
			defaultPath: settingsManager.getWorkingDirectory()
		});

		if (!result.canceled && result.filePaths.length > 0) {
			const newPath = result.filePaths[0];
			await settingsManager.setWorkingDirectory(newPath);

			// Update file manager base path
			fileManager.basePath = newPath;
			await fileManager.ensureDirectories();

			return newPath;
		}

		return null;
	});
}

module.exports = { registerHandlers };
