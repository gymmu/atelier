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
		
		return data;
	});

	ipcMain.handle('plans:saveMarkdown', async (event, planId, content, frontmatter) => {
		await fileManager.writeMarkdown(`plans/${planId}.md`, content, frontmatter);
		return { content, frontmatter };
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

			// Update file manager base path (including .atelier subdirectory)
			const path = require('path');
			fileManager.basePath = path.join(newPath, '.atelier');
			await fileManager.ensureDirectories();

			return newPath;
		}

		return null;
	});
}

module.exports = { registerHandlers };
