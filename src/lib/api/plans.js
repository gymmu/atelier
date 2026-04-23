/**
 * Plans API - Interface für Plan-Verwaltung via Electron IPC
 */

export const plansAPI = {
	/**
	 * Lädt alle Pläne
	 * @returns {Promise<Array>} Liste aller Pläne (Metadaten)
	 */
	async getAll() {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return [];
		}
		return await window.electronAPI.getPlans();
	},

	/**
	 * Lädt einen spezifischen Plan (JSON)
	 * @param {string} planId
	 * @returns {Promise<Object|null>}
	 */
	async get(planId) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return null;
		}
		return await window.electronAPI.getPlan(planId);
	},

	/**
	 * Lädt einen Plan als Markdown
	 * @param {string} planId
	 * @returns {Promise<{content: string, data: Object}>}
	 */
	async getMarkdown(planId) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return { content: '', data: {} };
		}
		return await window.electronAPI.getPlanMarkdown(planId);
	},

	/**
	 * Speichert einen Plan (JSON)
	 * @param {Object} plan
	 * @returns {Promise<Object>}
	 */
	async save(plan) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return plan;
		}
		// Ensure the plan is serializable by doing a final JSON round-trip
		// This removes any remaining proxies or non-serializable objects
		const serializablePlan = JSON.parse(JSON.stringify(plan));
		return await window.electronAPI.savePlan(serializablePlan);
	},

	/**
	 * Speichert einen Plan als Markdown
	 * @param {string} planId
	 * @param {string} content - Markdown-Content
	 * @param {Object} frontmatter - YAML Frontmatter
	 * @returns {Promise<Object>}
	 */
	async saveMarkdown(planId, content, frontmatter) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return { content, frontmatter };
		}
		// Ensure frontmatter is serializable
		const serializableFrontmatter = JSON.parse(JSON.stringify(frontmatter));
		return await window.electronAPI.savePlanMarkdown(planId, content, serializableFrontmatter);
	},

	/**
	 * Löscht einen Plan
	 * @param {string} planId
	 * @returns {Promise<boolean>}
	 */
	async delete(planId) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return false;
		}
		return await window.electronAPI.deletePlan(planId);
	},

	/**
	 * Migriert Pläne von localStorage zu Dateien
	 * @param {Array} plans - Pläne aus localStorage
	 * @returns {Promise<{success: boolean, migrated: number}>}
	 */
	async migrate(plans) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return { success: false, migrated: 0 };
		}
		return await window.electronAPI.migratePlans(plans);
	}
};
