<script>
	import { timersStore } from '$lib/stores/timers.svelte.js';
	import { onMount, onDestroy } from 'svelte';
	import Timer from '../shared/Timer.svelte';

	onMount(() => {
		timersStore.startInterval();
	});

	onDestroy(() => {
		timersStore.stopInterval();
	});

	let activeTimers = $derived(timersStore.activeTimers);
</script>

<div class="student-timers">
	<h3>Aktive Schüler-Timer</h3>
	
	{#if activeTimers.length === 0}
		<div class="empty-state">
			<p>Keine aktiven Timer</p>
		</div>
	{:else}
		<div class="timers-grid">
			{#each activeTimers as timer (timer.id)}
				<div class="timer-card">
					<div class="timer-header">
						<span class="student-name">{timer.studentName}</span>
						<Timer
							startTime={timer.startTime}
							duration={timer.duration}
							isPaused={timer.isPaused}
							pausedAt={timer.pausedAt}
							size="medium"
						/>
					</div>
					<div class="task-name">{timer.task}</div>
					{#if timer.isPaused}
						<div class="paused-badge">⏸️ Pausiert</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.student-timers {
		padding: 1.5rem;
		background: var(--color-bg-darker);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--color-text-secondary);
	}

	.empty-state p {
		margin: 0;
		font-size: 1.125rem;
	}

	.timers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.timer-card {
		padding: 1.25rem;
		background: var(--color-bg-dark);
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.05);
		transition: all 0.2s;
	}

	.timer-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.timer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.student-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.task-name {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		line-height: 1.4;
		margin-top: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.paused-badge {
		display: inline-block;
		margin-top: 0.75rem;
		padding: 0.25rem 0.75rem;
		background: rgba(255, 152, 0, 0.2);
		border: 1px solid #ff9800;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		color: #ff9800;
	}

	@media (max-width: 768px) {
		.student-timers {
			padding: 1rem;
		}

		h3 {
			font-size: 1.25rem;
			margin-bottom: 1rem;
		}

		.timers-grid {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.timer-card {
			padding: 1rem;
		}

		.student-name {
			font-size: 1rem;
		}

		.task-name {
			font-size: 0.85rem;
		}
	}
</style>
