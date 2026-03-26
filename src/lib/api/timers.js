// Timers API - Interface to Electron IPC
export const timersAPI = {
	async get() {
		if (typeof window === 'undefined' || !window.electronAPI) return [];
		return await window.electronAPI.getTimers();
	},

	async save(data) {
		if (typeof window === 'undefined' || !window.electronAPI) return data;
		return await window.electronAPI.saveTimers(data);
	},

	onUpdate(callback) {
		if (typeof window === 'undefined' || !window.electronAPI) return;
		window.electronAPI.onTimersUpdate(callback);
	}
};
