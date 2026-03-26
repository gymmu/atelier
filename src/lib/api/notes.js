// Notes API - Interface to Electron IPC
export const notesAPI = {
	async get(classId) {
		if (typeof window === 'undefined' || !window.electronAPI) return '';
		return await window.electronAPI.getNotes(classId);
	},

	async save(classId, content) {
		if (typeof window === 'undefined' || !window.electronAPI) return content;
		return await window.electronAPI.saveNotes(classId, content);
	}
};
