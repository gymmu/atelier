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

	// Multi-Window
	openDisplayWindow: () => ipcRenderer.invoke('window:open-display'),
	closeDisplayWindow: () => ipcRenderer.invoke('window:close-display'),

	// Listeners for Window-to-Window Communication
	onSessionUpdate: (callback) => ipcRenderer.on('session:update', (event, data) => callback(data)),
	onTimersUpdate: (callback) => ipcRenderer.on('timers:update', (event, data) => callback(data))
});
