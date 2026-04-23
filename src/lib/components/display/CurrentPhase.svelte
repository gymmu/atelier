<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { onMount, onDestroy } from 'svelte';
	import PhaseIcon from '../shared/PhaseIcon.svelte';
	import Timer from '../shared/Timer.svelte';

	let updateInterval;

	onMount(() => {
		scheduleStore.startTimer();
		updateInterval = setInterval(() => {
			// Force reactivity update
		}, 1000);
	});

	onDestroy(() => {
		if (updateInterval) clearInterval(updateInterval);
	});

	let phase = $derived(scheduleStore.currentPhase);
	let session = $derived(scheduleStore.activeSession);
	let phaseDuration = $derived(scheduleStore.currentPhaseDuration);
	let status = $derived(scheduleStore.sessionStatus);
	let schedule = $derived(scheduleStore.currentSchedule);

	// Berechne Phase-Zeiten basierend auf Lektionsstart
	let phaseStartTime = $derived.by(() => {
		if (!session || !schedule || !phase) return null;
		
		// Wenn Zeitplan eine Startzeit hat, verwende diese
		if (schedule.startTime) {
			const [hours, minutes] = schedule.startTime.split(':').map(Number);
			const startDate = new Date();
			startDate.setHours(hours, minutes, 0, 0);
			
			// Addiere Dauer aller vorherigen Phasen
			let minutesToAdd = 0;
			for (let i = 0; i < session.currentPhaseIndex; i++) {
				minutesToAdd += schedule.phases[i].duration;
			}
			
			return new Date(startDate.getTime() + minutesToAdd * 60 * 1000);
		}
		
		// Fallback: Verwende Session-Start
		return new Date(session.phaseStartTime);
	});

	let phaseEndTime = $derived.by(() => {
		if (!phaseStartTime || !phase) return null;
		return new Date(phaseStartTime.getTime() + phaseDuration * 60 * 1000);
	});

	let formatTime = (date) => {
		if (!date) return '';
		return date.toLocaleTimeString('de-CH', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};
</script>

<div class="current-phase">
	{#if !session || status === 'idle'}
		<div class="idle-state">
			<div class="icon">⏸️</div>
			<h2>Keine aktive Session</h2>
			<p>Starten Sie eine Session im Admin-Bereich</p>
		</div>
	{:else if status === 'completed'}
		<div class="completed-state">
			<div class="icon">✅</div>
			<h2>Session abgeschlossen</h2>
			<p>Alle Phasen wurden durchlaufen</p>
		</div>
	{:else if phase}
		<div class="active-phase">
			<PhaseIcon phaseName={phase.name} size="large" />
			<h1 class="phase-name">{phase.name}</h1>

			<div class="time-info">
				<div class="time-item">
					<span class="time-label">Start</span>
					<span class="time-value">{formatTime(phaseStartTime)}</span>
				</div>
				<div class="time-separator">→</div>
				<div class="time-item">
					<span class="time-label">Ende</span>
					<span class="time-value">{formatTime(phaseEndTime)}</span>
				</div>
			</div>

			<div class="timer-display">
				<Timer
					startTime={session.phaseStartTime}
					duration={phaseDuration}
					isPaused={session.isPaused}
					pausedAt={session.pausedAt}
					size="large"
					showProgress={true}
				/>
			</div>

			{#if phase.description}
				<div class="phase-description">
					<h3>Beschreibung</h3>
					<p>{phase.description}</p>
				</div>
			{/if}

			{#if phase.tasks && phase.tasks.length > 0}
				<div class="phase-tasks">
					<h3>Aufgaben</h3>
					<ul>
						{#each phase.tasks as task}
							<li>{task}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if status === 'paused'}
				<div class="paused-indicator">
					⏸️ Pausiert
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.current-phase {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 2rem;
		background: linear-gradient(
			135deg,
			var(--color-bg-darker) 0%,
			var(--color-bg-dark) 100%
		);
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		overflow-y: auto;
		overflow-x: hidden;
		height: 100%;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE and Edge */
	}

	/* Scrollbar verstecken für Webkit-Browser (Chrome, Safari) */
	.current-phase::-webkit-scrollbar {
		display: none;
	}

	.idle-state,
	.completed-state {
		text-align: center;
		color: var(--color-text-secondary);
	}

	.idle-state .icon,
	.completed-state .icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.idle-state h2,
	.completed-state h2 {
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
	}

	.idle-state p,
	.completed-state p {
		font-size: 1.25rem;
		margin: 0;
	}

	.active-phase {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		width: 100%;
	}

	.phase-name {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0;
		color: var(--color-text);
		text-align: center;
		line-height: 1.2;
	}

	.time-info {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1rem 2rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
	}

	.time-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.time-label {
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-secondary);
		font-weight: 600;
	}

	.time-value {
		font-size: 1.5rem;
		font-weight: 700;
		font-family: 'Courier New', monospace;
		color: var(--color-primary);
	}

	.time-separator {
		font-size: 1.5rem;
		color: var(--color-text-secondary);
	}

	.timer-display {
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		min-width: 250px;
		display: flex;
		justify-content: center;
	}

	.phase-description,
	.phase-tasks {
		width: 100%;
		max-width: 600px;
		padding: 1rem 1.25rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		text-align: left;
	}

	.phase-description h3,
	.phase-tasks h3 {
		margin: 0 0 0.625rem 0;
		font-size: 1.125rem;
		color: var(--color-primary);
		font-weight: 600;
	}

	.phase-description p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text);
	}

	.phase-tasks ul {
		margin: 0;
		padding-left: 1.5rem;
		list-style-type: none;
	}

	.phase-tasks li {
		font-size: 1rem;
		line-height: 1.6;
		color: var(--color-text);
		position: relative;
		padding-left: 0.5rem;
	}

	.phase-tasks li::before {
		content: '✓';
		position: absolute;
		left: -1.25rem;
		color: var(--color-primary);
		font-weight: bold;
	}

	.paused-indicator {
		padding: 1rem 2rem;
		background: rgba(255, 152, 0, 0.2);
		border: 2px solid #ff9800;
		border-radius: 8px;
		font-size: 1.5rem;
		font-weight: 600;
		color: #ff9800;
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	@media (max-width: 768px) {
		.current-phase {
			padding: 1.5rem;
		}

		.phase-name {
			font-size: 2rem;
		}

		.active-phase {
			gap: 1rem;
		}

		.time-info {
			padding: 0.75rem 1.5rem;
			gap: 1rem;
		}

		.time-label {
			font-size: 0.75rem;
		}

		.time-value {
			font-size: 1.25rem;
		}

		.timer-display {
			min-width: 200px;
			padding: 1.5rem;
		}

		.phase-description,
		.phase-tasks {
			padding: 1rem;
		}

		.phase-description h3,
		.phase-tasks h3 {
			font-size: 1.125rem;
		}

		.phase-description p,
		.phase-tasks li {
			font-size: 1rem;
		}

		.paused-indicator {
			font-size: 1.25rem;
			padding: 0.75rem 1.5rem;
		}
	}
</style>
