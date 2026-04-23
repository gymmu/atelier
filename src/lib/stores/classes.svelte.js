import { classesAPI } from '../api/classes.js';
import { generateId } from '$lib/utils/timer.js';

/**
 * Classes Store - Verwaltet Klassen
 * Verwendet Svelte 5 Runes für Reaktivität
 */

// State
let classes = $state([]);
let currentClassId = $state(null);
let initialized = $state(false);

// Derived state
let currentClass = $derived.by(() => {
	return classes.find((c) => c.id === currentClassId) || null;
});

/**
 * Store-Objekt mit allen Methoden und State
 */
export const classesStore = {
	// Getters
	get classes() {
		return classes;
	},
	get currentClassId() {
		return currentClassId;
	},
	get currentClass() {
		return currentClass;
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
			classes = await classesAPI.getAll();
			initialized = true;
		} catch (error) {
			console.error('Error initializing classes store:', error);
			initialized = true;
		}
	},

	/**
	 * Erstellt eine neue Klasse
	 */
	async createClass(data) {
		// Generiere eine zufällige Farbe wenn keine angegeben
		const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
		
		const newClass = {
			id: generateId(),
			name: data.name || 'Neue Klasse',
			room: data.room || '',
			description: data.description || '',
			color: data.color || randomColor,
			
			// Wochenstundenplan (Array von Zeitslots)
			schedule: data.schedule || [],
			
			// Verknüpfungen
			studentIds: data.studentIds || [],
			planIds: data.planIds || [],
			
			// Archivierung
			archived: data.archived || false,
			
			// Timestamps
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		await classesAPI.save(newClass);
		classes = [...classes, newClass];
		return newClass;
	},

	/**
	 * Aktualisiert eine Klasse
	 */
	async updateClass(id, updates) {
		const classToUpdate = classes.find((c) => c.id === id);
		if (!classToUpdate) return;

		const updated = { ...classToUpdate, ...updates, updatedAt: Date.now() };
		await classesAPI.save(updated);

		classes = classes.map((c) => (c.id === id ? updated : c));
	},

	/**
	 * Löscht eine Klasse
	 */
	async deleteClass(id) {
		await classesAPI.delete(id);
		classes = classes.filter((c) => c.id !== id);

		if (currentClassId === id) {
			currentClassId = null;
		}
	},

	/**
	 * Setzt die aktuelle Klasse
	 */
	setCurrentClass(id) {
		currentClassId = id;
	},

	/**
	 * Lädt Klassen neu
	 */
	async loadClasses() {
		try {
			classes = await classesAPI.getAll();
		} catch (error) {
			console.error('Error loading classes:', error);
		}
	},

	/**
	 * Fügt einen Zeitslot zum Stundenplan hinzu
	 */
	async addScheduleSlot(classId, slot) {
		const classItem = classes.find((c) => c.id === classId);
		if (!classItem) return;

		const newSlot = {
			id: generateId(),
			weekday: slot.weekday || 'montag',
			startTime: slot.startTime || '08:00',
			endTime: slot.endTime || '09:00',
			subject: slot.subject || ''
		};

		const updatedSchedule = [...(classItem.schedule || []), newSlot];
		await this.updateClass(classId, { schedule: updatedSchedule });
		return newSlot;
	},

	/**
	 * Aktualisiert einen Zeitslot im Stundenplan
	 */
	async updateScheduleSlot(classId, slotId, updates) {
		const classItem = classes.find((c) => c.id === classId);
		if (!classItem || !classItem.schedule) return;

		const updatedSchedule = classItem.schedule.map((slot) =>
			slot.id === slotId ? { ...slot, ...updates } : slot
		);

		await this.updateClass(classId, { schedule: updatedSchedule });
	},

	/**
	 * Entfernt einen Zeitslot aus dem Stundenplan
	 */
	async removeScheduleSlot(classId, slotId) {
		const classItem = classes.find((c) => c.id === classId);
		if (!classItem || !classItem.schedule) return;

		const updatedSchedule = classItem.schedule.filter((slot) => slot.id !== slotId);
		await this.updateClass(classId, { schedule: updatedSchedule });
	},

	/**
	 * Fügt einen Schüler zur Klasse hinzu
	 */
	async addStudent(classId, studentId) {
		const classItem = classes.find((c) => c.id === classId);
		if (!classItem) return;

		const updatedStudentIds = [...(classItem.studentIds || []), studentId];
		await this.updateClass(classId, { studentIds: updatedStudentIds });
	},

	/**
	 * Entfernt einen Schüler aus der Klasse
	 */
	async removeStudent(classId, studentId) {
		const classItem = classes.find((c) => c.id === classId);
		if (!classItem) return;

		const updatedStudentIds = (classItem.studentIds || []).filter((id) => id !== studentId);
		await this.updateClass(classId, { studentIds: updatedStudentIds });
	},

	/**
	 * Fügt einen Plan zur Klasse hinzu
	 */
	async addPlan(classId, planId) {
		const classItem = classes.find((c) => c.id === classId);
		if (!classItem) return;

		const updatedPlanIds = [...(classItem.planIds || []), planId];
		await this.updateClass(classId, { planIds: updatedPlanIds });
	},

	/**
	 * Entfernt einen Plan aus der Klasse
	 */
	async removePlan(classId, planId) {
		const classItem = classes.find((c) => c.id === classId);
		if (!classItem) return;

		const updatedPlanIds = (classItem.planIds || []).filter((id) => id !== planId);
		await this.updateClass(classId, { planIds: updatedPlanIds });
	},

	/**
	 * Archiviert eine Klasse
	 */
	async archiveClass(classId) {
		await this.updateClass(classId, { archived: true });
	},

	/**
	 * Stellt eine archivierte Klasse wieder her
	 */
	async unarchiveClass(classId) {
		await this.updateClass(classId, { archived: false });
	},

	/**
	 * Gibt nur aktive (nicht archivierte) Klassen zurück
	 */
	get activeClasses() {
		return classes.filter((c) => !c.archived);
	},

	/**
	 * Gibt nur archivierte Klassen zurück
	 */
	get archivedClasses() {
		return classes.filter((c) => c.archived);
	}
};
