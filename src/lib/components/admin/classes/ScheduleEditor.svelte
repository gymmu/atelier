<script>
	import { classesStore } from '$lib/stores/classes.svelte.js';

	let { classItem } = $props();

	let showAddForm = $state(false);
	let newSlot = $state({
		weekday: 'montag',
		startTime: '08:00',
		endTime: '09:00',
		subject: ''
	});

	const weekdays = [
		{ value: 'montag', label: 'Montag' },
		{ value: 'dienstag', label: 'Dienstag' },
		{ value: 'mittwoch', label: 'Mittwoch' },
		{ value: 'donnerstag', label: 'Donnerstag' },
		{ value: 'freitag', label: 'Freitag' },
		{ value: 'samstag', label: 'Samstag' },
		{ value: 'sonntag', label: 'Sonntag' }
	];

	// Group schedule by weekday
	let scheduleByDay = $derived.by(() => {
		const schedule = classItem.schedule || [];
		const grouped = {};
		
		weekdays.forEach(day => {
			grouped[day.value] = schedule
				.filter(slot => slot.weekday === day.value)
				.sort((a, b) => a.startTime.localeCompare(b.startTime));
		});
		
		return grouped;
	});

	async function handleAddSlot() {
		await classesStore.addScheduleSlot(classItem.id, newSlot);
		
		// Reset form
		newSlot = {
			weekday: 'montag',
			startTime: '08:00',
			endTime: '09:00',
			subject: ''
		};
		showAddForm = false;
	}

	async function handleDeleteSlot(slotId) {
		if (confirm('Diesen Zeitslot wirklich löschen?')) {
			await classesStore.removeScheduleSlot(classItem.id, slotId);
		}
	}

	function getWeekdayLabel(value) {
		return weekdays.find(d => d.value === value)?.label || value;
	}
</script>

<div class="schedule-editor">
	<div class="section-header">
		<h3>Wochenstundenplan</h3>
		<button
			class="btn btn-primary"
			onclick={() => showAddForm = !showAddForm}
		>
			{showAddForm ? '✕ Abbrechen' : '+ Zeitslot hinzufügen'}
		</button>
	</div>

	{#if showAddForm}
		<div class="add-form">
			<div class="form-row">
				<div class="form-group">
					<label for="weekday">Wochentag</label>
					<select id="weekday" bind:value={newSlot.weekday}>
						{#each weekdays as day (day.value)}
							<option value={day.value}>{day.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="startTime">Von</label>
					<input id="startTime" type="time" bind:value={newSlot.startTime} />
				</div>

				<div class="form-group">
					<label for="endTime">Bis</label>
					<input id="endTime" type="time" bind:value={newSlot.endTime} />
				</div>
			</div>

			<div class="form-group">
				<label for="subject">Fach (optional)</label>
				<input
					id="subject"
					type="text"
					bind:value={newSlot.subject}
					placeholder="z.B. Mathematik"
				/>
			</div>

			<button class="btn btn-success" onclick={handleAddSlot}>
				✓ Hinzufügen
			</button>
		</div>
	{/if}

	<div class="schedule-grid">
		{#each weekdays as day (day.value)}
			<div class="day-column">
				<div class="day-header">
					<h4>{day.label}</h4>
					<span class="slot-count">
						{scheduleByDay[day.value].length} {scheduleByDay[day.value].length === 1 ? 'Stunde' : 'Stunden'}
					</span>
				</div>

				<div class="day-slots">
					{#if scheduleByDay[day.value].length === 0}
						<div class="empty-day">Keine Stunden</div>
					{:else}
						{#each scheduleByDay[day.value] as slot (slot.id)}
							<div class="time-slot">
								<div class="slot-time">
									{slot.startTime} - {slot.endTime}
								</div>
								{#if slot.subject}
									<div class="slot-subject">{slot.subject}</div>
								{/if}
								<button
									class="btn-delete-slot"
									onclick={() => handleDeleteSlot(slot.id)}
									title="Löschen"
								>
									✕
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.schedule-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #e6edf3;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #1f6feb;
		color: white;
	}

	.btn-primary:hover {
		background: #388bfd;
	}

	.btn-success {
		background: #238636;
		color: white;
		width: 100%;
	}

	.btn-success:hover {
		background: #2ea043;
	}

	/* Add Form */
	.add-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #e6edf3;
	}

	.form-group input,
	.form-group select {
		padding: 0.5rem 0.75rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		font-size: 0.875rem;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #1f6feb;
	}

	/* Schedule Grid */
	.schedule-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.day-column {
		display: flex;
		flex-direction: column;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		overflow: hidden;
	}

	.day-header {
		padding: 0.75rem;
		background: #0d1117;
		border-bottom: 1px solid #30363d;
	}

	.day-header h4 {
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #e6edf3;
	}

	.slot-count {
		font-size: 0.75rem;
		color: #8b949e;
	}

	.day-slots {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
	}

	.empty-day {
		text-align: center;
		padding: 1rem;
		color: #8b949e;
		font-size: 0.75rem;
	}

	.time-slot {
		position: relative;
		padding: 0.75rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.time-slot:hover {
		border-color: #484f58;
	}

	.time-slot:hover .btn-delete-slot {
		opacity: 1;
	}

	.slot-time {
		font-size: 0.875rem;
		font-weight: 600;
		color: #e6edf3;
		margin-bottom: 0.25rem;
	}

	.slot-subject {
		font-size: 0.75rem;
		color: #8b949e;
	}

	.btn-delete-slot {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.125rem 0.375rem;
		background: transparent;
		border: 1px solid #30363d;
		border-radius: 3px;
		color: #8b949e;
		font-size: 0.75rem;
		cursor: pointer;
		opacity: 0;
		transition: all 0.2s;
	}

	.btn-delete-slot:hover {
		background: #da3633;
		border-color: #da3633;
		color: white;
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.schedule-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 768px) {
		.schedule-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
