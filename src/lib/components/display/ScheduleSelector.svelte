<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';

	let { isOpen = $bindable(false) } = $props();

	function handleSelectSchedule(id) {
		scheduleStore.setCurrentSchedule(id);
		isOpen = false;
	}

	let schedules = $derived(scheduleStore.schedules);
	let currentScheduleId = $derived(scheduleStore.currentScheduleId);
</script>

<div class="schedule-selector" class:open={isOpen}>
	<div class="selector-header">
		<h3>Zeitpläne</h3>
		<button class="btn-close" onclick={() => (isOpen = false)} title="Schließen">
			✕
		</button>
	</div>

	<div class="schedules-list">
		{#if schedules.length === 0}
			<div class="empty-state">
				<p>Keine Zeitpläne vorhanden.</p>
				<p>Erstellen Sie zuerst einen Zeitplan im Admin-Bereich.</p>
			</div>
		{:else}
			{#each schedules as schedule (schedule.id)}
				<button
					class="schedule-item"
					class:active={schedule.id === currentScheduleId}
					onclick={() => handleSelectSchedule(schedule.id)}
				>
					<div class="schedule-info">
						<div class="schedule-name">{schedule.name}</div>
						<div class="schedule-meta">
							{schedule.phases.length} Phasen
							{#if schedule.phases.length > 0}
								· {schedule.phases.reduce((sum, p) => sum + p.duration, 0)} Min.
							{/if}
						</div>
					</div>
					{#if schedule.id === currentScheduleId}
						<div class="active-indicator">✓</div>
					{/if}
				</button>
			{/each}
		{/if}
	</div>
</div>

{#if isOpen}
	<button class="overlay" onclick={() => (isOpen = false)} aria-label="Schließen"></button>
{/if}

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		border: none;
		cursor: pointer;
		backdrop-filter: blur(2px);
	}

	.schedule-selector {
		position: fixed;
		top: 0;
		right: -400px;
		width: 400px;
		height: 100vh;
		background: var(--color-bg-dark);
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		transition: right 0.3s ease;
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
	}

	.schedule-selector.open {
		right: 0;
	}

	.selector-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: var(--color-bg-darker);
	}

	h3 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--color-text);
		font-weight: 700;
	}

	.btn-close {
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: var(--color-text);
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-close:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		transform: scale(1.05);
	}

	.schedules-list {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1.5rem;
		color: var(--color-text-secondary);
	}

	.empty-state p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.schedule-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color-bg-darker);
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.05);
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
	}

	.schedule-item:hover {
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateX(-4px);
		background: rgba(255, 255, 255, 0.03);
	}

	.schedule-item.active {
		border-color: var(--color-primary);
		background: rgba(0, 123, 192, 0.15);
	}

	.schedule-item.active:hover {
		background: rgba(0, 123, 192, 0.2);
	}

	.schedule-info {
		flex: 1;
		min-width: 0;
	}

	.schedule-name {
		font-weight: 600;
		font-size: 1.125rem;
		color: var(--color-text);
		margin-bottom: 0.375rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.schedule-meta {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.active-indicator {
		font-size: 1.5rem;
		color: var(--color-primary);
		line-height: 1;
	}

	/* Scrollbar styling */
	.schedules-list::-webkit-scrollbar {
		width: 8px;
	}

	.schedules-list::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
	}

	.schedules-list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.schedules-list::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	@media (max-width: 768px) {
		.schedule-selector {
			width: 100%;
			right: -100%;
		}

		.selector-header {
			padding: 1rem;
		}

		h3 {
			font-size: 1.25rem;
		}

		.schedules-list {
			padding: 1rem;
		}

		.schedule-item {
			padding: 1rem;
		}

		.schedule-name {
			font-size: 1rem;
		}
	}
</style>
