<script>
	import MonacoEditor from '$lib/components/shared/MonacoEditor.svelte';
	import ClassEditor from '$lib/components/admin/classes/ClassEditor.svelte';
	import { planToMarkdown, planToMarkdownParts, markdownToPlan, validatePlan } from '$lib/utils/markdown-converter.js';
	import { plansAPI } from '$lib/api/plans.js';
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { classesStore } from '$lib/stores/classes.svelte.js';

	let {
		openItems = $bindable([]),
		activeItem = $bindable(null),
		onRunPlan = () => {}
	} = $props();

	// File content state
	let fileContents = $state({});
	let unsavedChanges = $state(new Set());

	// Plan editing state
	let planEditMode = $state('ui'); // 'ui' | 'json' | 'markdown'
	let uiPlan = $state(null);
	let jsonContent = $state('');
	let markdownContent = $state('');
	let validationErrors = $state([]);
	let errorTimeoutId = null;

	// Auto-clear validation errors after 5 seconds
	$effect(() => {
		if (validationErrors.length > 0) {
			// Clear any existing timeout
			if (errorTimeoutId) {
				clearTimeout(errorTimeoutId);
			}
			// Set new timeout to clear errors after 5 seconds
			errorTimeoutId = setTimeout(() => {
				validationErrors = [];
				errorTimeoutId = null;
			}, 5000);
		}
	});

	// Load file content
	async function loadFileContent(file) {
		if (!window.electronAPI) return;

		const result = await window.electronAPI.readFile(file.path);
		if (result.success) {
			fileContents[file.path] = result.content;
		}
	}

	// Load plan data
	async function loadPlanData(plan) {
		const fullPlan = await plansAPI.get(plan.id);
		if (fullPlan) {
			// Ensure classIds array exists
			if (!fullPlan.classIds) {
				fullPlan.classIds = fullPlan.classId ? [fullPlan.classId] : [];
			}
			uiPlan = JSON.parse(JSON.stringify(fullPlan));
			jsonContent = JSON.stringify(fullPlan, null, 2);
			markdownContent = planToMarkdown(fullPlan);
			validationErrors = [];
		}
	}

	// Save file
	async function saveFile(file) {
		if (!window.electronAPI || !fileContents[file.path]) return;

		const result = await window.electronAPI.writeFile(file.path, fileContents[file.path]);
		if (result.success) {
			unsavedChanges.delete(file.path);
			unsavedChanges = new Set(unsavedChanges);
		}
	}

	// Helper function to safely clone and remove Svelte proxies
	function safeClone(obj, depth = 0) {
		// Prevent infinite recursion
		if (depth > 50) {
			console.warn('Max clone depth reached');
			return null;
		}
		
		// Handle primitives and null
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}
		
		// Handle Date objects
		if (obj instanceof Date) {
			return obj.getTime();
		}
		
		// Handle Arrays
		if (Array.isArray(obj)) {
			return obj.map(item => safeClone(item, depth + 1));
		}
		
		// Handle plain objects
		const cloned = {};
		for (const key in obj) {
			// Skip prototype properties and functions
			if (!Object.prototype.hasOwnProperty.call(obj, key)) {
				continue;
			}
			
			const value = obj[key];
			
			// Skip functions
			if (typeof value === 'function') {
				continue;
			}
			
			// Skip symbols
			if (typeof value === 'symbol') {
				continue;
			}
			
			// Skip undefined
			if (value === undefined) {
				continue;
			}
			
			try {
				cloned[key] = safeClone(value, depth + 1);
			} catch (err) {
				console.warn(`Skipping property ${key} during clone:`, err);
			}
		}
		return cloned;
	}

	// Save plan
	async function savePlan(plan) {
		try {
			let planToSave;

			if (planEditMode === 'ui') {
				// Deep clone to remove Svelte proxies and ensure IPC compatibility
				planToSave = safeClone(uiPlan);
				planToSave.updatedAt = Date.now();
			} else if (planEditMode === 'json') {
				try {
					planToSave = JSON.parse(jsonContent);
					planToSave.updatedAt = Date.now();

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
				planToSave = markdownToPlan(markdownContent);
				planToSave.updatedAt = Date.now();

				const validation = validatePlan(planToSave);
				if (!validation.valid) {
					validationErrors = validation.errors;
					return;
				}
			}

		try {
			await plansAPI.save(planToSave);
		} catch (error) {
			console.error('Error saving plan JSON:', error);
			validationErrors = ['Fehler beim Speichern (JSON): ' + error.message];
			return;
		}

		try {
			const { content, frontmatter } = planToMarkdownParts(planToSave);
			await plansAPI.saveMarkdown(planToSave.id, content, frontmatter);
		} catch (error) {
			console.error('Error saving plan markdown:', error);
			validationErrors = ['Fehler beim Speichern (Markdown): ' + error.message];
			return;
		}

		// Update class-plan associations
		if (planToSave.classIds && planToSave.classIds.length > 0) {
			for (const classId of planToSave.classIds) {
				const classItem = classesStore.classes.find(c => c.id === classId);
				if (classItem && !classItem.planIds?.includes(planToSave.id)) {
					await classesStore.addPlan(classId, planToSave.id);
				}
			}
		}

		await scheduleStore.loadSchedules();

		unsavedChanges.delete(plan.id);
		unsavedChanges = new Set(unsavedChanges);
			
			// Reload plan data
			await loadPlanData(planToSave);
		} catch (error) {
			console.error('Error saving plan:', error);
			validationErrors = ['Fehler beim Speichern: ' + error.message];
		}
	}

	// Handle content changes
	function handleFileChange(file, content) {
		fileContents[file.path] = content;
		unsavedChanges.add(file.path);
		unsavedChanges = new Set(unsavedChanges);
	}

	function handlePlanChange() {
		if (activeItem?.type === 'plan') {
			unsavedChanges.add(activeItem.id);
			unsavedChanges = new Set(unsavedChanges);
		}
	}

	// Close item
	function closeItem(item, event) {
		event?.stopPropagation();
		
		const itemId = item.type === 'plan' ? item.id : item.path;
		if (unsavedChanges.has(itemId)) {
			if (!confirm(`${item.name} has unsaved changes. Close anyway?`)) {
				return;
			}
		}

		openItems = openItems.filter((i) => {
			const iId = i.type === 'plan' ? i.id : i.path;
			return iId !== itemId;
		});

		if (item.type === 'file') {
			delete fileContents[item.path];
			unsavedChanges.delete(item.path);
		} else {
			unsavedChanges.delete(item.id);
		}
		unsavedChanges = new Set(unsavedChanges);

		const activeId = activeItem?.type === 'plan' ? activeItem.id : activeItem?.path;
		if (activeId === itemId) {
			activeItem = openItems[0] || null;
		}
	}

	// Plan edit mode switching
	function switchPlanMode(mode) {
		if (!uiPlan) return;

		// From UI mode
		if (planEditMode === 'ui') {
			if (mode === 'json') {
				jsonContent = JSON.stringify(uiPlan, null, 2);
				validationErrors = [];
			} else if (mode === 'markdown') {
				markdownContent = planToMarkdown(uiPlan);
				validationErrors = [];
			}
		}
		// From JSON mode
		else if (planEditMode === 'json') {
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
		else if (planEditMode === 'markdown') {
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
		
		planEditMode = mode;
	}

	// Plan UI helpers
	function addPhase() {
		if (!uiPlan) return;
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
		handlePlanChange();
	}

	function removePhase(index) {
		if (!uiPlan) return;
		uiPlan.phases = uiPlan.phases.filter((_, i) => i !== index);
		handlePlanChange();
	}

	function movePhase(index, direction) {
		if (!uiPlan) return;
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= uiPlan.phases.length) return;

		const phases = [...uiPlan.phases];
		[phases[index], phases[newIndex]] = [phases[newIndex], phases[index]];
		uiPlan.phases = phases;
		handlePlanChange();
	}

	function getFileLanguage(fileName) {
		const ext = fileName.split('.').pop();
		switch (ext) {
			case 'json':
				return 'json';
			case 'md':
				return 'markdown';
			case 'js':
				return 'javascript';
			default:
				return 'plaintext';
		}
	}

	// Effects
	$effect(() => {
		if (activeItem) {
			if (activeItem.type === 'file' && !fileContents[activeItem.path]) {
				loadFileContent(activeItem);
			} else if (activeItem.type === 'plan') {
				loadPlanData(activeItem);
			}
		}
	});

	// Keyboard shortcuts
	function handleKeydown(event) {
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			if (activeItem) {
				if (activeItem.type === 'file') {
					saveFile(activeItem);
				} else if (activeItem.type === 'plan') {
					savePlan(activeItem);
				}
			}
		}
	}

	function handleSaveClick() {
		if (activeItem) {
			if (activeItem.type === 'file') {
				saveFile(activeItem);
			} else if (activeItem.type === 'plan') {
				savePlan(activeItem);
			}
		}
	}

	function handleRunClick() {
		if (activeItem?.type === 'plan') {
			onRunPlan(activeItem);
		}
	}

	function getItemId(item) {
		return item.type === 'plan' ? item.id : item.path;
	}

	function isItemUnsaved(item) {
		return unsavedChanges.has(getItemId(item));
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="unified-editor">
	{#if openItems.length === 0}
		<div class="empty-state">
			<div class="icon">📋</div>
			<h2>Kein Element geöffnet</h2>
			<p>Wähle einen Plan oder eine Datei aus der Sidebar</p>
		</div>
	{:else}
		<div class="tabs">
			{#each openItems as item (getItemId(item))}
				<div
					class="tab"
					class:active={getItemId(activeItem) === getItemId(item)}
					class:unsaved={isItemUnsaved(item)}
				>
					<button class="tab-button" onclick={() => (activeItem = item)}>
						<span class="tab-icon">{item.type === 'plan' ? '📋' : '📄'}</span>
						<span class="tab-name">{item.name}</span>
						{#if isItemUnsaved(item)}
							<span class="unsaved-indicator">●</span>
						{/if}
					</button>
					<button class="close-btn" onclick={(e) => closeItem(item, e)}>✕</button>
				</div>
			{/each}
		</div>

		<div class="editor-container">
			{#if activeItem}
				<div class="editor-header">
					<div class="header-left">
						{#if activeItem.type === 'plan'}
							<div class="mode-toggle">
								<button
									class="mode-btn"
									class:active={planEditMode === 'ui'}
									onclick={() => switchPlanMode('ui')}
								>
									📝 UI
								</button>
								<button
									class="mode-btn"
									class:active={planEditMode === 'json'}
									onclick={() => switchPlanMode('json')}
								>
									{"{ }"} JSON
								</button>
								<button
									class="mode-btn"
									class:active={planEditMode === 'markdown'}
									onclick={() => switchPlanMode('markdown')}
								>
									📄 MD
								</button>
							</div>
						{:else}
							<span class="file-path">{activeItem.path}</span>
						{/if}
					</div>

					<div class="actions">
						{#if isItemUnsaved(activeItem)}
							<button class="btn-save" onclick={handleSaveClick}>
								💾 Speichern
							</button>
						{/if}
						{#if activeItem.type === 'plan'}
							<button class="btn-run" onclick={handleRunClick}>
								🎯 In Beamer öffnen
							</button>
						{/if}
					</div>
				</div>

				<div class="editor-content">
					{#if activeItem.type === 'file'}
						{#if fileContents[activeItem.path] !== undefined}
							<MonacoEditor
								bind:value={fileContents[activeItem.path]}
								language={getFileLanguage(activeItem.name)}
								onChange={(content) => handleFileChange(activeItem, content)}
							/>
						{:else}
							<div class="loading">Loading...</div>
						{/if}
					{:else if activeItem.type === 'class'}
						<ClassEditor classItem={activeItem} />
					{:else if activeItem.type === 'plan' && uiPlan}
						{#if planEditMode === 'ui'}
							<div class="plan-ui-editor">
								<div class="form-group">
									<label for="plan-name">Plan-Name *</label>
									<input
										id="plan-name"
										type="text"
										bind:value={uiPlan.name}
										oninput={handlePlanChange}
									/>
								</div>

								<div class="form-group">
									<label for="start-time">Startzeit</label>
									<input
										id="start-time"
										type="time"
										bind:value={uiPlan.startTime}
										oninput={handlePlanChange}
									/>
								</div>

								<div class="form-group">
									<label for="class-select">Klasse zuordnen (optional)</label>
									<select
										id="class-select"
										value={uiPlan.classIds?.[0] || ''}
										onchange={(e) => {
											if (e.target.value) {
												uiPlan.classIds = [e.target.value];
											} else {
												uiPlan.classIds = [];
											}
											handlePlanChange();
										}}
									>
										<option value="">Keine Klasse</option>
										{#each classesStore.activeClasses as classItem (classItem.id)}
											<option value={classItem.id}>{classItem.name}</option>
										{/each}
									</select>
								</div>

								<div class="phases-section">
									<div class="section-header">
										<h3>Phasen ({uiPlan.phases.length})</h3>
										<button class="btn-add" onclick={addPhase}>+ Phase hinzufügen</button>
									</div>

									{#if uiPlan.phases.length === 0}
										<div class="empty-phases">
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
															oninput={handlePlanChange}
															class="phase-name"
														/>
														<div class="phase-meta">
															<input
																type="number"
																placeholder="Dauer (Sek)"
																bind:value={phase.duration}
																oninput={handlePlanChange}
																min="1"
																class="phase-duration"
															/>
															<input
																type="text"
																placeholder="Icon"
																bind:value={phase.icon}
																oninput={handlePlanChange}
																class="phase-icon"
															/>
															<input
																type="color"
																bind:value={phase.color}
																oninput={handlePlanChange}
																class="phase-color"
															/>
														</div>
														<textarea
															placeholder="Beschreibung (optional)"
															bind:value={phase.description}
															oninput={handlePlanChange}
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
						{:else if planEditMode === 'json'}
							<div class="code-editor">
								<MonacoEditor
									bind:value={jsonContent}
									language="json"
									onChange={(content) => {
										jsonContent = content;
										handlePlanChange();
									}}
								/>
							</div>
						{:else if planEditMode === 'markdown'}
							<div class="code-editor">
								<MonacoEditor
									bind:value={markdownContent}
									language="markdown"
									onChange={(content) => {
										markdownContent = content;
										handlePlanChange();
									}}
								/>
							</div>
						{/if}

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
					{:else}
						<div class="loading">Loading...</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.unified-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #0d1117;
		color: #e6edf3;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #8b949e;
		text-align: center;
		padding: 2rem;
	}

	.empty-state .icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h2 {
		margin: 0 0 0.5rem;
		color: #e6edf3;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	.tabs {
		display: flex;
		gap: 0;
		background: #161b22;
		border-bottom: 1px solid #30363d;
		overflow-x: auto;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0;
		background: transparent;
		border-right: 1px solid #30363d;
		color: #8b949e;
		font-size: 0.875rem;
		transition: all 0.1s;
	}

	.tab:hover {
		background: #21262d;
		color: #e6edf3;
	}

	.tab.active {
		background: #0d1117;
		color: #e6edf3;
		border-bottom: 2px solid #1f6feb;
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: inherit;
		white-space: nowrap;
		flex: 1;
	}

	.tab-icon {
		flex-shrink: 0;
	}

	.tab-name {
		flex: 1;
	}

	.unsaved-indicator {
		color: #1f6feb;
		font-size: 1.25rem;
		line-height: 1;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		margin-right: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 3px;
		color: #8b949e;
		cursor: pointer;
		font-size: 0.75rem;
		opacity: 0;
		transition: all 0.1s;
	}

	.tab:hover .close-btn {
		opacity: 1;
	}

	.close-btn:hover {
		background: #30363d;
		color: #e6edf3;
	}

	.editor-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: #161b22;
		border-bottom: 1px solid #30363d;
		gap: 1rem;
	}

	.header-left {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.file-path {
		font-size: 0.75rem;
		color: #8b949e;
		font-family: 'Courier New', monospace;
	}

	.mode-toggle {
		display: flex;
		gap: 0.25rem;
		background: #0d1117;
		border-radius: 6px;
		padding: 0.25rem;
	}

	.mode-btn {
		padding: 0.375rem 0.75rem;
		background: transparent;
		border: none;
		color: #8b949e;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 4px;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.mode-btn:hover {
		color: #e6edf3;
		background: #21262d;
	}

	.mode-btn.active {
		color: white;
		background: #1f6feb;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-save {
		padding: 0.5rem 1rem;
		background: #1f6feb;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-save:hover {
		background: #388bfd;
	}

	.btn-run {
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.btn-run:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
	}

	.editor-content {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #8b949e;
	}

	/* Plan UI Editor */
	.plan-ui-editor {
		height: 100%;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #8b949e;
		font-weight: 600;
	}

	.form-group input {
		width: 100%;
		padding: 0.625rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		font-size: 0.875rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #1f6feb;
	}

	.phases-section {
		margin-top: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-header h3 {
		margin: 0;
		color: #e6edf3;
		font-size: 1.125rem;
	}

	.btn-add {
		padding: 0.5rem 1rem;
		background: #1f6feb;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-add:hover {
		background: #388bfd;
	}

	.empty-phases {
		padding: 2rem;
		text-align: center;
		color: #8b949e;
		background: #161b22;
		border: 1px dashed #30363d;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.phases-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.phase-item {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: #161b22;
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
		font-size: 0.875rem;
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
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.phase-meta {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.5rem;
	}

	.phase-duration,
	.phase-icon {
		padding: 0.5rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.875rem;
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
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		cursor: pointer;
	}

	.phase-description {
		padding: 0.5rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
	}

	/* Code Editor */
	.code-editor {
		height: 100%;
		width: 100%;
	}

	/* Validation Errors */
	.validation-errors {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		right: 1rem;
		padding: 1rem;
		background: rgba(248, 81, 73, 0.1);
		border: 1px solid rgba(248, 81, 73, 0.3);
		border-radius: 6px;
		color: #f85149;
		font-size: 0.875rem;
		z-index: 10;
	}

	.validation-errors ul {
		margin: 0.5rem 0 0;
		padding-left: 1.5rem;
	}

	.validation-errors li {
		margin: 0.25rem 0;
	}

	/* Scrollbar */
	.plan-ui-editor::-webkit-scrollbar,
	.tabs::-webkit-scrollbar {
		width: 10px;
		height: 6px;
	}

	.plan-ui-editor::-webkit-scrollbar-track,
	.tabs::-webkit-scrollbar-track {
		background: #0d1117;
	}

	.plan-ui-editor::-webkit-scrollbar-thumb,
	.tabs::-webkit-scrollbar-thumb {
		background: #30363d;
		border-radius: 5px;
	}

	.plan-ui-editor::-webkit-scrollbar-thumb:hover,
	.tabs::-webkit-scrollbar-thumb:hover {
		background: #484f58;
	}
</style>
