// Students API - Interface to Electron IPC
export const studentsAPI = {
	async get(classId) {
		if (typeof window === 'undefined' || !window.electronAPI) return [];
		return await window.electronAPI.getStudents(classId);
	},

	async save(classId, data) {
		if (typeof window === 'undefined' || !window.electronAPI) return data;
		return await window.electronAPI.saveStudents(classId, data);
	}
};
