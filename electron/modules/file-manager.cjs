const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const matter = require('gray-matter');

class FileManager {
	constructor(workingDirectory) {
		// All data goes into .atelier/ subdirectory
		this.basePath = path.join(workingDirectory, '.atelier');
		this.ensureDirectories();
	}

	async ensureDirectories() {
		// Ensure .atelier base directory exists
		await fs.mkdir(this.basePath, { recursive: true });
		
		// Ensure data subdirectories exist
		const dirs = ['classes', 'sessions', 'timers'];
		for (const dir of dirs) {
			await fs.mkdir(path.join(this.basePath, dir), { recursive: true });
		}
	}

	// JSON Operations
	async readJSON(filePath, defaultValue = null) {
		const fullPath = path.join(this.basePath, filePath);
		try {
			const content = await fs.readFile(fullPath, 'utf8');
			return JSON.parse(content);
		} catch (err) {
			if (err.code === 'ENOENT') return defaultValue;
			throw err;
		}
	}

	async writeJSON(filePath, data) {
		const fullPath = path.join(this.basePath, filePath);
		await fs.mkdir(path.dirname(fullPath), { recursive: true });
		await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
	}

	// Markdown Operations
	async readMarkdown(filePath) {
		const fullPath = path.join(this.basePath, filePath);
		try {
			const content = await fs.readFile(fullPath, 'utf8');
			return matter(content);
		} catch (err) {
			if (err.code === 'ENOENT') return { content: '', data: {} };
			throw err;
		}
	}

	async writeMarkdown(filePath, content, frontmatter = {}) {
		const fullPath = path.join(this.basePath, filePath);
		await fs.mkdir(path.dirname(fullPath), { recursive: true });
		const file = matter.stringify(content, frontmatter);
		await fs.writeFile(fullPath, file, 'utf8');
	}

	// CSV Operations
	async readCSV(filePath) {
		const fullPath = path.join(this.basePath, filePath);
		try {
			const content = await fs.readFile(fullPath, 'utf8');
			return parse(content, { columns: true, skip_empty_lines: true });
		} catch (err) {
			if (err.code === 'ENOENT') return [];
			throw err;
		}
	}

	async writeCSV(filePath, data) {
		const fullPath = path.join(this.basePath, filePath);
		await fs.mkdir(path.dirname(fullPath), { recursive: true });
		const csv = stringify(data, { header: true });
		await fs.writeFile(fullPath, csv, 'utf8');
	}

	// Directory Operations
	async listFiles(dirPath) {
		const fullPath = path.join(this.basePath, dirPath);
		try {
			return await fs.readdir(fullPath);
		} catch (err) {
			if (err.code === 'ENOENT') return [];
			throw err;
		}
	}

	async deleteFile(filePath) {
		const fullPath = path.join(this.basePath, filePath);
		try {
			await fs.unlink(fullPath);
		} catch (err) {
			if (err.code === 'ENOENT') return;
			throw err;
		}
	}

	async deleteDirectory(dirPath) {
		const fullPath = path.join(this.basePath, dirPath);
		try {
			await fs.rm(fullPath, { recursive: true, force: true });
		} catch (err) {
			if (err.code === 'ENOENT') return;
			throw err;
		}
	}
}

module.exports = FileManager;
