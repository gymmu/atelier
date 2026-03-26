// Sessions API - Interface to Electron IPC
export const sessionsAPI = {
	async get() {
		if (typeof window === 'undefined' || !window.electronAPI) return null;
		return await window.electronAPI.getActiveSession();
	},

	async save(data) {
		if (typeof window === 'undefined' || !window.electronAPI) return data;
		return await window.electronAPI.saveSession(data);
	},

	async clear() {
		if (typeof window === 'undefined' || !window.electronAPI) return;
		return await window.electronAPI.clearSession();
	},

	onUpdate(callback) {
		if (typeof window === 'undefined' || !window.electronAPI) return;
		window.electronAPI.onSessionUpdate(callback);
	}
};
