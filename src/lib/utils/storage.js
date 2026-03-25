// localStorage Utility-Funktionen

const STORAGE_KEYS = {
	SCHEDULES: 'atelier_schedules',
	ACTIVE_SESSION: 'atelier_active_session',
	STUDENT_TIMERS: 'atelier_student_timers',
	CURRENT_SCHEDULE_ID: 'atelier_current_schedule_id'
};

/**
 * Speichert Daten im localStorage
 */
export function saveToStorage(key, data) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(key, JSON.stringify(data));
	} catch (error) {
		console.error('Error saving to localStorage:', error);
	}
}

/**
 * Lädt Daten aus dem localStorage
 */
export function loadFromStorage(key, defaultValue = null) {
	if (typeof window === 'undefined') return defaultValue;
	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : defaultValue;
	} catch (error) {
		console.error('Error loading from localStorage:', error);
		return defaultValue;
	}
}

/**
 * Entfernt einen Eintrag aus dem localStorage
 */
export function removeFromStorage(key) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(key);
	} catch (error) {
		console.error('Error removing from localStorage:', error);
	}
}

/**
 * Löscht alle Atelier-Daten aus dem localStorage
 */
export function clearAllStorage() {
	if (typeof window === 'undefined') return;
	Object.values(STORAGE_KEYS).forEach((key) => {
		removeFromStorage(key);
	});
}

// Export der Storage Keys
export { STORAGE_KEYS };
