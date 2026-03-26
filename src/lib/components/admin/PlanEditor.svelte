<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { plansAPI } from '$lib/api/plans.js';
	import MonacoEditor from '$lib/components/shared/MonacoEditor.svelte';
	import { planToMarkdown, markdownToPlan, validatePlan } from '$lib/utils/markdown-converter.js';

	let {
		planData = null,
		isOpen = $bindable(false),
		onSave = () => {}
	} = $props();

	// Edit mode: 'ui', 'json', or 'markdown'
	let editMode = $state('ui');

	// UI mode data (working copy)
	let uiPlan = $state(null);

	// JSON mode
	let jsonContent = $state('');

	// Markdown mode
	let markdownContent = $state('');
	let validationErrors = $state([]);

	// Initialize when planData changes
	$effect(() => {
		if (isOpen && planData) {
			uiPlan = JSON.parse(JSON.stringify(planData)); // Deep clone
			jsonContent = JSON.stringify(planData, null, 2);
			markdownContent = planToMarkdown(planData);
			validationErrors = [];
		} else if (isOpen && !planData) {
			// New plan
			uiPlan = {
				id: `plan-${Date.now()}`,
				name: 'Neuer Plan',
				classId: null,
				startTime: '08:00',
				phases: [],
				createdAt: Date.now(),
				updatedAt: Date.now()
			};
			jsonContent = JSON.stringify(uiPlan, null, 2);
			markdownContent = planToMarkdown(uiPlan);
			validationErrors = [];
		}
	});

	function handleClose() {
		isOpen = false;
	}

	async function handleSave() {
		try {
			let planToSave;

			if (editMode === 'ui') {
				planToSave = { ...uiPlan, updatedAt: Date.now() };
			} else if (editMode === 'json') {
				// Parse from JSON
				try {
					planToSave = JSON.parse(jsonContent);
					planToSave.updatedAt = Date.now();

					// Validate
					const validation = validatePlan(planToSave);
					if (!validation.valid) {
						validationErrors = validation.errors;
						return;
					}
				} catch (err) {
					validationErrors = ['JSON Parse-Fehler: ' + err.message];
					return;
				}
			} else {
				// Parse from markdown
				planToSave = markdownToPlan(markdownContent);
				planToSave.updatedAt = Date.now();

				// Validate
				const validation = validatePlan(planToSave);
				if (!validation.valid) {
					validationErrors = validation.errors;
					return;
				}
			}

			// Save JSON version
			await plansAPI.save(planToSave);

			// Save Markdown version
			const markdown = planToMarkdown(planToSave);
			const { content, data } = await import('gray-matter').then((m) => m.default(markdown));
			await plansAPI.saveMarkdown(planToSave.id, content, data);

			// Reload schedules in store
			await scheduleStore.loadSchedules();

			onSave(planToSave);
			handleClose();
		} catch (error) {
			console.error('Error saving plan:', error);
			validationErrors = ['Fehler beim Speichern: ' + error.message];
		}
	}

	function switchMode(mode) {
		// From UI mode
		if (editMode === 'ui') {
			if (mode === 'json') {
				jsonContent = JSON.stringify(uiPlan, null, 2);
				validationErrors = [];
			} else if (mode === 'markdown') {
				markdownContent = planToMarkdown(uiPlan);
				validationErrors = [];
			}
		}
		// From JSON mode
		else if (editMode === 'json') {
			try {
				const parsed = JSON.parse(jsonContent);
				const validation = validatePlan(parsed);

				if (!validation.valid) {
					validationErrors = validation.errors;
					return;
				}

				uiPlan = parsed;
				validationErrors = [];

				if (mode === 'markdown') {
					markdownContent = planToMarkdown(uiPlan);
				}
			} catch (err) {
				validationErrors = ['JSON Parse-Fehler: ' + err.message];
				return;
			}
		}
		// From Markdown mode
		else if (editMode === 'markdown') {
			try {
				const parsed = markdownToPlan(markdownContent);
				const validation = validatePlan(parsed);

				if (!validation.valid) {
					validationErrors = validation.errors;
					return;
				}

				uiPlan = parsed;
				validationErrors = [];

				if (mode === 'json') {
					jsonContent = JSON.stringify(uiPlan, null, 2);
				}
			} catch (err) {
				validationErrors = ['Fehler beim Parsen: ' + err.message];
				return;
			}
		}
		
		editMode = mode;
	}

	function handleMarkdownChange(content) {
		markdownContent = content;
		// Try to validate
		try {
			const parsed = markdownToPlan(content);
			const validation = validatePlan(parsed);
			validationErrors = validation.valid ? [] : validation.errors;
		} catch (err) {
			validationErrors = ['Parse-Fehler: ' + err.message];
		}
	}

	function handleJsonChange(content) {
		jsonContent = content;
		// Try to validate
		try {
			const parsed = JSON.parse(content);
			const validation = validatePlan(parsed);
			validationErrors = validation.valid ? [] : validation.errors;
		} catch (err) {
			validationErrors = ['JSON Parse-Fehler: ' + err.message];
		}
	}

	// UI mode functions
	function addPhase() {
		uiPlan.phases = [
			...uiPlan.phases,
			{
				id: `phase-${Date.now()}`,
				name: 'Neue Phase',
				duration: 300,
				type: 'custom',
				icon: '📝',
				color: '#007BC0',
				description: ''
			}
		];
	}

	function removePhase(index) {
		uiPlan.phases = uiPlan.phases.filter((_, i) => i !== index);
	}

	function movePhase(index, direction) {
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= uiPlan.phases.length) return;

		const phases = [...uiPlan.phases];
		[phases[index], phases[newIndex]] = [phases[newIndex], phases[index]];
		uiPlan.phases = phases;
	}
