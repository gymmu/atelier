import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '$lib/utils/storage.js';
import { generateId, getRemainingTime } from '$lib/utils/timer.js';
import { SESSION_STATUS } from '$lib/utils/constants.js';
import { plansAPI } from '$lib/api/plans.js';

/**
 * Schedule Store - Verwaltet Zeitpläne und aktive Sessions
 * Verwendet Svelte 5 Runes für Reaktivität
 */

// State - Initialize with empty/default values, load async
let schedules = $state([]);
let currentScheduleId = $state(null);
let activeSession = $state(null);
let initialized = $state(false);

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
	get initialized() {
		return initialized;
	},

	/**
	 * Initialisiert den Store - lädt Daten async
	 */
	async init() {
		if (initialized) return;
		
		try {
			// Check if we need to migrate from localStorage
			await this.migrateFromLocalStorage();
			
			// Load plans from file system (via plansAPI)
			const plansMeta = await loadFromStorage(STORAGE_KEYS.SCHEDULES, []);
			
			// Load full plan data for each
			const loadedPlans = [];
			for (const meta of plansMeta) {
				const fullPlan = await plansAPI.get(meta.id);
				if (fullPlan) {
					loadedPlans.push(fullPlan);
				}
			}
			
			const loadedScheduleId = await loadFromStorage(STORAGE_KEYS.CURRENT_SCHEDULE_ID, null);
			const loadedSession = await loadFromStorage(STORAGE_KEYS.ACTIVE_SESSION, null);
			
			schedules = loadedPlans;
			currentScheduleId = loadedScheduleId;
			activeSession = loadedSession;
			initialized = true;
			
			// Setup listeners for cross-window updates if in Electron
			if (typeof window !== 'undefined' && window.electronAPI) {
				window.electronAPI.onSessionUpdate((data) => {
					activeSession = data;
				});
			}
			
			// Restart timer if session is active
			if (activeSession && !activeSession.isPaused) {
				this.startTimer();
			}
		} catch (error) {
			console.error('Error initializing schedule store:', error);
			initialized = true; // Mark as initialized even on error
		}
	},

	/**
	 * Migriert Pläne von localStorage zu Dateien
	 */
	async migrateFromLocalStorage() {
		if (typeof window === 'undefined') return;
		
		try {
			// Check if localStorage has old schedules
			const oldSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
			if (!oldSchedules) return;
			
			const parsed = JSON.parse(oldSchedules);
			if (!Array.isArray(parsed) || parsed.length === 0) return;
			
			console.log(`Migrating ${parsed.length} plans from localStorage to files...`);
			
			// Migrate via Electron API
			if (window.electronAPI) {
				const result = await plansAPI.migrate(parsed);
				if (result.success) {
					console.log(`Successfully migrated ${result.migrated} plans`);
					// Clear old localStorage data
					localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
				}
			}
		} catch (error) {
			console.error('Error migrating plans from localStorage:', error);
		}
	},

	/**
	 * Erstellt einen neuen Zeitplan
	 */
	async createSchedule(name, phases = []) {
		const newSchedule = {
			id: generateId(),
			name,
			phases,
			startTime: '08:00', // Standard-Startzeit
			classId: null,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
		schedules = [...schedules, newSchedule];
		await this.saveSchedule(newSchedule);
		return newSchedule;
	},

	/**
	 * Aktualisiert einen bestehenden Zeitplan
	 */
	async updateSchedule(id, updates) {
		const updated = schedules.find((s) => s.id === id);
		if (!updated) return;
		
		const newData = { ...updated, ...updates, updatedAt: Date.now() };
		schedules = schedules.map((schedule) =>
			schedule.id === id ? newData : schedule
		);
		await this.saveSchedule(newData);
	},

	/**
	 * Löscht einen Zeitplan
	 */
	async deleteSchedule(id) {
		await plansAPI.delete(id);
		schedules = schedules.filter((s) => s.id !== id);
		if (currentScheduleId === id) {
			currentScheduleId = null;
			saveToStorage(STORAGE_KEYS.CURRENT_SCHEDULE_ID, null);
		}
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
	async addPhase(scheduleId, phase) {
		const schedule = schedules.find((s) => s.id === scheduleId);
		if (!schedule) return;

		const newPhase = {
			id: generateId(),
			...phase
		};

		await this.updateSchedule(scheduleId, {
			phases: [...schedule.phases, newPhase]
		});
	},

	/**
	 * Aktualisiert eine Phase
	 */
	async updatePhase(scheduleId, phaseId, updates) {
		const schedule = schedules.find((s) => s.id === scheduleId);
		if (!schedule) return;

		const updatedPhases = schedule.phases.map((phase) =>
			phase.id === phaseId ? { ...phase, ...updates } : phase
		);

		await this.updateSchedule(scheduleId, { phases: updatedPhases });
	},

	/**
	 * Löscht eine Phase
	 */
	async deletePhase(scheduleId, phaseId) {
		const schedule = schedules.find((s) => s.id === scheduleId);
		if (!schedule) return;

		const updatedPhases = schedule.phases.filter((phase) => phase.id !== phaseId);
		await this.updateSchedule(scheduleId, { phases: updatedPhases });
	},

	/**
	 * Verschiebt eine Phase
	 */
	async movePhase(scheduleId, fromIndex, toIndex) {
		const schedule = schedules.find((s) => s.id === scheduleId);
		if (!schedule) return;

		const phases = [...schedule.phases];
		const [movedPhase] = phases.splice(fromIndex, 1);
		phases.splice(toIndex, 0, movedPhase);

		await this.updateSchedule(scheduleId, { phases });
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
	 * Speichert einen einzelnen Zeitplan als Datei
	 */
	async saveSchedule(schedule) {
		await plansAPI.save(schedule);
	},

	/**
	 * Lädt Zeitpläne neu
	 */
	async loadSchedules() {
		try {
			const plansMeta = await plansAPI.getAll();
			const loadedPlans = [];
			
			for (const meta of plansMeta) {
				const fullPlan = await plansAPI.get(meta.id);
				if (fullPlan) {
					loadedPlans.push(fullPlan);
				}
			}
			
			schedules = loadedPlans;
		} catch (error) {
			console.error('Error loading schedules:', error);
		}
	},

	/**
	 * Speichert aktive Session im localStorage/File
	 */
	async saveSession() {
		await saveToStorage(STORAGE_KEYS.ACTIVE_SESSION, activeSession);
	}
};
