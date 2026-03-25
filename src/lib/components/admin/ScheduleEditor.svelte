<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import PhaseForm from './PhaseForm.svelte';
	import PhaseEditForm from './PhaseEditForm.svelte';
	import PhaseIcon from '../shared/PhaseIcon.svelte';

	let { schedule } = $props();

	let editingName = $state(false);
	let newName = $state(schedule.name);
	let editingPhaseId = $state(null);
	let editingStartTime = $state(false);
	let newStartTime = $state(schedule.startTime || '08:00');

	function handleAddPhase(phase) {
		scheduleStore.addPhase(schedule.id, phase);
	}

	function handleDeletePhase(phaseId) {
		if (confirm('Diese Phase wirklich löschen?')) {
			scheduleStore.deletePhase(schedule.id, phaseId);
		}
	}

	function handleEditPhase(phaseId) {
		editingPhaseId = phaseId;
	}

	function handleUpdatePhase(phaseId, updates) {
		scheduleStore.updatePhase(schedule.id, phaseId, updates);
		editingPhaseId = null;
	}

	function handleCancelEdit() {
		editingPhaseId = null;
	}

	function handleSaveName() {
		if (newName.trim()) {
			scheduleStore.updateSchedule(schedule.id, { name: newName.trim() });
			editingName = false;
		}
	}

	function handleSaveStartTime() {
		if (newStartTime) {
			scheduleStore.updateSchedule(schedule.id, { startTime: newStartTime });
			editingStartTime = false;
		}
	}

	// Berechne Endzeit basierend auf Startzeit und Phasen
	let calculatedEndTime = $derived.by(() => {
		if (!schedule.startTime || !schedule.phases.length) return null;
		const [hours, minutes] = schedule.startTime.split(':').map(Number);
		const startDate = new Date();
		startDate.setHours(hours, minutes, 0, 0);
		
		const totalMinutes = schedule.phases.reduce((sum, p) => sum + p.duration, 0);
		const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);
		
		return endDate.toLocaleTimeString('de-CH', {
			hour: '2-digit',
			minute: '2-digit'
		});
	});

	function handleDragStart(event, index) {
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', index.toString());
	}

	function handleDragOver(event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}

	function handleDrop(event, toIndex) {
		event.preventDefault();
		const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
		if (fromIndex !== toIndex) {
			scheduleStore.movePhase(schedule.id, fromIndex, toIndex);
		}
	}
</script>

