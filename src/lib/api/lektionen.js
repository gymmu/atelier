/**
 * Lektionen API – Interface für Lektions-YAML-Verwaltung via Electron IPC
 */

export const lektionenAPI = {
	/**
	 * Lädt Metadaten aller Lektionen (aus Dateinamen geparst).
	 * @returns {Promise<Array>}
	 */
	async getAll() {
		if (typeof window === 'undefined' || !window.electronAPI) return [];
		return await window.electronAPI.getLektionen();
	},

	/**
	 * Lädt eine einzelne Lektion (vollständiger YAML-Inhalt).
	 * @param {string} filename
	 * @returns {Promise<Object|null>}
	 */
	async get(filename) {
		if (typeof window === 'undefined' || !window.electronAPI) return null;
		return await window.electronAPI.getLektion(filename);
	},

	/**
	 * Speichert eine Lektion. Das _filename-Feld wird genutzt, um ggf. die alte
	 * Datei zu löschen wenn sich Metadaten geändert haben.
	 * @param {Object} data  Lektionsdaten inkl. optionalem _filename
	 * @returns {Promise<{ success: boolean, filename: string }>}
	 */
	async save(data) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return { success: false, filename: '' };
		}
		const serializable = JSON.parse(JSON.stringify(data));
		return await window.electronAPI.saveLektion(serializable);
	},

	/**
	 * Löscht eine Lektion.
	 * @param {string} filename
	 * @returns {Promise<{ success: boolean }>}
	 */
	async delete(filename) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return { success: false };
		}
		return await window.electronAPI.deleteLektion(filename);
	},

	/**
	 * Kopiert eine Lektion auf ein anderes Datum und/oder eine andere Klasse.
	 * @param {string} filename
	 * @param {{ zielDatum?: string, zielKlasse?: string }} opts
	 * @returns {Promise<{ success: boolean, filename: string }>}
	 */
	async copy(filename, opts) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return { success: false, filename: '' };
		}
		return await window.electronAPI.copyLektion(filename, opts);
	},

	/**
	 * Kopiert alle Lektionen einer KW in eine andere Woche.
	 * @param {number} quellWoche  Quell-KW
	 * @param {string} zielDatumErsterTag  ISO-Datum des Montags der Zielwoche
	 * @param {string|null} zielKlasse  Optional: Klasse überschreiben
	 * @returns {Promise<{ success: boolean, created: string[] }>}
	 */
	async copyWeek(quellWoche, zielDatumErsterTag, zielKlasse = null) {
		if (typeof window === 'undefined' || !window.electronAPI) {
			return { success: false, created: [] };
		}
		return await window.electronAPI.copyLektionWeek(quellWoche, zielDatumErsterTag, zielKlasse);
	}
};
