/**
 * Berechnet die verbleibende Zeit in Millisekunden
 * @param {number} startTime - Start-Zeitpunkt (timestamp)
 * @param {number} duration - Dauer in Minuten
 * @param {boolean} isPaused - Ist der Timer pausiert?
 * @param {number|null} pausedAt - Zeitpunkt der Pausierung
 * @returns {number} Verbleibende Zeit in Millisekunden
 */
export function getRemainingTime(startTime, duration, isPaused = false, pausedAt = null) {
	const durationMs = duration * 60 * 1000;
	const now = Date.now();
	
	if (isPaused && pausedAt) {
		const elapsed = pausedAt - startTime;
		return Math.max(0, durationMs - elapsed);
	}
	
	const elapsed = now - startTime;
	return Math.max(0, durationMs - elapsed);
}

/**
 * Formatiert Zeit im Format MM:SS (unterstützt auch negative Zeiten)
 * @param {number} milliseconds - Zeit in Millisekunden
 * @returns {string} Formatierte Zeit
 */
export function formatTime(milliseconds) {
	const isNegative = milliseconds < 0;
	const absMilliseconds = Math.abs(milliseconds);
	const totalSeconds = Math.ceil(absMilliseconds / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	return isNegative ? `-${timeString}` : timeString;
}

/**
 * Formatiert Zeit im Format HH:MM:SS für längere Dauer
 * @param {number} milliseconds - Zeit in Millisekunden
 * @returns {string} Formatierte Zeit
 */
export function formatTimeLong(milliseconds) {
	const totalSeconds = Math.ceil(milliseconds / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	
	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Berechnet den Fortschritt in Prozent
 * @param {number} elapsed - Verstrichene Zeit in Millisekunden
 * @param {number} total - Gesamtdauer in Millisekunden
 * @returns {number} Fortschritt in Prozent (0-100)
 */
export function calculateProgress(elapsed, total) {
	if (total <= 0) return 0;
	return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/**
 * Generiert eine eindeutige ID
 * @returns {string} Eindeutige ID
 */
export function generateId() {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Spielt einen Sound ab (optional, für Timer-Benachrichtigungen)
 * @param {string} type - Art des Sounds ('notification', 'warning', 'complete')
 */
export function playSound(type = 'notification') {
	if (typeof window === 'undefined') return;
	
	const audioContext = new (window.AudioContext || window.webkitAudioContext)();
	const oscillator = audioContext.createOscillator();
	const gainNode = audioContext.createGain();
	
	oscillator.connect(gainNode);
	gainNode.connect(audioContext.destination);
	
	// Verschiedene Frequenzen für verschiedene Sounds
	const frequencies = {
		notification: 523.25, // C5
		warning: 440.00,      // A4
		complete: 659.25      // E5
	};
	
	oscillator.frequency.value = frequencies[type] || frequencies.notification;
	oscillator.type = 'sine';
	
	gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
	gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
	
	oscillator.start(audioContext.currentTime);
	oscillator.stop(audioContext.currentTime + 0.3);
}
