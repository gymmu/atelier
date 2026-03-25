import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '$lib/utils/storage.js';
import { generateId, getRemainingTime } from '$lib/utils/timer.js';
import { SESSION_STATUS } from '$lib/utils/constants.js';

/**
 * Schedule Store - Verwaltet Zeitpläne und aktive Sessions
 * Verwendet Svelte 5 Runes für Reaktivität
 */

// State
let schedules = $state(loadFromStorage(STORAGE_KEYS.SCHEDULES, []));
let currentScheduleId = $state(loadFromStorage(STORAGE_KEYS.CURRENT_SCHEDULE_ID, null));
let activeSession = $state(loadFromStorage(STORAGE_KEYS.ACTIVE_SESSION, null));

// Derived state
let currentSchedule = $derived.by(() => {
	return schedules.find((s) => s.id === currentScheduleId) || null;
});

let currentPhase = $derived.by(() => {
	if (!activeSession || !currentSchedule) return null;
	return currentSchedule.phases[activeSession.currentPhaseIndex] || null;
});

let sessionStatus = $derived.by(() => {
	if (!activeSession) return SESSION_STATUS.IDLE;
	if (activeSession.isPaused) return SESSION_STATUS.PAUSED;
	
	// Check if session is completed
	if (currentSchedule && activeSession.currentPhaseIndex >= currentSchedule.phases.length) {
		return SESSION_STATUS.COMPLETED;
	}
	
	return SESSION_STATUS.RUNNING;
});

// Periodischer Update für Timer (wird in Components initialisiert)
let timerInterval = null;

/**
 * Store-Objekt mit allen Methoden und State
 */
