<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';

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
					style="--phase-color: {phase.color}"
				>
					<div class="phase-color-bar"></div>
					
					<div class="phase-content">
						<div class="phase-header">
							<span class="phase-name">{phase.name}</span>
							<span class="duration">{phase.duration} Min.</span>
						</div>
						
						<div class="phase-meta">
							<span class="time">{phase.startTime} - {phase.endTime}</span>
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
		gap: 0;
		padding: 0;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.05);
		transition: all 0.2s;
		overflow: hidden;
		position: relative;
	}

	.phase-item.completed {
		opacity: 0.5;
	}

	.phase-item.active {
		background: rgba(0, 123, 192, 0.1);
		border-color: var(--color-primary);
	}

	.phase-item.upcoming {
		opacity: 0.8;
	}

	.phase-color-bar {
		width: 4px;
		background: var(--phase-color);
		flex-shrink: 0;
	}

	.phase-item.active .phase-color-bar {
		animation: pulse-glow 2s infinite;
	}

	@keyframes pulse-glow {
		0%, 100% {
			opacity: 1;
			box-shadow: 0 0 8px var(--phase-color);
		}
		50% {
			opacity: 0.7;
			box-shadow: 0 0 16px var(--phase-color);
		}
	}

	.phase-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		padding: 0.625rem 0.75rem;
	}

	.phase-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.phase-name {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
	}

	.phase-item.active .phase-name {
		color: var(--color-primary);
	}

	.duration {
		font-weight: 600;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.phase-item.active .duration {
		color: var(--color-primary);
	}

	.phase-meta {
		display: flex;
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
	}

	.time {
		font-family: 'Courier New', monospace;
		font-weight: 500;
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

	.phases-timeline {
		/* Keine max-height mehr, da die ganze Seitenleiste scrollt */
	}

	@media (max-width: 768px) {
		.session-outline {
			padding: 1rem;
		}

		.outline-title {
			font-size: 1rem;
		}

		.phase-content {
			padding: 0.5rem 0.625rem;
		}

		.phase-name {
			font-size: 0.8125rem;
		}

		.duration {
			font-size: 0.6875rem;
		}

		.phase-meta {
			font-size: 0.625rem;
		}
	}
</style>
