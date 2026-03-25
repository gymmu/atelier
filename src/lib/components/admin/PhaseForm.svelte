<script>
	import { PREDEFINED_PHASES, PHASE_TYPE } from '$lib/utils/constants.js';

	let {
		onAdd,
		onCancel = null
	} = $props();

	let phaseType = $state(PHASE_TYPE.PREDEFINED);
	let selectedPredefined = $state(PREDEFINED_PHASES[0]);
	let customName = $state('');
	let customColor = $state('#007BC0');
	let customIcon = $state('📋');
	let duration = $state(PREDEFINED_PHASES[0].defaultDuration);
	let description = $state(PREDEFINED_PHASES[0].defaultDescription);
	let tasks = $state(PREDEFINED_PHASES[0].defaultTasks.join('\n'));

	function handleSubmit() {
		const phase = {
			type: phaseType,
			name: phaseType === PHASE_TYPE.PREDEFINED ? selectedPredefined.name : customName,
			color: phaseType === PHASE_TYPE.PREDEFINED ? selectedPredefined.color : customColor,
			icon: phaseType === PHASE_TYPE.PREDEFINED ? selectedPredefined.icon : customIcon,
			duration: duration,
			description: description.trim(),
			tasks: tasks.split('\n').filter(t => t.trim())
		};

		onAdd(phase);
		resetForm();
	}

	function resetForm() {
		phaseType = PHASE_TYPE.PREDEFINED;
		selectedPredefined = PREDEFINED_PHASES[0];
		customName = '';
		customColor = '#007BC0';
		customIcon = '📋';
		duration = PREDEFINED_PHASES[0].defaultDuration;
		description = PREDEFINED_PHASES[0].defaultDescription;
		tasks = PREDEFINED_PHASES[0].defaultTasks.join('\n');
	}

	function handlePredefinedChange(event) {
		const phaseName = event.target.value;
		selectedPredefined = PREDEFINED_PHASES.find((p) => p.name === phaseName);
		duration = selectedPredefined.defaultDuration;
		// Fülle Beschreibung und Aufgaben automatisch aus
		description = selectedPredefined.defaultDescription;
		tasks = selectedPredefined.defaultTasks.join('\n');
	}

	// Wenn der Phasentyp gewechselt wird
	$effect(() => {
		if (phaseType === PHASE_TYPE.CUSTOM) {
			// Leere Felder für Custom
			description = '';
			tasks = '';
		} else {
			// Fülle mit aktuell ausgewählter vordefinierter Phase
			description = selectedPredefined.defaultDescription;
			tasks = selectedPredefined.defaultTasks.join('\n');
		}
	});
</script>

<div class="phase-form">
	<h3>Phase hinzufügen</h3>

	<div class="form-group">
		<label>
			<input
				type="radio"
				value={PHASE_TYPE.PREDEFINED}
				bind:group={phaseType}
			/>
			Vordefinierte Phase
		</label>
		<label>
			<input
				type="radio"
				value={PHASE_TYPE.CUSTOM}
				bind:group={phaseType}
			/>
			Benutzerdefiniert
		</label>
	</div>

	{#if phaseType === PHASE_TYPE.PREDEFINED}
		<div class="form-group">
			<label for="predefined-select">Phasentyp</label>
			<select
				id="predefined-select"
				value={selectedPredefined.name}
				onchange={handlePredefinedChange}
			>
				{#each PREDEFINED_PHASES as phase}
					<option value={phase.name}>
						{phase.icon} {phase.name}
					</option>
				{/each}
			</select>
		</div>
	{:else}
		<div class="form-group">
			<label for="custom-name">Name</label>
			<input
				id="custom-name"
				type="text"
				bind:value={customName}
				placeholder="z.B. Gruppenarbeit"
			/>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="custom-icon">Icon</label>
				<input
					id="custom-icon"
					type="text"
					bind:value={customIcon}
					placeholder="📋"
					maxlength="2"
				/>
			</div>

			<div class="form-group">
				<label for="custom-color">Farbe</label>
				<input
					id="custom-color"
					type="color"
					bind:value={customColor}
				/>
			</div>
		</div>
	{/if}

	<div class="form-group">
		<label for="duration">Dauer (Minuten)</label>
		<input
			id="duration"
			type="number"
			bind:value={duration}
			min="1"
			max="120"
		/>
	</div>

	<div class="form-group">
		<label for="description">Beschreibung / Regeln</label>
		<textarea
			id="description"
			bind:value={description}
			placeholder="Beschreibung der Phase und wichtige Regeln..."
			rows="3"
		></textarea>
	</div>

	<div class="form-group">
		<label for="tasks">Aufgaben (eine pro Zeile)</label>
		<textarea
			id="tasks"
			bind:value={tasks}
			placeholder="Aufgabe 1&#10;Aufgabe 2&#10;Aufgabe 3"
			rows="4"
		></textarea>
	</div>

	<div class="form-actions">
		<button class="btn btn-primary" onclick={handleSubmit}>
			Hinzufügen
		</button>
		{#if onCancel}
			<button class="btn btn-secondary" onclick={onCancel}>
				Abbrechen
			</button>
		{/if}
	</div>
</div>

<style>
	.phase-form {
		background: var(--color-bg-dark);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: var(--color-text);
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
	}

	label input[type='radio'] {
		margin-right: 0.5rem;
	}

	input[type='text'],
	input[type='number'],
	input[type='color'],
	select,
	textarea {
		width: 100%;
		padding: 0.5rem;
		background: var(--color-bg-darker);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: var(--color-text);
		font-size: 1rem;
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
	select:focus,
	textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}

	.btn {
		padding: 0.625rem 1.25rem;
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
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
