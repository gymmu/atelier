// Classes API - Interface to Electron IPC
export const classesAPI = {
	async getAll() {
		if (typeof window === 'undefined' || !window.electronAPI) return [];
		return await window.electronAPI.getClasses();
	},

	async get(id) {
		if (typeof window === 'undefined' || !window.electronAPI) return null;
		return await window.electronAPI.getClass(id);
	},

	async save(data) {
		if (typeof window === 'undefined' || !window.electronAPI) return data;
		return await window.electronAPI.saveClass(data);
	},

	async delete(id) {
		if (typeof window === 'undefined' || !window.electronAPI) return;
		return await window.electronAPI.deleteClass(id);
	}
};
