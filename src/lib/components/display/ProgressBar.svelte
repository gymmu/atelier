<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { onMount, onDestroy } from 'svelte';

	let updateInterval;

	onMount(() => {
		updateInterval = setInterval(() => {
			// Force reactivity update
		}, 1000);
	});

	onDestroy(() => {
		if (updateInterval) clearInterval(updateInterval);
	});

	let schedule = $derived(scheduleStore.currentSchedule);
	let session = $derived(scheduleStore.activeSession);

	let totalDuration = $derived(() => {
		if (!schedule) return 0;
		return schedule.phases.reduce((sum, phase) => sum + phase.duration * 60 * 1000, 0);
	});

	let elapsedTotal = $derived(() => {
		if (!session || !schedule) return 0;
		
		let elapsed = 0;
		// Add completed phases
		for (let i = 0; i < session.currentPhaseIndex; i++) {
			elapsed += schedule.phases[i].duration * 60 * 1000;
		}
		
		// Add current phase progress
		if (session.currentPhaseIndex < schedule.phases.length) {
			const currentPhase = schedule.phases[session.currentPhaseIndex];
			const phaseDuration = currentPhase.duration * 60 * 1000;
			const phaseElapsed = session.isPaused
				? session.pausedAt - session.phaseStartTime
				: Date.now() - session.phaseStartTime;
			elapsed += Math.min(phaseElapsed, phaseDuration);
		}
		
		return elapsed;
	});

	let progressPercent = $derived(() => {
		if (!totalDuration) return 0;
		return Math.min(100, (elapsedTotal / totalDuration) * 100);
	});

	let currentPhaseProgress = $derived(() => {
		if (!session || !schedule) return 0;
		if (session.currentPhaseIndex >= schedule.phases.length) return 100;
		
		const currentPhase = schedule.phases[session.currentPhaseIndex];
		const phaseDuration = currentPhase.duration * 60 * 1000;
		const phaseElapsed = session.isPaused
			? session.pausedAt - session.phaseStartTime
			: Date.now() - session.phaseStartTime;
		
		return Math.min(100, (phaseElapsed / phaseDuration) * 100);
	});
</script>

<div class="progress-section">
	{#if schedule && session}
		<div class="progress-header">
			<span class="progress-label">
				Phase {session.currentPhaseIndex + 1} von {schedule.phases.length}
			</span>
			<span class="progress-percent">
				{Math.round(progressPercent)}%
			</span>
		</div>

		<div class="progress-bars">
			<!-- Gesamtfortschritt -->
			<div class="progress-bar total">
				<div class="progress-fill" style="width: {progressPercent}%"></div>
			</div>

			<!-- Aktuelle Phase -->
			<div class="progress-bar current">
				<div class="progress-fill" style="width: {currentPhaseProgress}%"></div>
			</div>
		</div>

		<div class="progress-footer">
			<span class="label">Gesamtfortschritt</span>
			<span class="label">Aktuelle Phase</span>
		</div>
	{/if}
</div>

<style>
	.progress-section {
		padding: 1.5rem;
		background: var(--color-bg-darker);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.progress-label {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.progress-percent {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.progress-bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.progress-bar {
		height: 24px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		overflow: hidden;
		position: relative;
	}

	.progress-bar.current {
		height: 16px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), #0096e0);
		border-radius: 12px;
		transition: width 0.5s ease;
		position: relative;
	}

	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.3),
			transparent
		);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.progress-footer {
		display: flex;
		justify-content: space-between;
		padding-top: 0.5rem;
	}

	.label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	@media (max-width: 768px) {
		.progress-section {
			padding: 1rem;
		}

		.progress-label {
			font-size: 1rem;
		}

		.progress-percent {
			font-size: 1.25rem;
		}

		.progress-bar {
			height: 20px;
		}

		.progress-bar.current {
			height: 12px;
		}
	}
</style>
