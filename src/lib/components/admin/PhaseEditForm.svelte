<script>
	let { phase, onSave, onCancel } = $props();

	let name = $state(phase.name);
	let duration = $state(phase.duration);
	let description = $state(phase.description || '');
	let tasks = $state(Array.isArray(phase.tasks) ? phase.tasks.join('\n') : '');
	let color = $state(phase.color);
	let icon = $state(phase.icon);

	function handleSubmit() {
		onSave({
			name: name.trim(),
			duration: parseInt(duration),
			description: description.trim(),
			tasks: tasks.split('\n').filter(t => t.trim()),
			color,
			icon
		});
	}
</script>

<div class="phase-edit-form">
	<h4>Phase bearbeiten</h4>

	<div class="form-row">
		<div class="form-group">
			<label for="edit-name">Name</label>
			<input
				id="edit-name"
				type="text"
				bind:value={name}
			/>
		</div>
		<div class="form-group">
			<label for="edit-duration">Dauer (Min.)</label>
			<input
				id="edit-duration"
				type="number"
				bind:value={duration}
				min="1"
				max="120"
			/>
		</div>
	</div>

	<div class="form-row">
		<div class="form-group">
			<label for="edit-icon">Icon</label>
			<input
				id="edit-icon"
				type="text"
				bind:value={icon}
				maxlength="2"
			/>
		</div>
		<div class="form-group">
			<label for="edit-color">Farbe</label>
			<input
				id="edit-color"
				type="color"
				bind:value={color}
			/>
		</div>
	</div>

	<div class="form-group">
		<label for="edit-description">Beschreibung / Regeln</label>
		<textarea
			id="edit-description"
			bind:value={description}
			rows="3"
		></textarea>
	</div>

	<div class="form-group">
		<label for="edit-tasks">Aufgaben (eine pro Zeile)</label>
		<textarea
			id="edit-tasks"
			bind:value={tasks}
			rows="4"
		></textarea>
	</div>

	<div class="form-actions">
		<button class="btn btn-primary" onclick={handleSubmit}>
			Speichern
		</button>
		<button class="btn btn-secondary" onclick={onCancel}>
			Abbrechen
		</button>
	</div>
</div>

<style>
	.phase-edit-form {
		padding: 1rem;
		background: var(--color-bg-darker);
		border-radius: 6px;
		border: 2px solid var(--color-primary);
	}

	h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		color: var(--color-text);
	}

	.form-group {
		margin-bottom: 0.75rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	label {
		display: block;
		margin-bottom: 0.25rem;
		color: var(--color-text-secondary);
		font-size: 0.75rem;
		font-weight: 500;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.5rem;
		background: var(--color-bg-dark);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: var(--color-text);
		font-size: 0.875rem;
		font-family: inherit;
	}

	textarea {
		resize: vertical;
		min-height: 60px;
	}

	input[type='color'] {
		height: 2.5rem;
		cursor: pointer;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover {
		background: #0096e0;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
