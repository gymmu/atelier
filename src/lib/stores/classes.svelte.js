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
		const newClass = {
			id: generateId(),
			name: data.name || 'Neue Klasse',
			subject: data.subject || '',
			room: data.room || '',
			teacher: data.teacher || '',
			weekday: data.weekday || '',
			time: data.time || '',
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
	}
};
