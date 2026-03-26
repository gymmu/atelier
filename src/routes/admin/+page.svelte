<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { timersStore } from '$lib/stores/timers.svelte.js';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import ClassSelector from '$lib/components/admin/ClassSelector.svelte';
	import ScheduleEditor from '$lib/components/admin/ScheduleEditor.svelte';
	import { SESSION_STATUS } from '$lib/utils/constants.js';

	let currentSchedule = $derived(scheduleStore.currentSchedule);
	let activeSession = $derived(scheduleStore.activeSession);
	let sessionStatus = $derived(scheduleStore.sessionStatus);

	// Initialize stores on mount
	onMount(async () => {
		await scheduleStore.init();
		await timersStore.init();
	});

	function handleStartSession() {
		if (!currentSchedule || currentSchedule.phases.length === 0) {
			alert('Bitte erstellen Sie zuerst einen Zeitplan mit mindestens einer Phase.');
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

	function openDisplayWindow() {
		if (window.electronAPI) {
			window.electronAPI.openDisplayWindow();
		} else {
			// Fallback for web: open in new window
			window.open('/display', '_blank');
		}
	}
</script>

<svelte:head>
	<title>Admin - Atelier</title>
</svelte:head>

<div class="admin-page">
	<header class="admin-header">
		<div class="header-content">
			<div class="header-left">
				<h1>Atelier Admin</h1>
				{#if currentSchedule}
					<span class="current-schedule">
						📋 {currentSchedule.name}
					</span>
				{/if}
			</div>
			
			<div class="header-actions">
				<button onclick={openDisplayWindow} class="btn btn-display">
					🖥️ Beamer-Ansicht öffnen
				</button>
				<a href="{base}/" class="btn btn-secondary">
					← Zurück
				</a>
			</div>
		</div>

		{#if currentSchedule}
			<div class="session-controls">
				{#if sessionStatus === SESSION_STATUS.IDLE}
					<button class="btn btn-success" onclick={handleStartSession}>
						▶️ Session starten
					</button>
				{:else if sessionStatus === SESSION_STATUS.RUNNING || sessionStatus === SESSION_STATUS.PAUSED}
					<button class="btn btn-warning" onclick={handlePauseSession}>
						{sessionStatus === SESSION_STATUS.PAUSED ? '▶️ Fortsetzen' : '⏸️ Pausieren'}
					</button>
					<button class="btn btn-secondary" onclick={handlePreviousPhase} disabled={activeSession?.currentPhaseIndex === 0}>
						⏮️ Vorherige Phase
					</button>
					<button class="btn btn-secondary" onclick={handleNextPhase}>
						⏭️ Nächste Phase
					</button>
					<button class="btn btn-danger" onclick={handleStopSession}>
						⏹️ Session beenden
					</button>
				{:else if sessionStatus === SESSION_STATUS.COMPLETED}
					<div class="session-completed">
						✅ Session abgeschlossen
					</div>
					<button class="btn btn-primary" onclick={handleStartSession}>
						🔄 Neu starten
					</button>
				{/if}
			</div>
		{/if}
	</header>

	<main class="admin-content">
		<aside class="sidebar">
			<ClassSelector />
		</aside>

		<section class="main-area">
			{#if currentSchedule}
				<ScheduleEditor schedule={currentSchedule} />
			{:else}
				<div class="empty-state">
					<div class="icon">📋</div>
					<h2>Kein Zeitplan ausgewählt</h2>
					<p>Wählen Sie einen Zeitplan aus oder erstellen Sie einen neuen.</p>
				</div>
			{/if}
		</section>
	</main>
</div>

<style>
	.admin-page {
		min-height: 100vh;
		background: var(--color-bg-darker);
		display: flex;
		flex-direction: column;
	}

	.admin-header {
		background: var(--color-bg-dark);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1.5rem 2rem;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	h1 {
		margin: 0;
		font-size: 1.75rem;
		color: var(--color-text);
		font-weight: 700;
	}

	.current-schedule {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.session-controls {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.session-completed {
		padding: 0.625rem 1.25rem;
		background: rgba(76, 175, 80, 0.2);
		border: 2px solid #4caf50;
		border-radius: 6px;
		font-weight: 600;
		color: #4caf50;
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #0096e0;
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn-success {
		background: #4caf50;
		color: white;
	}

	.btn-success:hover {
		background: #45a049;
		transform: translateY(-1px);
	}

	.btn-warning {
		background: #ff9800;
		color: white;
	}

	.btn-warning:hover {
		background: #fb8c00;
		transform: translateY(-1px);
	}

	.btn-danger {
		background: #f44336;
		color: white;
	}

	.btn-danger:hover {
		background: #e53935;
		transform: translateY(-1px);
	}

	.btn-display {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-display:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.admin-content {
		flex: 1;
		display: grid;
		grid-template-columns: 350px 1fr;
		gap: 1.5rem;
		padding: 1.5rem 2rem;
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
	}

	.sidebar {
		height: calc(100vh - 200px);
		position: sticky;
		top: 180px;
		overflow-y: auto;
	}

	.main-area {
		min-height: calc(100vh - 200px);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		padding: 3rem;
		background: var(--color-bg-dark);
		border-radius: 12px;
		border: 2px dashed rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.empty-state .icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.empty-state p {
		margin: 0;
		color: var(--color-text-secondary);
	}

	@media (max-width: 1200px) {
		.admin-content {
			grid-template-columns: 300px 1fr;
			gap: 1rem;
			padding: 1rem;
		}
	}

	@media (max-width: 1024px) {
		.admin-content {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.sidebar {
			position: static;
			height: auto;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.session-controls {
			flex-wrap: wrap;
		}
	}

	@media (max-width: 640px) {
		.admin-header {
			padding: 1rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.header-actions {
			width: 100%;
			flex-direction: column;
		}

		.btn {
			width: 100%;
			text-align: center;
		}
	}
</style>
