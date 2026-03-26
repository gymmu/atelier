<script>
	import { classesStore } from '$lib/stores/classes.svelte.js';

	let {
		classData = null,
		isOpen = $bindable(false),
		onSave = () => {}
	} = $props();

	// Edit mode: 'form' or 'json'
	let editMode = $state('form');

	// Form fields
	let formData = $state({
		id: '',
		name: '',
		subject: '',
		room: '',
		teacher: '',
		weekday: '',
		time: '',
		createdAt: 0,
		updatedAt: 0
	});

	// JSON editor
	let jsonContent = $state('');
	let jsonError = $state(null);

	// Initialize form when classData changes
	$effect(() => {
		if (classData) {
			formData = { ...classData };
			jsonContent = JSON.stringify(classData, null, 2);
		} else {
			// New class
			formData = {
				id: `class-${Date.now()}`,
				name: '',
				subject: '',
				room: '',
				teacher: '',
				weekday: '',
				time: '',
				createdAt: Date.now(),
				updatedAt: Date.now()
			};
			jsonContent = JSON.stringify(formData, null, 2);
		}
		jsonError = null;
	});

	function handleClose() {
		isOpen = false;
	}

	async function handleSave() {
		try {
			let dataToSave;

			if (editMode === 'form') {
				dataToSave = { ...formData, updatedAt: Date.now() };
			} else {
				// Parse JSON
				try {
					dataToSave = JSON.parse(jsonContent);
					dataToSave.updatedAt = Date.now();
					jsonError = null;
				} catch (err) {
					jsonError = 'Ungültiges JSON-Format: ' + err.message;
					return;
				}
			}

			// Save via store
			if (classData) {
				await classesStore.updateClass(dataToSave.id, dataToSave);
			} else {
				await classesStore.createClass(dataToSave);
			}

			onSave(dataToSave);
			handleClose();
		} catch (error) {
			console.error('Error saving class:', error);
			jsonError = 'Fehler beim Speichern: ' + error.message;
		}
	}

	function switchMode(mode) {
		if (mode === 'json' && editMode === 'form') {
			// Form → JSON
			jsonContent = JSON.stringify(formData, null, 2);
			jsonError = null;
		} else if (mode === 'form' && editMode === 'json') {
			// JSON → Form
			try {
				formData = JSON.parse(jsonContent);
				jsonError = null;
			} catch (err) {
				jsonError = 'JSON ist ungültig. Korrigiere die Fehler bevor du zum Formular wechselst.';
				return;
			}
		}
		editMode = mode;
	}

	function handleJsonChange(e) {
		jsonContent = e.target.value;
		// Try to parse to validate
		try {
			JSON.parse(jsonContent);
			jsonError = null;
		} catch (err) {
			jsonError = 'JSON-Fehler: ' + err.message;
		}
	}
</script>

{#if isOpen}
	<div class="modal-overlay" onclick={handleClose}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>{classData ? 'Klasse bearbeiten' : 'Neue Klasse'}</h2>
				<button class="close-btn" onclick={handleClose}>✕</button>
			</div>

			<div class="mode-toggle">
				<button
					class="mode-btn"
					class:active={editMode === 'form'}
					onclick={() => switchMode('form')}
				>
					📝 Formular
				</button>
				<button
					class="mode-btn"
					class:active={editMode === 'json'}
					onclick={() => switchMode('json')}
				>
					{`{ }`} JSON
				</button>
			</div>

			<div class="modal-body">
				{#if editMode === 'form'}
					<div class="form">
						<div class="form-group">
							<label for="name">Name *</label>
							<input
								id="name"
								type="text"
								bind:value={formData.name}
								placeholder="z.B. Klasse 3a"
								required
							/>
						</div>

						<div class="form-group">
							<label for="subject">Fach</label>
							<input
								id="subject"
								type="text"
								bind:value={formData.subject}
								placeholder="z.B. Mathematik"
							/>
						</div>

						<div class="form-group">
							<label for="room">Raum</label>
							<input id="room" type="text" bind:value={formData.room} placeholder="z.B. R201" />
						</div>

						<div class="form-group">
							<label for="teacher">Lehrer</label>
							<input
								id="teacher"
								type="text"
								bind:value={formData.teacher}
								placeholder="z.B. Frau Schmidt"
							/>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="weekday">Wochentag</label>
								<select id="weekday" bind:value={formData.weekday}>
									<option value="">-</option>
									<option value="Montag">Montag</option>
									<option value="Dienstag">Dienstag</option>
									<option value="Mittwoch">Mittwoch</option>
									<option value="Donnerstag">Donnerstag</option>
									<option value="Freitag">Freitag</option>
								</select>
							</div>

							<div class="form-group">
								<label for="time">Zeit</label>
								<input id="time" type="time" bind:value={formData.time} />
							</div>
						</div>
					</div>
				{:else}
					<div class="json-editor">
						<textarea
							bind:value={jsonContent}
							oninput={handleJsonChange}
							spellcheck="false"
							placeholder="JSON-Daten hier bearbeiten..."
						></textarea>
						{#if jsonError}
							<div class="json-error">{jsonError}</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn btn-secondary" onclick={handleClose}>Abbrechen</button>
				<button class="btn btn-primary" onclick={handleSave} disabled={jsonError !== null}>
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
		width: 90%;
		max-width: 600px;
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

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
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

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #007bc0;
	}

	.json-editor {
		height: 400px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.json-editor textarea {
		flex: 1;
		padding: 1rem;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		font-family: 'Fira Code', 'Courier New', monospace;
		font-size: 0.9rem;
		resize: none;
		line-height: 1.5;
	}

	.json-editor textarea:focus {
		outline: none;
		border-color: #007bc0;
	}

	.json-error {
		padding: 0.75rem;
		background: rgba(248, 81, 73, 0.1);
		border: 1px solid rgba(248, 81, 73, 0.3);
		border-radius: 6px;
		color: #f85149;
		font-size: 0.85rem;
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
