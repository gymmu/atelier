import { studentsAPI } from '../api/students.js';
import { generateId } from '$lib/utils/timer.js';

/**
 * Students Store - Verwaltet Schüler
 * Verwendet Svelte 5 Runes für Reaktivität
 */

// State - Map von classId zu students Array
let studentsByClass = $state({});
let initialized = $state(false);

/**
 * Store-Objekt mit allen Methoden und State
 */
export const studentsStore = {
	// Getters
	get studentsByClass() {
		return studentsByClass;
	},
	get initialized() {
		return initialized;
	},

	/**
	 * Initialisiert den Store
	 */
	async init() {
		if (initialized) return;
		initialized = true;
	},

	/**
	 * Lädt Schüler für eine bestimmte Klasse
	 */
	async loadStudents(classId) {
		try {
			const students = await studentsAPI.get(classId);
			studentsByClass[classId] = students || [];
			// Trigger reactivity
			studentsByClass = { ...studentsByClass };
		} catch (error) {
			console.error(`Error loading students for class ${classId}:`, error);
			studentsByClass[classId] = [];
			studentsByClass = { ...studentsByClass };
		}
	},

	/**
	 * Gibt Schüler für eine Klasse zurück
	 */
	getStudentsForClass(classId) {
		return studentsByClass[classId] || [];
	},

	/**
	 * Erstellt einen neuen Schüler
	 */
	async createStudent(classId, data) {
		const newStudent = {
			id: generateId(),
			name: data.name || 'Neuer Schüler',
			email: data.email || '',
			notes: data.notes || '',
			classId: classId,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		const students = studentsByClass[classId] || [];
		const updatedStudents = [...students, newStudent];
		
		await studentsAPI.save(classId, updatedStudents);
		studentsByClass[classId] = updatedStudents;
		studentsByClass = { ...studentsByClass };
		
		return newStudent;
	},

	/**
	 * Aktualisiert einen Schüler
	 */
	async updateStudent(classId, studentId, updates) {
		const students = studentsByClass[classId] || [];
		const updatedStudents = students.map((s) =>
			s.id === studentId ? { ...s, ...updates, updatedAt: Date.now() } : s
		);

		await studentsAPI.save(classId, updatedStudents);
		studentsByClass[classId] = updatedStudents;
		studentsByClass = { ...studentsByClass };
	},

	/**
	 * Löscht einen Schüler
	 */
	async deleteStudent(classId, studentId) {
		const students = studentsByClass[classId] || [];
		const updatedStudents = students.filter((s) => s.id !== studentId);

		await studentsAPI.save(classId, updatedStudents);
		studentsByClass[classId] = updatedStudents;
		studentsByClass = { ...studentsByClass };
	},

	/**
	 * Importiert Schüler aus CSV
	 */
	async importFromCSV(classId, csvData) {
		try {
			// Parse CSV - erwarte Format: Name,Email,Notizen
			const lines = csvData.trim().split('\n');
			const students = studentsByClass[classId] || [];
			
			const newStudents = [];
			
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i].trim();
				if (!line) continue;
				
				// Skip header row if it contains 'name' or 'email'
				if (i === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('email'))) {
					continue;
				}
				
				const parts = line.split(',').map(p => p.trim());
				if (parts.length === 0 || !parts[0]) continue;
				
				const newStudent = {
					id: generateId(),
					name: parts[0] || 'Unbekannt',
					email: parts[1] || '',
					notes: parts[2] || '',
					classId: classId,
					createdAt: Date.now(),
					updatedAt: Date.now()
				};
				
				newStudents.push(newStudent);
			}
			
			const updatedStudents = [...students, ...newStudents];
			await studentsAPI.save(classId, updatedStudents);
			studentsByClass[classId] = updatedStudents;
			studentsByClass = { ...studentsByClass };
			
			return newStudents.length;
		} catch (error) {
			console.error('Error importing students from CSV:', error);
			throw error;
		}
	},

	/**
	 * Exportiert Schüler als CSV
	 */
	exportToCSV(classId) {
		const students = studentsByClass[classId] || [];
		if (students.length === 0) return '';
		
		const header = 'Name,Email,Notizen\n';
		const rows = students.map(s => 
			`"${s.name}","${s.email || ''}","${s.notes || ''}"`
		).join('\n');
		
		return header + rows;
	},

	/**
	 * Löscht alle Schüler einer Klasse
	 */
	async clearClass(classId) {
		studentsByClass[classId] = [];
		await studentsAPI.save(classId, []);
		studentsByClass = { ...studentsByClass };
	}
};
