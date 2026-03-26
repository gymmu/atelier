const { ipcMain } = require('electron');

function registerHandlers(fileManager, windowManager) {
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

	// Multi-Window
	ipcMain.handle('window:open-display', async () => {
		windowManager.openDisplayWindow();
		return true;
	});

	ipcMain.handle('window:close-display', async () => {
		windowManager.closeDisplayWindow();
		return true;
	});
}

module.exports = { registerHandlers };
