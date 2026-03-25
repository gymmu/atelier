// Vordefinierte Phasentypen für das Atelier-Prinzip
export const PREDEFINED_PHASES = [
	{
		name: 'Einstieg',
		color: '#4CAF50',
		icon: '🚀',
		defaultDuration: 10,
		defaultDescription: 'Begrüssung und Einführung in das Thema',
		defaultTasks: ['Anwesenheit prüfen', 'Lernziele vorstellen', 'Material bereitstellen']
	},
	{
		name: 'Instruktion',
		color: '#2196F3',
		icon: '📚',
		defaultDuration: 15,
		defaultDescription: 'Vermittlung neuer Inhalte und Erklärungen',
		defaultTasks: ['Theorie erklären', 'Beispiele zeigen', 'Fragen beantworten']
	},
	{
		name: 'Freie Arbeitsphase',
		color: '#FF9800',
		icon: '✏️',
		defaultDuration: 30,
		defaultDescription: 'Selbstständiges Arbeiten an individuellen Aufgaben',
		defaultTasks: ['Aufgaben selbstständig bearbeiten', 'Bei Bedarf Unterstützung holen', 'Timer setzen']
	},
	{
		name: 'Präsentation',
		color: '#9C27B0',
		icon: '🎤',
		defaultDuration: 15,
		defaultDescription: 'Vorstellung und Diskussion der Arbeitsergebnisse',
		defaultTasks: ['Ergebnisse vorstellen', 'Feedback geben', 'Fragen stellen']
	},
	{
		name: 'Reflexion',
		color: '#00BCD4',
		icon: '💭',
		defaultDuration: 10,
		defaultDescription: 'Rückblick und Auswertung der Lektion',
		defaultTasks: ['Lernziele überprüfen', 'Feedback sammeln', 'Ausblick geben']
	},
	{
		name: 'Pause',
		color: '#607D8B',
		icon: '☕',
		defaultDuration: 5,
		defaultDescription: 'Kurze Erholungspause',
		defaultTasks: ['Durchatmen', 'Bewegen', 'Trinken']
	}
];

export const PHASE_TYPE = {
	PREDEFINED: 'predefined',
	CUSTOM: 'custom'
};

export const SESSION_STATUS = {
	IDLE: 'idle',
	RUNNING: 'running',
	PAUSED: 'paused',
	COMPLETED: 'completed'
};
