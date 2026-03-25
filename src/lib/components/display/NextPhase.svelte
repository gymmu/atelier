<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import PhaseIcon from '../shared/PhaseIcon.svelte';

	let schedule = $derived(scheduleStore.currentSchedule);
	let session = $derived(scheduleStore.activeSession);

	let nextPhase = $derived(() => {
		if (!session || !schedule) return null;
		const nextIndex = session.currentPhaseIndex + 1;
		if (nextIndex >= schedule.phases.length) return null;
		return schedule.phases[nextIndex];
	});
</script>

{#if nextPhase}
	<div class="next-phase">
		<div class="label">Als Nächstes</div>
		<div class="phase-preview">
			<PhaseIcon phaseName={nextPhase.name} size="small" />
			<div class="phase-info">
				<div class="phase-name">{nextPhase.name}</div>
				<div class="phase-duration">{nextPhase.duration} Minuten</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.next-phase {
		padding: 1rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-secondary);
		margin-bottom: 0.75rem;
		font-weight: 600;
	}

	.phase-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.phase-info {
		flex: 1;
		min-width: 0;
	}

	.phase-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.phase-duration {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	@media (max-width: 768px) {
		.next-phase {
			padding: 0.75rem;
		}

		.phase-name {
			font-size: 0.9rem;
		}

		.phase-duration {
			font-size: 0.8rem;
		}
	}
</style>
