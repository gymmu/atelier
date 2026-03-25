<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';

	let showNewScheduleForm = $state(false);
	let newScheduleName = $state('');

	function handleSelectSchedule(id) {
		scheduleStore.setCurrentSchedule(id);
	}

	function handleCreateSchedule() {
		if (newScheduleName.trim()) {
			const schedule = scheduleStore.createSchedule(newScheduleName.trim());
			scheduleStore.setCurrentSchedule(schedule.id);
			newScheduleName = '';
			showNewScheduleForm = false;
		}
	}

	function handleDeleteSchedule(id, event) {
		event.stopPropagation();
		if (confirm('Diesen Zeitplan wirklich löschen?')) {
			scheduleStore.deleteSchedule(id);
		}
	}
</script>

<div class="class-selector">
	<div class="header">
		<h3>Zeitpläne</h3>
		<button
			class="btn btn-primary btn-sm"
			onclick={() => (showNewScheduleForm = !showNewScheduleForm)}
		>
			{showNewScheduleForm ? '✕' : '+ Neu'}
		</button>
	</div>

	{#if showNewScheduleForm}
		<div class="new-schedule-form">
			<input
				type="text"
				bind:value={newScheduleName}
				placeholder="z.B. Klasse 3a - Mathematik"
				class="input"
				onkeydown={(e) => e.key === 'Enter' && handleCreateSchedule()}
				autofocus
			/>
			<button class="btn btn-primary" onclick={handleCreateSchedule}>
				Erstellen
			</button>
		</div>
	{/if}

	<div class="schedules-list">
		{#if scheduleStore.schedules.length === 0}
			<div class="empty-state">
				<p>Noch keine Zeitpläne vorhanden.</p>
				<p>Erstellen Sie den ersten Zeitplan.</p>
			</div>
		{:else}
			{#each scheduleStore.schedules as schedule (schedule.id)}
				<div
					class="schedule-item"
					class:active={schedule.id === scheduleStore.currentScheduleId}
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
					<button
						class="btn-delete"
						onclick={(e) => handleDeleteSchedule(schedule.id, e)}
						title="Löschen"
					>
						🗑️
					</button>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.class-selector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
		background: var(--color-bg-dark);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h3 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--color-text);
	}

	.btn {
		padding: 0.625rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover {
		background: #0096e0;
		transform: translateY(-1px);
	}

	.new-schedule-form {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--color-bg-darker);
		border-radius: 6px;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.input {
		flex: 1;
		padding: 0.625rem;
		background: var(--color-bg-dark);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.schedules-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-secondary);
	}

	.empty-state p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
	}

	.schedule-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-bg-darker);
		border-radius: 6px;
		border: 2px solid rgba(255, 255, 255, 0.05);
		cursor: pointer;
		transition: all 0.2s;
	}

	.schedule-item:hover {
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateX(4px);
	}

	.schedule-item.active {
		border-color: var(--color-primary);
		background: rgba(0, 123, 192, 0.1);
	}

	.schedule-info {
		flex: 1;
		min-width: 0;
	}

	.schedule-name {
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.schedule-meta {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.btn-delete {
		padding: 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1.25rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.schedule-item:hover .btn-delete {
		opacity: 0.5;
	}

	.btn-delete:hover {
		opacity: 1 !important;
	}
</style>
