// Schedules API - Interface to Electron IPC
export const schedulesAPI = {
	async list(classId) {
		if (typeof window === 'undefined' || !window.electronAPI) return [];
		return await window.electronAPI.getSchedules(classId);
	},

	async get(classId, scheduleId) {
		if (typeof window === 'undefined' || !window.electronAPI)
			return { content: '', data: {} };
		return await window.electronAPI.getSchedule(classId, scheduleId);
	},

	async save(classId, scheduleId, content, meta) {
		if (typeof window === 'undefined' || !window.electronAPI) return { content, meta };
		return await window.electronAPI.saveSchedule(classId, scheduleId, content, meta);
	},

	async delete(classId, scheduleId) {
		if (typeof window === 'undefined' || !window.electronAPI) return;
		return await window.electronAPI.deleteSchedule(classId, scheduleId);
	}
};
