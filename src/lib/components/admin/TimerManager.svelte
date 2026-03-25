<script>
	import { timersStore } from '$lib/stores/timers.svelte.js';
	import { onMount, onDestroy } from 'svelte';
	import Timer from '../shared/Timer.svelte';

	let studentName = $state('');
	let task = $state('');
	let duration = $state(15);

	onMount(() => {
		timersStore.startInterval();
	});

	onDestroy(() => {
		timersStore.stopInterval();
	});

	function handleAddTimer() {
		if (studentName.trim() && task.trim() && duration > 0) {
			timersStore.addTimer(studentName.trim(), task.trim(), duration);
			studentName = '';
			task = '';
			duration = 15;
		}
	}

	function handleDelete(id) {
		timersStore.deleteTimer(id);
	}

	function handlePause(id) {
		const timer = timersStore.timers.find((t) => t.id === id);
		if (timer.isPaused) {
			timersStore.resumeTimer(id);
		} else {
			timersStore.pauseTimer(id);
		}
	}

	function handleClearCompleted() {
		if (confirm('Alle abgeschlossenen Timer löschen?')) {
			timersStore.clearCompletedTimers();
		}
	}
</script>

<div class="timer-manager">
	<div class="header">
		<h3>Schüler-Timer</h3>
		{#if timersStore.completedTimers.length > 0}
			<button class="btn btn-sm" onclick={handleClearCompleted}>
				Abgeschlossene löschen
			</button>
		{/if}
	</div>

	<div class="add-timer-form">
		<input
			type="text"
			bind:value={studentName}
			placeholder="Name des Schülers"
			class="input"
		/>
		<input
			type="text"
			bind:value={task}
			placeholder="Aufgabe"
			class="input"
		/>
		<div class="duration-input">
			<input
				type="number"
				bind:value={duration}
				min="1"
				max="120"
				class="input"
			/>
			<span>Min.</span>
		</div>
		<button class="btn btn-primary" onclick={handleAddTimer}>
			Timer hinzufügen
		</button>
	</div>

	<div class="timers-list">
		{#if timersStore.timers.length === 0}
			<div class="empty-state">
				<p>Keine aktiven Timer</p>
			</div>
		{:else}
			{#each timersStore.timers as timer (timer.id)}
				{@const remaining = timersStore.getRemainingTime(timer.id)}
				<div class="timer-item" class:completed={remaining <= 0}>
					<div class="timer-info">
						<div class="student-name">{timer.studentName}</div>
						<div class="task-name">{timer.task}</div>
					</div>
					<div class="timer-display">
						<Timer
							startTime={timer.startTime}
							duration={timer.duration}
							isPaused={timer.isPaused}
							pausedAt={timer.pausedAt}
							size="small"
						/>
					</div>
					<div class="timer-actions">
						<button
							class="btn-icon"
							onclick={() => handlePause(timer.id)}
							title={timer.isPaused ? 'Fortsetzen' : 'Pausieren'}
						>
							{timer.isPaused ? '▶️' : '⏸️'}
						</button>
						<button
							class="btn-icon"
							onclick={() => handleDelete(timer.id)}
							title="Löschen"
						>
							🗑️
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.timer-manager {
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

	.add-timer-form {
		display: grid;
		gap: 0.5rem;
	}

	.input {
		width: 100%;
		padding: 0.625rem;
		background: var(--color-bg-darker);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.duration-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.duration-input span {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
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
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
	}

	.btn-sm:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover {
		background: #0096e0;
		transform: translateY(-1px);
	}

	.timers-list {
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

	.timer-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-bg-darker);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.05);
		transition: all 0.2s;
	}

	.timer-item:hover {
		border-color: rgba(255, 255, 255, 0.2);
	}

	.timer-item.completed {
		background: rgba(244, 67, 54, 0.1);
		border-color: rgba(244, 67, 54, 0.3);
	}

	.timer-info {
		flex: 1;
		min-width: 0;
	}

	.student-name {
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.task-name {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.timer-display {
		flex-shrink: 0;
	}

	.timer-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.btn-icon {
		padding: 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1.25rem;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.btn-icon:hover {
		opacity: 1;
	}
</style>