export const scheduleStore = {
	// Getters
	get schedules() {
		return schedules;
	},
	get currentScheduleId() {
		return currentScheduleId;
	},
	get currentSchedule() {
		return currentSchedule;
	},
	get activeSession() {
		return activeSession;
	},
	get currentPhase() {
		return currentPhase;
	},
	get sessionStatus() {
		return sessionStatus;
	},

	/**
	 * Erstellt einen neuen Zeitplan
	 */
	createSchedule(name, phases = []) {
		const newSchedule = {
			id: generateId(),
			name,
			phases,
			startTime: '08:00', // Standard-Startzeit
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
		schedules = [...schedules, newSchedule];
		this.saveSchedules();
		return newSchedule;
	},

	/**
	 * Aktualisiert einen bestehenden Zeitplan
	 */
	updateSchedule(id, updates) {
		schedules = schedules.map((schedule) =>
			schedule.id === id
				? { ...schedule, ...updates, updatedAt: Date.now() }
				: schedule
		);
		this.saveSchedules();
	},

	/**
	 * Löscht einen Zeitplan
	 */
	deleteSchedule(id) {
		schedules = schedules.filter((s) => s.id !== id);
		if (currentScheduleId === id) {
			currentScheduleId = null;
			saveToStorage(STORAGE_KEYS.CURRENT_SCHEDULE_ID, null);
		}
		this.saveSchedules();
	},

	/**
	 * Setzt den aktuellen Zeitplan
	 */
	setCurrentSchedule(id) {
		currentScheduleId = id;
		saveToStorage(STORAGE_KEYS.CURRENT_SCHEDULE_ID, id);
	},

	/**
	 * Fügt eine Phase zu einem Zeitplan hinzu
	 */
	addPhase(scheduleId, phase) {
		const schedule = schedules.find((s) => s.id === scheduleId);
		if (!schedule) return;

		const newPhase = {
			id: generateId(),
			...phase
		};

		this.updateSchedule(scheduleId, {
			phases: [...schedule.phases, newPhase]
		});
	},

	/**
	 * Aktualisiert eine Phase
	 */
	updatePhase(scheduleId, phaseId, updates) {
		const schedule = schedules.find((s) => s.id === scheduleId);
		if (!schedule) return;

		const updatedPhases = schedule.phases.map((phase) =>
			phase.id === phaseId ? { ...phase, ...updates } : phase
		);

		this.updateSchedule(scheduleId, { phases: updatedPhases });
	},

	/**
	 * Löscht eine Phase
	 */
	deletePhase(scheduleId, phaseId) {
		const schedule = schedules.find((s) => s.id === scheduleId);
		if (!schedule) return;

		const updatedPhases = schedule.phases.filter((phase) => phase.id !== phaseId);
		this.updateSchedule(scheduleId, { phases: updatedPhases });
	},

	/**
	 * Verschiebt eine Phase
	 */
	movePhase(scheduleId, fromIndex, toIndex) {
		const schedule = schedules.find((s) => s.id === scheduleId);
		if (!schedule) return;

		const phases = [...schedule.phases];
		const [movedPhase] = phases.splice(fromIndex, 1);
		phases.splice(toIndex, 0, movedPhase);

		this.updateSchedule(scheduleId, { phases });
	},

	/**
	 * Startet eine Session mit dem aktuellen Zeitplan
	 */
	startSession() {
		if (!currentSchedule || currentSchedule.phases.length === 0) {
			console.error('Kein Zeitplan ausgewählt oder keine Phasen vorhanden');
			return;
		}

		activeSession = {
			scheduleId: currentScheduleId,
			currentPhaseIndex: 0,
			startTime: Date.now(),
			phaseStartTime: Date.now(),
			isPaused: false,
			pausedAt: null
		};

		this.saveSession();
		this.startTimer();
	},

	/**
	 * Pausiert die aktuelle Session
	 */
	pauseSession() {
		if (!activeSession || activeSession.isPaused) return;

		activeSession = {
			...activeSession,
			isPaused: true,
			pausedAt: Date.now()
		};

		this.saveSession();
	},

	/**
	 * Setzt die pausierte Session fort
	 */
	resumeSession() {
		if (!activeSession || !activeSession.isPaused) return;

		const pauseDuration = Date.now() - activeSession.pausedAt;

		activeSession = {
			...activeSession,
			isPaused: false,
			pausedAt: null,
			phaseStartTime: activeSession.phaseStartTime + pauseDuration
		};

		this.saveSession();
	},

	/**
	 * Stoppt die aktuelle Session
	 */
	stopSession() {
		activeSession = null;
		this.saveSession();
		this.stopTimer();
	},

	/**
	 * Wechselt zur nächsten Phase
	 */
	nextPhase() {
		if (!activeSession || !currentSchedule) return;

		const nextIndex = activeSession.currentPhaseIndex + 1;

		if (nextIndex >= currentSchedule.phases.length) {
			// Session abgeschlossen
			this.stopSession();
			return;
		}

		activeSession = {
			...activeSession,
			currentPhaseIndex: nextIndex,
			phaseStartTime: Date.now()
		};

		this.saveSession();
	},

	/**
	 * Wechselt zur vorherigen Phase
	 */
	previousPhase() {
		if (!activeSession || activeSession.currentPhaseIndex === 0) return;

		activeSession = {
			...activeSession,
			currentPhaseIndex: activeSession.currentPhaseIndex - 1,
			phaseStartTime: Date.now()
		};

		this.saveSession();
	},

	/**
	 * Berechnet die verbleibende Zeit der aktuellen Phase
	 */
	getRemainingPhaseTime() {
		if (!activeSession || !currentPhase) return 0;

		return getRemainingTime(
			activeSession.phaseStartTime,
			currentPhase.duration,
			activeSession.isPaused,
			activeSession.pausedAt
		);
	},

	/**
	 * Startet den Timer für automatische Phasenwechsel
	 */
	startTimer() {
		this.stopTimer(); // Clear existing timer

		timerInterval = setInterval(() => {
			if (!activeSession || activeSession.isPaused) return;

			const remaining = this.getRemainingPhaseTime();

			// Automatischer Phasenwechsel wenn Zeit abgelaufen
			if (remaining <= 0) {
				this.nextPhase();
			}
		}, 1000);
	},

	/**
	 * Stoppt den Timer
	 */
	stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	},

	/**
	 * Speichert Zeitpläne im localStorage
	 */
	saveSchedules() {
		saveToStorage(STORAGE_KEYS.SCHEDULES, schedules);
	},

	/**
	 * Speichert aktive Session im localStorage
	 */
	saveSession() {
		saveToStorage(STORAGE_KEYS.ACTIVE_SESSION, activeSession);
	}
};
