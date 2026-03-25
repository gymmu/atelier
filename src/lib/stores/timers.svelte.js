import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '$lib/utils/storage.js';
import { generateId, getRemainingTime, playSound } from '$lib/utils/timer.js';

/**
 * Student Timers Store - Verwaltet individuelle Schüler-Timer
 * Verwendet Svelte 5 Runes für Reaktivität
 */

// State
let timers = $state(loadFromStorage(STORAGE_KEYS.STUDENT_TIMERS, []));

// Timer Interval für Updates
let timerInterval = null;

/**
 * Store-Objekt mit allen Methoden und State
 */
export const timersStore = {
	// Getter
	get timers() {
		return timers;
	},

	get activeTimers() {
		return timers.filter((t) => this.getRemainingTime(t.id) > 0);
	},

	get completedTimers() {
		return timers.filter((t) => this.getRemainingTime(t.id) <= 0);
	},

	/**
	 * Fügt einen neuen Timer hinzu
	 */
	addTimer(studentName, task, duration) {
		const newTimer = {
			id: generateId(),
			studentName,
			task,
			duration, // in Minuten
			startTime: Date.now(),
			isPaused: false,
			pausedAt: null,
			completed: false,
			notified: false
		};

		timers = [...timers, newTimer];
		this.saveTimers();
		return newTimer;
	},

	/**
	 * Aktualisiert einen Timer
	 */
	updateTimer(id, updates) {
		timers = timers.map((timer) => (timer.id === id ? { ...timer, ...updates } : timer));
		this.saveTimers();
	},

	/**
	 * Löscht einen Timer
	 */
	deleteTimer(id) {
		timers = timers.filter((t) => t.id !== id);
		this.saveTimers();
	},

	/**
	 * Pausiert einen Timer
	 */
	pauseTimer(id) {
		const timer = timers.find((t) => t.id === id);
		if (!timer || timer.isPaused) return;

		this.updateTimer(id, {
			isPaused: true,
			pausedAt: Date.now()
		});
	},

	/**
	 * Setzt einen pausierten Timer fort
	 */
	resumeTimer(id) {
		const timer = timers.find((t) => t.id === id);
		if (!timer || !timer.isPaused) return;

		const pauseDuration = Date.now() - timer.pausedAt;

		this.updateTimer(id, {
			isPaused: false,
			pausedAt: null,
			startTime: timer.startTime + pauseDuration
		});
	},

	/**
	 * Setzt einen Timer zurück
	 */
	resetTimer(id) {
		const timer = timers.find((t) => t.id === id);
		if (!timer) return;

		this.updateTimer(id, {
			startTime: Date.now(),
			isPaused: false,
			pausedAt: null,
			completed: false,
			notified: false
		});
	},

	/**
	 * Berechnet die verbleibende Zeit eines Timers
	 */
	getRemainingTime(id) {
		const timer = timers.find((t) => t.id === id);
		if (!timer) return 0;

		return getRemainingTime(timer.startTime, timer.duration, timer.isPaused, timer.pausedAt);
	},

	/**
	 * Startet den Interval für Timer-Updates und Benachrichtigungen
	 */
	startInterval() {
		this.stopInterval(); // Clear existing interval

		timerInterval = setInterval(() => {
			timers.forEach((timer) => {
				const remaining = this.getRemainingTime(timer.id);

				// Timer abgelaufen
				if (remaining <= 0 && !timer.completed) {
					this.updateTimer(timer.id, { completed: true });

					// Benachrichtigung nur einmal abspielen
					if (!timer.notified) {
						playSound('complete');
						this.updateTimer(timer.id, { notified: true });
					}
				}
			});
		}, 1000);
	},

	/**
	 * Stoppt den Timer-Interval
	 */
	stopInterval() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	},

	/**
	 * Löscht alle abgeschlossenen Timer
	 */
	clearCompletedTimers() {
		timers = timers.filter((t) => this.getRemainingTime(t.id) > 0);
		this.saveTimers();
	},

	/**
	 * Löscht alle Timer
	 */
	clearAllTimers() {
		timers = [];
		this.saveTimers();
	},

	/**
	 * Speichert Timer im localStorage
	 */
	saveTimers() {
		saveToStorage(STORAGE_KEYS.STUDENT_TIMERS, timers);
	}
};
