<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import PhaseIcon from '../shared/PhaseIcon.svelte';

	let schedule = $derived(scheduleStore.currentSchedule);
	let session = $derived(scheduleStore.activeSession);

	// Berechne Start- und Endzeiten für jede Phase
	let phaseTimeline = $derived.by(() => {
		if (!schedule || !schedule.startTime) return [];
		
		const [hours, minutes] = schedule.startTime.split(':').map(Number);
		let currentTime = new Date();
		currentTime.setHours(hours, minutes, 0, 0);
		
		return schedule.phases.map((phase, index) => {
			const startTime = new Date(currentTime);
			currentTime = new Date(currentTime.getTime() + phase.duration * 60 * 1000);
			const endTime = new Date(currentTime);
			
			return {
				...phase,
				startTime: startTime.toLocaleTimeString('de-CH', {
					hour: '2-digit',
					minute: '2-digit'
				}),
				endTime: endTime.toLocaleTimeString('de-CH', {
					hour: '2-digit',
					minute: '2-digit'
				}),
				index
			};
		});
	});

	let currentPhaseIndex = $derived(session?.currentPhaseIndex ?? -1);
</script>

{#if schedule}
	<div class="session-outline">
		<h3 class="outline-title">Session Übersicht</h3>
		
		<div class="phases-timeline">
			{#each phaseTimeline as phase, index (phase.id)}
				<div 
					class="phase-item"
					class:active={index === currentPhaseIndex}
					class:completed={index < currentPhaseIndex}
					class:upcoming={index > currentPhaseIndex}
				>
					<div class="phase-indicator">
						{#if index < currentPhaseIndex}
							<span class="status-icon completed">✓</span>
						{:else if index === currentPhaseIndex}
							<span class="status-icon active">▶</span>
						{:else}
							<span class="status-icon upcoming">{index + 1}</span>
						{/if}
					</div>
					
					<div class="phase-content">
						<div class="phase-header">
							<PhaseIcon phaseName={phase.name} size="tiny" />
							<span class="phase-name">{phase.name}</span>
						</div>
						
						<div class="phase-meta">
							<span class="time">{phase.startTime} - {phase.endTime}</span>
							<span class="duration">{phase.duration} Min.</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		{#if schedule.phases.length > 0}
			<div class="total-summary">
				<span class="summary-label">Gesamtdauer:</span>
				<span class="summary-value">
					{schedule.phases.reduce((sum, p) => sum + p.duration, 0)} Minuten
				</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.session-outline {
		background: var(--color-bg-darker);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.outline-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text);
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.phases-timeline {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.phase-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.05);
		transition: all 0.2s;
	}

	.phase-item.completed {
		opacity: 0.6;
		background: rgba(76, 175, 80, 0.1);
		border-color: rgba(76, 175, 80, 0.2);
	}

	.phase-item.active {
		background: rgba(0, 123, 192, 0.15);
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(0, 123, 192, 0.2);
	}

	.phase-item.upcoming {
		opacity: 0.7;
	}

	.phase-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
	}

	.status-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		font-weight: 700;
		font-size: 0.875rem;
	}

	.status-icon.completed {
		background: rgba(76, 175, 80, 0.2);
		color: #4caf50;
		border: 2px solid #4caf50;
	}

	.status-icon.active {
		background: rgba(0, 123, 192, 0.2);
		color: var(--color-primary);
		border: 2px solid var(--color-primary);
		animation: pulse-border 2s infinite;
	}

	@keyframes pulse-border {
		0%, 100% {
			box-shadow: 0 0 0 0 rgba(0, 123, 192, 0.4);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(0, 123, 192, 0);
		}
	}

	.status-icon.upcoming {
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-text-secondary);
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	.phase-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		min-width: 0;
	}

	.phase-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.phase-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.phase-item.active .phase-name {
		color: var(--color-primary);
	}

	.phase-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.time {
		font-family: 'Courier New', monospace;
		font-weight: 500;
	}

	.duration {
		font-weight: 600;
	}

	.total-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: rgba(0, 123, 192, 0.1);
		border-radius: 6px;
		border: 1px solid rgba(0, 123, 192, 0.2);
		margin-top: 0.5rem;
	}

	.summary-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.summary-value {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-primary);
		font-family: 'Courier New', monospace;
	}

	/* Scrollable wenn zu viele Phasen */
	.phases-timeline {
		max-height: 400px;
		overflow-y: auto;
	}

	.phases-timeline::-webkit-scrollbar {
		width: 6px;
	}

	.phases-timeline::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
	}

	.phases-timeline::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
	}

	.phases-timeline::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	@media (max-width: 768px) {
		.session-outline {
			padding: 1rem;
		}

		.outline-title {
			font-size: 1rem;
		}

		.phase-item {
			padding: 0.625rem;
		}

		.status-icon {
			width: 1.75rem;
			height: 1.75rem;
			font-size: 0.75rem;
		}

		.phase-name {
			font-size: 0.875rem;
		}

		.phase-meta {
			font-size: 0.6875rem;
		}

		.phases-timeline {
			max-height: 300px;
		}
	}
</style>
