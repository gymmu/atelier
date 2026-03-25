<script>
	import { timersStore } from '$lib/stores/timers.svelte.js';
	import { onMount, onDestroy } from 'svelte';
	import Timer from '../shared/Timer.svelte';

	let studentName = $state('');
	let task = $state('');
	let duration = $state(15);
	let showForm = $state(false);

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
			showForm = false;
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

<div class="timer-control">
	<div class="header">
		<h3>Schüler-Timer</h3>
		<div class="header-actions">
			{#if timersStore.completedTimers.length > 0}
				<button class="btn btn-sm" onclick={handleClearCompleted}>
					Abgeschlossene löschen
				</button>
			{/if}
			<button class="btn btn-primary" onclick={() => (showForm = !showForm)}>
				{showForm ? '✕ Schliessen' : '+ Timer hinzufügen'}
			</button>
		</div>
	</div>

	{#if showForm}
		<div class="add-timer-form">
			<div class="form-row">
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
			</div>
			<div class="form-row-submit">
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
				<button class="btn btn-success" onclick={handleAddTimer}>
					✓ Hinzufügen
				</button>
			</div>
		</div>
	{/if}

	<div class="timers-grid">
		{#if timersStore.timers.length === 0}
			<div class="empty-state">
				<p>Keine aktiven Timer</p>
			</div>
		{:else}
			{#each timersStore.timers as timer (timer.id)}
				{@const remaining = timersStore.getRemainingTime(timer.id)}
				<div class="timer-card" class:completed={remaining <= 0}>
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
					{#if timer.isPaused}
						<div class="paused-badge">⏸️ Pausiert</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.timer-control {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
		background: var(--color-bg-darker);
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	h3 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.add-timer-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-bg-dark);
		border-radius: 8px;
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

	.form-row {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 0.75rem;
	}

	.form-row-submit {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.input {
		padding: 0.75rem;
		background: var(--color-bg-darker);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: var(--color-text);
		font-size: 1rem;
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

	.duration-input input {
		width: 80px;
	}

	.duration-input span {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.btn {
		padding: 0.75rem 1.25rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn-sm {
		padding: 0.5rem 1rem;
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
	}

	.btn-success {
		background: #4caf50;
		color: white;
		flex: 1;
	}

	.btn-success:hover {
		background: #45a049;
	}

	.timers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
		max-height: 600px;
		overflow-y: auto;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--color-text-secondary);
		grid-column: 1 / -1;
	}

	.empty-state p {
		margin: 0;
		font-size: 1.125rem;
	}

	.timer-card {
		padding: 1.25rem;
		background: var(--color-bg-dark);
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.05);
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.timer-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.timer-card.completed {
		background: rgba(244, 67, 54, 0.1);
		border-color: rgba(244, 67, 54, 0.3);
	}

	.timer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
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
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.timer-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.btn-icon {
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.25rem;
		opacity: 0.7;
		transition: all 0.2s;
	}

	.btn-icon:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.15);
	}

	.paused-badge {
		padding: 0.25rem 0.75rem;
		background: rgba(255, 152, 0, 0.2);
		border: 1px solid #ff9800;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		color: #ff9800;
		text-align: center;
	}

	@media (max-width: 1024px) {
		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-actions {
			width: 100%;
		}

		.btn {
			flex: 1;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.timers-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
