const fs = require('fs').promises;
const path = require('path');

class SettingsManager {
	constructor(globalConfigPath) {
		this.globalConfigPath = globalConfigPath;
		this.globalSettingsFile = path.join(globalConfigPath, 'settings.json');
		this.localSettingsFile = null; // Will be set after working directory is chosen
		this.settings = null;
		this.isLocalSettings = false;
	}

	async ensureConfigDirectory() {
		await fs.mkdir(this.globalConfigPath, { recursive: true });
	}

	/**
	 * Load settings with hierarchy: local (.atelier/settings.json) before global
	 */
	async load() {
		await this.ensureConfigDirectory();

		// Try to load global settings first (to get working directory)
		let globalSettings = await this.loadFromFile(this.globalSettingsFile);
		
		// If we have a working directory, check for local settings
		if (globalSettings?.workingDirectory) {
			this.localSettingsFile = path.join(globalSettings.workingDirectory, '.atelier', 'settings.json');
			const localSettings = await this.loadFromFile(this.localSettingsFile);
			
			if (localSettings) {
				// Local settings exist and take priority
				this.settings = localSettings;
				this.isLocalSettings = true;
				console.log('Using local settings:', this.localSettingsFile);
				return this.settings;
			}
		}

		// Use global settings
		if (!globalSettings) {
			// No settings exist at all, create default
			globalSettings = {
				workingDirectory: null,
				theme: 'dark',
				lastOpened: null,
				recentDirectories: []
			};
		}

		this.settings = globalSettings;
		this.isLocalSettings = false;
		await this.save();
		
		return this.settings;
	}

	/**
	 * Load settings from a specific file
	 */
	async loadFromFile(filePath) {
		try {
			const content = await fs.readFile(filePath, 'utf8');
			return JSON.parse(content);
		} catch (err) {
			if (err.code === 'ENOENT') {
				return null;
			}
			throw err;
		}
	}

	/**
	 * Save settings to the appropriate location (local if in working directory, else global)
	 */
	async save() {
		let targetFile = this.globalSettingsFile;
		
		// If we have local settings file and working directory is set, save locally
		if (this.localSettingsFile && this.settings?.workingDirectory) {
			targetFile = this.localSettingsFile;
			// Ensure .atelier directory exists
			await fs.mkdir(path.dirname(this.localSettingsFile), { recursive: true });
			this.isLocalSettings = true;
		} else {
			await this.ensureConfigDirectory();
		}

		await fs.writeFile(targetFile, JSON.stringify(this.settings, null, 2), 'utf8');
		
		// Also save to global as backup (for working directory reference)
		if (this.isLocalSettings) {
			await this.ensureConfigDirectory();
			await fs.writeFile(this.globalSettingsFile, JSON.stringify(this.settings, null, 2), 'utf8');
		}
	}

	get(key, defaultValue = null) {
		return this.settings?.[key] ?? defaultValue;
	}

	async set(key, value) {
		if (!this.settings) {
			await this.load();
		}
		this.settings[key] = value;
		await this.save();
	}

	async setWorkingDirectory(dirPath) {
		await this.set('workingDirectory', dirPath);
		await this.set('lastOpened', Date.now());
		
		// Update recent directories
		await this.addToRecentDirectories(dirPath);
		
		// Update local settings file path
		this.localSettingsFile = path.join(dirPath, '.atelier', 'settings.json');
		
		// Create .atelier directory
		await fs.mkdir(path.join(dirPath, '.atelier'), { recursive: true });
	}

	async addToRecentDirectories(dirPath) {
		if (!this.settings) {
			await this.load();
		}

		let recent = this.settings.recentDirectories || [];
		
		// Remove if already exists
		recent = recent.filter(item => item.path !== dirPath);
		
		// Add to front
		recent.unshift({
			path: dirPath,
			name: path.basename(dirPath),
			lastAccessed: Date.now()
		});
		
		// Keep only last 10
		recent = recent.slice(0, 10);
		
		this.settings.recentDirectories = recent;
		await this.save();
	}

	getRecentDirectories() {
		return this.get('recentDirectories', []);
	}

	getWorkingDirectory() {
		return this.get('workingDirectory');
	}

	hasWorkingDirectory() {
		return this.getWorkingDirectory() !== null;
	}

	/**
	 * Get the path where settings are currently being used from
	 */
	getSettingsLocation() {
		if (this.isLocalSettings && this.localSettingsFile) {
			return this.localSettingsFile;
		}
		return this.globalSettingsFile;
	}
}

module.exports = SettingsManager;