<div class="schedule-editor">
	<div class="header">
		<div class="header-row">
			{#if editingName}
				<input
					type="text"
					bind:value={newName}
					onblur={handleSaveName}
					onkeydown={(e) => e.key === 'Enter' && handleSaveName()}
					class="name-input"
					autofocus
				/>
			{:else}
				<h2 onclick={() => (editingName = true)} class="schedule-name">
					{schedule.name}
					<span class="edit-hint">✏️</span>
				</h2>
			{/if}
		</div>

		<div class="time-settings">
			<div class="time-field">
				<label>Lektionsbeginn</label>
				{#if editingStartTime}
					<input
						type="time"
						bind:value={newStartTime}
						onblur={handleSaveStartTime}
						onkeydown={(e) => e.key === 'Enter' && handleSaveStartTime()}
						class="time-input"
						step="60"
						pattern="[0-9]{2}:[0-9]{2}"
						autofocus
					/>
				{:else}
					<div class="time-display" onclick={() => (editingStartTime = true)}>
						<span class="time-value">{schedule.startTime || '08:00'}</span>
						<span class="edit-hint-small">✏️</span>
					</div>
				{/if}
			</div>
			{#if calculatedEndTime}
				<div class="time-field">
					<label>Lektionsende</label>
					<div class="time-display readonly">
						<span class="time-value">{calculatedEndTime}</span>
					</div>
				</div>
				<div class="time-field">
					<label>Gesamtdauer</label>
					<div class="time-display readonly">
						<span class="time-value">{schedule.phases.reduce((sum, p) => sum + p.duration, 0)} Min.</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="phases-list">
		<h3>Phasen ({schedule.phases.length})</h3>
		
		{#if schedule.phases.length === 0}
			<div class="empty-state">
				<p>Noch keine Phasen vorhanden.</p>
				<p>Fügen Sie unten die erste Phase hinzu.</p>
			</div>
		{:else}
			<div class="phases">
				{#each schedule.phases as phase, index (phase.id)}
					{#if editingPhaseId === phase.id}
						<div class="phase-edit-form">
							<PhaseEditForm
								phase={phase}
								onSave={(updates) => handleUpdatePhase(phase.id, updates)}
								onCancel={handleCancelEdit}
							/>
						</div>
					{:else}
						<div
							class="phase-item"
							draggable="true"
							ondragstart={(e) => handleDragStart(e, index)}
							ondragover={handleDragOver}
							ondrop={(e) => handleDrop(e, index)}
						>
							<div class="phase-handle">
								<span>⋮⋮</span>
							</div>
							<PhaseIcon phaseName={phase.name} size="small" />
							<div class="phase-info">
								<div class="phase-name">{phase.name}</div>
								<div class="phase-duration">{phase.duration} Min.</div>
								{#if phase.description}
									<div class="phase-description">{phase.description}</div>
								{/if}
							</div>
							<div class="phase-actions">
								<button
									class="btn-icon btn-edit"
									onclick={() => handleEditPhase(phase.id)}
									title="Phase bearbeiten"
								>
									✏️
								</button>
								<button
									class="btn-icon btn-delete"
									onclick={() => handleDeletePhase(phase.id)}
									title="Phase löschen"
								>
									🗑️
								</button>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<div class="total-duration">
				<strong>Gesamtdauer:</strong>
				{schedule.phases.reduce((sum, p) => sum + p.duration, 0)} Minuten
			</div>
		{/if}
	</div>

	<div class="add-phase-section">
		<PhaseForm onAdd={handleAddPhase} />
	</div>
</div>

<style>
	.schedule-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 100%;
	}

	.header {
		padding: 1.5rem;
		background: var(--color-bg-dark);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.header-row {
		width: 100%;
	}

	.schedule-name {
		margin: 0;
		font-size: 1.75rem;
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.edit-hint {
		font-size: 1rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.schedule-name:hover .edit-hint {
		opacity: 1;
	}

	.name-input {
		width: 100%;
		padding: 0.5rem;
		font-size: 1.75rem;
		font-weight: 700;
		background: var(--color-bg-darker);
		border: 2px solid var(--color-primary);
		border-radius: 4px;
		color: var(--color-text);
	}

	.name-input:focus {
		outline: none;
	}

	.time-settings {
		display: flex;
		gap: 1.5rem;
		align-items: flex-end;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.time-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.time-field label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary);
		font-weight: 600;
	}

	.time-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-bg-darker);
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		cursor: pointer;
		transition: all 0.2s;
	}

	.time-display:hover:not(.readonly) {
		border-color: var(--color-primary);
	}

	.time-display.readonly {
		cursor: default;
		background: rgba(255, 255, 255, 0.03);
	}

	.time-value {
		font-family: 'Courier New', monospace;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.edit-hint-small {
		font-size: 0.875rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.time-display:hover .edit-hint-small {
		opacity: 1;
	}

	.time-input {
		padding: 0.5rem 0.75rem;
		font-family: 'Courier New', monospace;
		font-size: 1.25rem;
		font-weight: 700;
		background: var(--color-bg-darker);
		border: 2px solid var(--color-primary);
		border-radius: 4px;
		color: var(--color-text);
	}

	.time-input:focus {
		outline: none;
	}

	.phases-list {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: var(--color-bg-dark);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: var(--color-text);
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-secondary);
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.phases {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.phase-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-bg-darker);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.05);
		cursor: move;
		transition: all 0.2s;
	}

	.phase-item:hover {
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateX(4px);
	}

	.phase-handle {
		color: var(--color-text-secondary);
		cursor: grab;
		user-select: none;
	}

	.phase-handle:active {
		cursor: grabbing;
	}

	.phase-info {
		flex: 1;
	}

	.phase-name {
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	.phase-duration {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.phase-description {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		margin-top: 0.25rem;
		font-style: italic;
	}

	.phase-actions {
		display: flex;
		gap: 0.25rem;
	}

	.btn-icon {
		padding: 0.375rem 0.625rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.25rem;
		opacity: 0.8;
		transition: all 0.2s;
	}

	.btn-icon:hover {
		opacity: 1;
		transform: translateY(-1px);
	}

	.btn-edit {
		background: rgba(0, 123, 192, 0.15);
		border-color: rgba(0, 123, 192, 0.3);
	}

	.btn-edit:hover {
		background: rgba(0, 123, 192, 0.25);
		border-color: var(--color-primary);
	}

	.btn-delete {
		background: rgba(244, 67, 54, 0.15);
		border-color: rgba(244, 67, 54, 0.3);
	}

	.btn-delete:hover {
		background: rgba(244, 67, 54, 0.25);
		border-color: #f44336;
	}

	.phase-edit-form {
		margin-bottom: 0.5rem;
	}

	.total-duration {
		margin-top: 1rem;
		padding: 0.75rem;
		background: rgba(0, 123, 192, 0.1);
		border-radius: 4px;
		color: var(--color-text);
		text-align: center;
	}

	.add-phase-section {
		margin-top: auto;
	}
</style>