</script>

{#if isOpen}
	<div class="modal-overlay" onclick={handleClose}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>{planData ? 'Plan bearbeiten' : 'Neuer Plan'}</h2>
				<button class="close-btn" onclick={handleClose}>✕</button>
			</div>

			<div class="mode-toggle">
				<button
					class="mode-btn"
					class:active={editMode === 'ui'}
					onclick={() => switchMode('ui')}
				>
					📝 UI-Editor
				</button>
				<button
					class="mode-btn"
					class:active={editMode === 'json'}
					onclick={() => switchMode('json')}
				>
					{"{ }"} JSON
				</button>
				<button
					class="mode-btn"
					class:active={editMode === 'markdown'}
					onclick={() => switchMode('markdown')}
				>
					📄 Markdown
				</button>
			</div>

			<div class="modal-body">
				{#if editMode === 'ui' && uiPlan}
					<div class="ui-editor">
						<div class="form-group">
							<label for="plan-name">Plan-Name *</label>
							<input id="plan-name" type="text" bind:value={uiPlan.name} />
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="start-time">Startzeit</label>
								<input id="start-time" type="time" bind:value={uiPlan.startTime} />
							</div>
						</div>

						<div class="phases-section">
							<div class="section-header">
								<h3>Phasen ({uiPlan.phases.length})</h3>
								<button class="btn-add" onclick={addPhase}>+ Phase hinzufügen</button>
							</div>

							{#if uiPlan.phases.length === 0}
								<div class="empty-state">
									<p>Noch keine Phasen. Klicke auf "+ Phase hinzufügen"</p>
								</div>
							{:else}
								<div class="phases-list">
									{#each uiPlan.phases as phase, index}
										<div class="phase-item">
											<div class="phase-controls">
												<button
													class="btn-icon"
													onclick={() => movePhase(index, 'up')}
													disabled={index === 0}
												>
													↑
												</button>
												<button
													class="btn-icon"
													onclick={() => movePhase(index, 'down')}
													disabled={index === uiPlan.phases.length - 1}
												>
													↓
												</button>
												<button class="btn-icon btn-remove" onclick={() => removePhase(index)}>
													🗑️
												</button>
											</div>

											<div class="phase-fields">
												<input
													type="text"
													placeholder="Phasenname"
													bind:value={phase.name}
													class="phase-name"
												/>
												<div class="phase-meta">
													<input
														type="number"
														placeholder="Dauer (Sek)"
														bind:value={phase.duration}
														min="1"
														class="phase-duration"
													/>
													<input
														type="text"
														placeholder="Icon"
														bind:value={phase.icon}
														class="phase-icon"
													/>
													<input
														type="color"
														bind:value={phase.color}
														class="phase-color"
													/>
												</div>
												<textarea
													placeholder="Beschreibung (optional)"
													bind:value={phase.description}
													class="phase-description"
													rows="2"
												></textarea>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{:else if editMode === 'json'}
					<div class="json-editor">
						<MonacoEditor
							bind:value={jsonContent}
							language="json"
							onChange={handleJsonChange}
						/>
						{#if validationErrors.length > 0}
							<div class="validation-errors">
								<strong>Validierungsfehler:</strong>
								<ul>
									{#each validationErrors as error}
										<li>{error}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{:else if editMode === 'markdown'}
					<div class="markdown-editor">
						<MonacoEditor
							bind:value={markdownContent}
							language="markdown"
							onChange={handleMarkdownChange}
						/>
						{#if validationErrors.length > 0}
							<div class="validation-errors">
								<strong>Validierungsfehler:</strong>
								<ul>
									{#each validationErrors as error}
										<li>{error}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn btn-secondary" onclick={handleClose}>Abbrechen</button>
				<button
					class="btn btn-primary"
					onclick={handleSave}
					disabled={validationErrors.length > 0}
				>
					Speichern
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.modal {
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 12px;
		width: 95%;
		max-width: 900px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #30363d;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #e6edf3;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #8b949e;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #e6edf3;
	}

	.mode-toggle {
		display: flex;
		gap: 0.5rem;
		padding: 1rem 1.5rem 0;
		border-bottom: 1px solid #30363d;
	}

	.mode-btn {
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		color: #8b949e;
		cursor: pointer;
		font-size: 0.9rem;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}

	.mode-btn:hover {
		color: #e6edf3;
	}

	.mode-btn.active {
		color: #007bc0;
		border-bottom-color: #007bc0;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	/* UI Editor Styles */
	.ui-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.9rem;
		color: #8b949e;
		font-weight: 500;
	}

	.form-group input,
	.form-group select {
		padding: 0.75rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #007bc0;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.phases-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-header h3 {
		margin: 0;
		color: #e6edf3;
		font-size: 1.2rem;
	}

	.btn-add {
		padding: 0.5rem 1rem;
		background: #007bc0;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-add:hover {
		background: #0069a3;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: #8b949e;
		background: #0d1117;
		border: 1px dashed #30363d;
		border-radius: 6px;
	}

	.phases-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.phase-item {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 6px;
	}

	.phase-controls {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.btn-icon {
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: #21262d;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-icon:hover:not(:disabled) {
		background: #30363d;
	}

	.btn-icon:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.btn-icon.btn-remove {
		margin-top: auto;
	}

	.btn-icon.btn-remove:hover {
		background: #da3633;
		border-color: #da3633;
	}

	.phase-fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.phase-name {
		padding: 0.5rem;
		background: #010409;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 1rem;
		font-weight: 500;
	}

	.phase-meta {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.5rem;
	}

	.phase-duration,
	.phase-icon {
		padding: 0.5rem;
		background: #010409;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.9rem;
	}

	.phase-duration {
		width: 120px;
	}

	.phase-icon {
		width: 60px;
		text-align: center;
	}

	.phase-color {
		width: 60px;
		height: 38px;
		padding: 0.25rem;
		background: #010409;
		border: 1px solid #30363d;
		border-radius: 4px;
		cursor: pointer;
	}

	.phase-description {
		padding: 0.5rem;
		background: #010409;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.9rem;
		font-family: inherit;
		resize: vertical;
	}

	/* JSON Editor Styles */
	.json-editor {
		height: 500px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Markdown Editor Styles */
	.markdown-editor {
		height: 500px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.validation-errors {
		padding: 1rem;
		background: rgba(248, 81, 73, 0.1);
		border: 1px solid rgba(248, 81, 73, 0.3);
		border-radius: 6px;
		color: #f85149;
		font-size: 0.9rem;
	}

	.validation-errors ul {
		margin: 0.5rem 0 0;
		padding-left: 1.5rem;
	}

	.validation-errors li {
		margin: 0.25rem 0;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #30363d;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	.btn-secondary {
		background: #21262d;
		color: #e6edf3;
	}

	.btn-secondary:hover {
		background: #30363d;
	}

	.btn-primary {
		background: #007bc0;
		color: white;
	}

	.btn-primary:hover {
		background: #0069a3;
	}

	.btn-primary:disabled {
		background: #30363d;
		color: #6e7681;
		cursor: not-allowed;
	}
</style>
