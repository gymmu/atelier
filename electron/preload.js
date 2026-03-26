const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	// Classes
	getClasses: () => ipcRenderer.invoke('classes:list'),
	getClass: (id) => ipcRenderer.invoke('classes:get', id),
	saveClass: (data) => ipcRenderer.invoke('classes:save', data),
	deleteClass: (id) => ipcRenderer.invoke('classes:delete', id),

	// Students
	getStudents: (classId) => ipcRenderer.invoke('students:get', classId),
	saveStudents: (classId, data) => ipcRenderer.invoke('students:save', classId, data),

	// Schedules
	getSchedules: (classId) => ipcRenderer.invoke('schedules:list', classId),
	getSchedule: (classId, scheduleId) => ipcRenderer.invoke('schedules:get', classId, scheduleId),
	saveSchedule: (classId, scheduleId, content, meta) =>
		ipcRenderer.invoke('schedules:save', classId, scheduleId, content, meta),
	deleteSchedule: (classId, scheduleId) =>
		ipcRenderer.invoke('schedules:delete', classId, scheduleId),

	// Notes
	getNotes: (classId) => ipcRenderer.invoke('notes:get', classId),
	saveNotes: (classId, content) => ipcRenderer.invoke('notes:save', classId, content),

	// Sessions
	getActiveSession: () => ipcRenderer.invoke('session:get'),
	saveSession: (data) => ipcRenderer.invoke('session:save', data),
	clearSession: () => ipcRenderer.invoke('session:clear'),

	// Timers
	getTimers: () => ipcRenderer.invoke('timers:get'),
	saveTimers: (data) => ipcRenderer.invoke('timers:save', data),

	// File System Explorer
	readDirectory: (dirPath) => ipcRenderer.invoke('fs:readDirectory', dirPath),
	readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
	writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
	deleteFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),
	createDirectory: (dirPath) => ipcRenderer.invoke('fs:createDirectory', dirPath),

	// Plans
	getPlans: () => ipcRenderer.invoke('plans:list'),
	getPlan: (planId) => ipcRenderer.invoke('plans:get', planId),
	getPlanMarkdown: (planId) => ipcRenderer.invoke('plans:getMarkdown', planId),
	savePlan: (data) => ipcRenderer.invoke('plans:save', data),
	savePlanMarkdown: (planId, content, frontmatter) =>
		ipcRenderer.invoke('plans:saveMarkdown', planId, content, frontmatter),
	deletePlan: (planId) => ipcRenderer.invoke('plans:delete', planId),
	migratePlans: (localStoragePlans) => ipcRenderer.invoke('plans:migrate', localStoragePlans),

	// Multi-Window
	openDisplayWindow: () => ipcRenderer.invoke('window:open-display'),
	closeDisplayWindow: () => ipcRenderer.invoke('window:close-display'),

	// Settings
	getSetting: (key) => ipcRenderer.invoke('settings:get', key),
	getSettings: () => ipcRenderer.invoke('settings:get'),
	setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
	getWorkingDirectory: () => ipcRenderer.invoke('settings:getWorkingDirectory'),
	getSettingsLocation: () => ipcRenderer.invoke('settings:getSettingsLocation'),
	getRecentDirectories: () => ipcRenderer.invoke('settings:getRecentDirectories'),
	chooseWorkingDirectory: () => ipcRenderer.invoke('settings:chooseWorkingDirectory'),

	// Listeners for Window-to-Window Communication
	onSessionUpdate: (callback) => ipcRenderer.on('session:update', (event, data) => callback(data)),
	onTimersUpdate: (callback) => ipcRenderer.on('timers:update', (event, data) => callback(data))
});
