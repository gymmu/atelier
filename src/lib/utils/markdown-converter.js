/**
 * Erstellt Frontmatter und Content für einen Plan (ohne gray-matter)
 * @param {Object} plan - Plan-Objekt
 * @returns {{content: string, frontmatter: Object}}
 */
export function planToMarkdownParts(plan) {
	const { id, name, classId, phases, startTime, createdAt, updatedAt } = plan;

	// Frontmatter
	const frontmatter = {
		id,
		name,
		classId: classId || null,
		startTime: startTime || '08:00',
		createdAt,
		updatedAt
	};

	// Markdown Content
	let content = `# ${name}\n\n`;

	if (classId) {
		content += `**Klasse:** ${classId}\n`;
	}
	if (startTime) {
		content += `**Startzeit:** ${startTime}\n`;
	}
	content += '\n---\n\n';

	// Phasen
	if (phases && phases.length > 0) {
		content += '## Unterrichtsphasen\n\n';

		phases.forEach((phase, index) => {
			const durationMin = Math.floor(phase.duration / 60);
			const durationSec = phase.duration % 60;
			const durationStr =
				durationSec > 0 ? `${durationMin}:${durationSec.toString().padStart(2, '0')}` : `${durationMin}`;

			content += `### ${index + 1}. ${phase.name} (${durationStr} Min)\n\n`;

			if (phase.type) {
				content += `- **Typ:** ${phase.type}\n`;
			}
			if (phase.icon) {
				content += `- **Icon:** ${phase.icon}\n`;
			}
			if (phase.color) {
				content += `- **Farbe:** ${phase.color}\n`;
			}
			if (phase.description) {
				content += `\n${phase.description}\n`;
			}

			content += '\n';
		});
	} else {
		content += '_Keine Phasen definiert._\n';
	}

	return { content, frontmatter };
}

/**
 * Konvertiert einen Plan (JSON) in Markdown-Format mit Frontmatter
 * @param {Object} plan - Plan-Objekt
 * @returns {string} Markdown-String mit YAML Frontmatter
 */
export function planToMarkdown(plan) {
	const { id, name, classId, phases, startTime, createdAt, updatedAt } = plan;

	// Frontmatter
	const frontmatter = {
		id,
		name,
		classId: classId || null,
		startTime: startTime || '08:00',
		createdAt,
		updatedAt
	};

	// Markdown Content
	let content = `# ${name}\n\n`;

	if (classId) {
		content += `**Klasse:** ${classId}\n`;
	}
	if (startTime) {
		content += `**Startzeit:** ${startTime}\n`;
	}
	content += '\n---\n\n';

	// Phasen
	if (phases && phases.length > 0) {
		content += '## Unterrichtsphasen\n\n';

		phases.forEach((phase, index) => {
			const durationMin = Math.floor(phase.duration / 60);
			const durationSec = phase.duration % 60;
			const durationStr =
				durationSec > 0 ? `${durationMin}:${durationSec.toString().padStart(2, '0')}` : `${durationMin}`;

			content += `### ${index + 1}. ${phase.name} (${durationStr} Min)\n\n`;

			if (phase.type) {
				content += `- **Typ:** ${phase.type}\n`;
			}
			if (phase.icon) {
				content += `- **Icon:** ${phase.icon}\n`;
			}
			if (phase.color) {
				content += `- **Farbe:** ${phase.color}\n`;
			}
			if (phase.description) {
				content += `\n${phase.description}\n`;
			}

			content += '\n';
		});
	} else {
		content += '_Keine Phasen definiert._\n';
	}

	// Manually create YAML frontmatter (avoid gray-matter in browser)
	let yaml = '---\n';
	for (const [key, value] of Object.entries(frontmatter)) {
		if (value === null) {
			yaml += `${key}: null\n`;
		} else if (typeof value === 'string') {
			yaml += `${key}: ${value}\n`;
		} else {
			yaml += `${key}: ${value}\n`;
		}
	}
	yaml += '---\n\n';
	
	return yaml + content;
}

