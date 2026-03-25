<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { SESSION_STATUS } from '$lib/utils/constants.js';

	let currentSchedule = $derived(scheduleStore.currentSchedule);
	let activeSession = $derived(scheduleStore.activeSession);
	let sessionStatus = $derived(scheduleStore.sessionStatus);

	function handleStartSession() {
		if (!currentSchedule || currentSchedule.phases.length === 0) {
			alert('Bitte wählen Sie zuerst einen Zeitplan mit Phasen aus.');
			return;
		}
		scheduleStore.startSession();
	}

	function handlePauseSession() {
		if (sessionStatus === SESSION_STATUS.PAUSED) {
			scheduleStore.resumeSession();
		} else {
			scheduleStore.pauseSession();
		}
	}

	function handleStopSession() {
		if (confirm('Session wirklich beenden?')) {
			scheduleStore.stopSession();
		}
	}

	function handleNextPhase() {
		scheduleStore.nextPhase();
	}

	function handlePreviousPhase() {
		scheduleStore.previousPhase();
	}
</script>

<div class="session-controls">
	{#if !currentSchedule}
		<div class="no-schedule">
			<p>Kein Zeitplan ausgewählt</p>
		</div>
	{:else if sessionStatus === SESSION_STATUS.IDLE}
		<button class="btn btn-success btn-large" onclick={handleStartSession}>
			▶️ Session starten
		</button>
	{:else if sessionStatus === SESSION_STATUS.COMPLETED}
		<div class="completed-message">
			✅ Session abgeschlossen
		</div>
		<button class="btn btn-primary" onclick={handleStartSession}>
			🔄 Neu starten
		</button>
	{:else}
		<div class="control-buttons">
			<button
				class="btn btn-secondary"
				onclick={handlePreviousPhase}
				disabled={activeSession?.currentPhaseIndex === 0}
				title="Vorherige Phase"
			>
				⏮️
			</button>

			<button
				class="btn {sessionStatus === SESSION_STATUS.PAUSED ? 'btn-success' : 'btn-warning'}"
				onclick={handlePauseSession}
				title={sessionStatus === SESSION_STATUS.PAUSED ? 'Fortsetzen' : 'Pausieren'}
			>
				{sessionStatus === SESSION_STATUS.PAUSED ? '▶️' : '⏸️'}
			</button>

			<button class="btn btn-secondary" onclick={handleNextPhase} title="Nächste Phase">
				⏭️
			</button>

			<button class="btn btn-danger" onclick={handleStopSession} title="Session beenden">
				⏹️
			</button>
		</div>
	{/if}
</div>

<style>
	.session-controls {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: stretch;
		gap: 0.75rem;
		padding: 1.5rem;
		background: var(--color-bg-darker);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.no-schedule {
		text-align: center;
		color: var(--color-text-secondary);
		padding: 0.5rem;
	}

	.no-schedule p {
		margin: 0;
		font-size: 0.875rem;
	}

	.completed-message {
		padding: 1rem;
		background: rgba(76, 175, 80, 0.2);
		border: 2px solid #4caf50;
		border-radius: 6px;
		font-weight: 600;
		color: #4caf50;
		font-size: 1rem;
		text-align: center;
	}

	.control-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.btn {
		padding: 0.875rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 3rem;
		width: 100%;
	}

	.btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.btn-large {
		font-size: 1.25rem;
		padding: 1.25rem 1.5rem;
		width: 100%;
		min-height: 3.5rem;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #0096e0;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.btn-success {
		background: #4caf50;
		color: white;
	}

	.btn-success:hover:not(:disabled) {
		background: #45a049;
	}

	.btn-warning {
		background: #ff9800;
		color: white;
	}

	.btn-warning:hover:not(:disabled) {
		background: #fb8c00;
	}

	.btn-danger {
		background: #f44336;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #e53935;
	}

	@media (max-width: 768px) {
		.session-controls {
			padding: 1rem;
		}

		.btn {
			padding: 0.75rem 0.75rem;
			font-size: 1rem;
			min-height: 2.5rem;
		}

		.btn-large {
			font-size: 1.125rem;
			padding: 1rem;
			min-height: 3rem;
		}

		.control-buttons {
			gap: 0.5rem;
		}
	}
</style>
