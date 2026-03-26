// Storage Utility - Now uses File-based storage via Electron API
// Maintains backward compatibility with localStorage for web fallback

import { sessionsAPI } from '../api/sessions.js';
import { timersAPI } from '../api/timers.js';

const STORAGE_KEYS = {
	SCHEDULES: 'atelier_schedules',
	ACTIVE_SESSION: 'atelier_active_session',
	STUDENT_TIMERS: 'atelier_student_timers',
	CURRENT_SCHEDULE_ID: 'atelier_current_schedule_id'
};

// Helper to check if we're in Electron
function isElectron() {
	return typeof window !== 'undefined' && window.electronAPI;
}

/**
 * Speichert Daten im localStorage (fallback) oder via Electron API
 */
export async function saveToStorage(key, data) {
	if (typeof window === 'undefined') return;
	
	// Electron API (preferred)
	if (isElectron()) {
		try {
			if (key === STORAGE_KEYS.ACTIVE_SESSION) {
				await sessionsAPI.save(data);
			} else if (key === STORAGE_KEYS.STUDENT_TIMERS) {
				await timersAPI.save(data);
			}
			// For other keys, still use localStorage as fallback
			else {
				localStorage.setItem(key, JSON.stringify(data));
			}
		} catch (error) {
			console.error('Error saving to Electron storage:', error);
		}
	}
	// Fallback to localStorage
	else {
		try {
			localStorage.setItem(key, JSON.stringify(data));
		} catch (error) {
			console.error('Error saving to localStorage:', error);
		}
	}
}

/**
 * Lädt Daten aus dem localStorage (fallback) oder via Electron API
 */
export async function loadFromStorage(key, defaultValue = null) {
	if (typeof window === 'undefined') return defaultValue;
	
	// Electron API (preferred)
	if (isElectron()) {
		try {
			if (key === STORAGE_KEYS.ACTIVE_SESSION) {
				const data = await sessionsAPI.get();
				return data || defaultValue;
			} else if (key === STORAGE_KEYS.STUDENT_TIMERS) {
				const data = await timersAPI.get();
				return data || defaultValue;
			}
			// For other keys, still use localStorage as fallback
			else {
				const item = localStorage.getItem(key);
				return item ? JSON.parse(item) : defaultValue;
			}
		} catch (error) {
			console.error('Error loading from Electron storage:', error);
			return defaultValue;
		}
	}
	// Fallback to localStorage
	else {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : defaultValue;
		} catch (error) {
			console.error('Error loading from localStorage:', error);
			return defaultValue;
		}
	}
}

/**
 * Entfernt einen Eintrag aus dem localStorage
 */
export async function removeFromStorage(key) {
	if (typeof window === 'undefined') return;
	
	if (isElectron()) {
		try {
			if (key === STORAGE_KEYS.ACTIVE_SESSION) {
				await sessionsAPI.clear();
			} else {
				localStorage.removeItem(key);
			}
		} catch (error) {
			console.error('Error removing from Electron storage:', error);
		}
	} else {
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.error('Error removing from localStorage:', error);
		}
	}
}

/**
 * Löscht alle Atelier-Daten aus dem localStorage
 */
export async function clearAllStorage() {
	if (typeof window === 'undefined') return;
	
	for (const key of Object.values(STORAGE_KEYS)) {
		await removeFromStorage(key);
	}
}

// Export der Storage Keys
export { STORAGE_KEYS };