/**
 * Konvertiert Markdown (mit Frontmatter) zurück in ein Plan-Objekt
 * @param {string} markdown - Markdown-String mit YAML Frontmatter
 * @returns {Object} Plan-Objekt
 */
export function markdownToPlan(markdown) {
	// Manually parse YAML frontmatter (avoid gray-matter in browser)
	let content = markdown;
	let data = {};
	
	const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
	if (frontmatterMatch) {
		const yamlContent = frontmatterMatch[1];
		content = frontmatterMatch[2];
		
		// Simple YAML parser for our use case
		const lines = yamlContent.split('\n');
		for (const line of lines) {
			const match = line.match(/^(\w+):\s*(.*)$/);
			if (match) {
				const key = match[1];
				let value = match[2].trim();
				
				// Parse value
				if (value === 'null') {
					data[key] = null;
				} else if (!isNaN(value) && value !== '') {
					data[key] = Number(value);
				} else {
					data[key] = value;
				}
			}
		}
	}

	// Parse phases from markdown content
	const phases = parseMarkdownPhases(content);

	return {
		id: data.id || `plan-${Date.now()}`,
		name: data.name || 'Unbenannter Plan',
		classId: data.classId || null,
		startTime: data.startTime || '08:00',
		phases,
		createdAt: data.createdAt || Date.now(),
		updatedAt: Date.now()
	};
}

/**
 * Parst Phasen aus Markdown-Content
 * @param {string} content - Markdown-Content (ohne Frontmatter)
 * @returns {Array} Array von Phase-Objekten
 */
function parseMarkdownPhases(content) {
	const phases = [];

	// Find all phase headers (###)
	const phasePattern = /###\s+(\d+)\.\s+(.+?)\((\d+(?::\d+)?)\s*Min\)([\s\S]*?)(?=###|$)/g;

	let match;
	while ((match = phasePattern.exec(content)) !== null) {
		const [, index, name, durationStr, body] = match;

		// Parse duration (can be "10" or "10:30")
		let duration = 0;
		if (durationStr.includes(':')) {
			const [min, sec] = durationStr.split(':').map(Number);
			duration = min * 60 + sec;
		} else {
			duration = parseInt(durationStr, 10) * 60;
		}

		// Parse metadata from body
		const type = extractMetadata(body, 'Typ');
		const icon = extractMetadata(body, 'Icon');
		const color = extractMetadata(body, 'Farbe');

		// Extract description (remove metadata lines)
		const description = body
			.replace(/- \*\*(?:Typ|Icon|Farbe):\*\* .+\n?/g, '')
			.trim();

		phases.push({
			id: `phase-${Date.now()}-${index}`,
			name: name.trim(),
			duration,
			type: type || 'custom',
			icon: icon || '📝',
			color: color || '#007BC0',
			description: description || ''
		});
	}

	return phases;
}

/**
 * Extrahiert Metadaten aus Markdown-Body
 * @param {string} body - Markdown-Body
 * @param {string} key - Metadaten-Key
 * @returns {string|null}
 */
function extractMetadata(body, key) {
	const pattern = new RegExp(`- \\*\\*${key}:\\*\\*\\s+(.+)`, 'i');
	const match = body.match(pattern);
	return match ? match[1].trim() : null;
}

/**
 * Validiert ein Plan-Objekt
 * @param {Object} plan
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export function validatePlan(plan) {
	const errors = [];

	if (!plan.id) {
		errors.push('Plan muss eine ID haben');
	}
	if (!plan.name || plan.name.trim() === '') {
		errors.push('Plan muss einen Namen haben');
	}
	if (!Array.isArray(plan.phases)) {
		errors.push('Phasen müssen ein Array sein');
	} else {
		plan.phases.forEach((phase, index) => {
			if (!phase.name) {
				errors.push(`Phase ${index + 1} hat keinen Namen`);
			}
			if (typeof phase.duration !== 'number' || phase.duration <= 0) {
				errors.push(`Phase ${index + 1} hat keine gültige Dauer`);
			}
		});
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
