<script>
	import { classesStore } from '$lib/stores/classes.svelte.js';
	import { studentsStore } from '$lib/stores/students.svelte.js';
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import ScheduleEditor from './ScheduleEditor.svelte';
	import StudentList from './StudentList.svelte';

	let {
		classItem
	} = $props();

	let activeTab = $state('info'); // 'info' | 'schedule' | 'students' | 'plans'
	let isEditing = $state(false);
	let editForm = $state({});

	// Initialize edit form with current class data
	$effect(() => {
		if (classItem) {
			editForm = {
				name: classItem.name || '',
				room: classItem.room || '',
				description: classItem.description || '',
				color: classItem.color || '#1f6feb'
			};
		}
	});

	// Load students when class changes
	$effect(() => {
		if (classItem) {
			studentsStore.loadStudents(classItem.id);
		}
	});

	async function handleSave() {
		await classesStore.updateClass(classItem.id, editForm);
		isEditing = false;
	}

	function handleCancel() {
		editForm = {
			name: classItem.name || '',
			room: classItem.room || '',
			description: classItem.description || '',
			color: classItem.color || '#1f6feb'
		};
		isEditing = false;
	}

	async function handleArchive() {
		if (confirm(`Klasse "${classItem.name}" wirklich archivieren?`)) {
			await classesStore.archiveClass(classItem.id);
		}
	}

	// Get associated plans
	let associatedPlans = $derived.by(() => {
		if (!classItem || !classItem.planIds) return [];
		return scheduleStore.schedules.filter(s => classItem.planIds.includes(s.id));
	});

	// Get student count
	let studentCount = $derived.by(() => {
		const students = studentsStore.getStudentsForClass(classItem.id);
		return students.length;
	});
</script>

<div class="class-editor">
	<!-- Tabs -->
	<div class="editor-tabs">
		<button
			class="tab"
			class:active={activeTab === 'info'}
			onclick={() => activeTab = 'info'}
		>
			📝 Info
		</button>
		<button
			class="tab"
			class:active={activeTab === 'schedule'}
			onclick={() => activeTab = 'schedule'}
		>
			📅 Stundenplan
		</button>
		<button
			class="tab"
			class:active={activeTab === 'students'}
			onclick={() => activeTab = 'students'}
		>
			👥 Schüler ({studentCount})
		</button>
		<button
			class="tab"
			class:active={activeTab === 'plans'}
			onclick={() => activeTab = 'plans'}
		>
			📋 Pläne ({associatedPlans.length})
		</button>
	</div>

	<!-- Content -->
	<div class="editor-content">
		{#if activeTab === 'info'}
			<div class="info-section">
				<div class="section-header">
					<h2>{classItem.name}</h2>
					<div class="header-actions">
						{#if !isEditing}
							<button class="btn btn-primary" onclick={() => isEditing = true}>
								✏️ Bearbeiten
							</button>
							<button class="btn btn-secondary" onclick={handleArchive}>
								📦 Archivieren
							</button>
						{:else}
							<button class="btn btn-success" onclick={handleSave}>
								✓ Speichern
							</button>
							<button class="btn btn-cancel" onclick={handleCancel}>
								✕ Abbrechen
							</button>
						{/if}
					</div>
				</div>

				{#if isEditing}
					<div class="form">
						<div class="form-group">
							<label for="name">Klassenname</label>
							<input
								id="name"
								type="text"
								bind:value={editForm.name}
								placeholder="z.B. Klasse 5a"
							/>
						</div>

						<div class="form-group">
							<label for="room">Raum</label>
							<input
								id="room"
								type="text"
								bind:value={editForm.room}
								placeholder="z.B. Raum 204"
							/>
						</div>

						<div class="form-group">
							<label for="description">Beschreibung</label>
							<textarea
								id="description"
								bind:value={editForm.description}
								placeholder="Optional: Beschreibung der Klasse"
								rows="3"
							></textarea>
						</div>

						<div class="form-group">
							<label for="color">Farbe</label>
							<div class="color-picker">
								<input
									id="color"
									type="color"
									bind:value={editForm.color}
								/>
								<span class="color-value">{editForm.color}</span>
							</div>
						</div>
					</div>
				{:else}
					<div class="info-display">
						<div class="info-item">
							<span class="label">Raum:</span>
							<span class="value">{classItem.room || 'Nicht zugewiesen'}</span>
						</div>

						{#if classItem.description}
							<div class="info-item">
								<span class="label">Beschreibung:</span>
								<span class="value">{classItem.description}</span>
							</div>
						{/if}

						<div class="info-item">
							<span class="label">Farbe:</span>
							<span class="color-badge" style="background-color: {classItem.color}">
								{classItem.color}
							</span>
						</div>

						<div class="info-item">
							<span class="label">Erstellt:</span>
							<span class="value">
								{new Date(classItem.createdAt).toLocaleDateString('de-DE')}
							</span>
						</div>

						<div class="info-item">
							<span class="label">Schüler:</span>
							<span class="value">{studentCount}</span>
						</div>

						<div class="info-item">
							<span class="label">Stundenplan:</span>
							<span class="value">
								{classItem.schedule?.length || 0} Zeitslots
							</span>
						</div>
					</div>
				{/if}
			</div>
		{:else if activeTab === 'schedule'}
			<ScheduleEditor {classItem} />
		{:else if activeTab === 'students'}
			<StudentList {classItem} />
		{:else if activeTab === 'plans'}
			<div class="plans-section">
				<div class="section-header">
					<h3>Zugeordnete Pläne</h3>
				</div>

				{#if associatedPlans.length === 0}
					<div class="empty-state">
						<p>Keine Pläne zugeordnet.</p>
					</div>
				{:else}
					<div class="plans-list">
						{#each associatedPlans as plan (plan.id)}
							<div class="plan-card">
								<div class="plan-info">
									<div class="plan-name">{plan.name}</div>
									<div class="plan-meta">
										{plan.phases.length} Phasen
									</div>
								</div>
								<button
									class="btn-remove"
									onclick={() => classesStore.removePlan(classItem.id, plan.id)}
									title="Zuordnung aufheben"
								>
									✕
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.class-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #0d1117;
	}

	.editor-tabs {
		display: flex;
		gap: 0.5rem;
		padding: 1rem 1rem 0;
		background: #0d1117;
		border-bottom: 1px solid #30363d;
	}

	.tab {
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: #8b949e;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab:hover {
		color: #e6edf3;
	}

	.tab.active {
		color: #1f6feb;
		border-bottom-color: #1f6feb;
	}

	.editor-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #e6edf3;
	}

	.section-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #e6edf3;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
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

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: #e6edf3;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn-success {
		background: #238636;
		color: white;
	}

	.btn-success:hover {
		background: #2ea043;
	}

	.btn-cancel {
		background: #da3633;
		color: white;
	}

	.btn-cancel:hover {
		background: #f85149;
	}

	/* Form Styles */
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 600px;
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
	.form-group textarea {
		padding: 0.5rem 0.75rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		font-size: 0.875rem;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #1f6feb;
	}

	.color-picker {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.color-picker input[type="color"] {
		width: 60px;
		height: 40px;
		border: 1px solid #30363d;
		border-radius: 6px;
		cursor: pointer;
	}

	.color-value {
		font-family: monospace;
		font-size: 0.875rem;
		color: #8b949e;
	}

	/* Info Display */
	.info-display {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 600px;
	}

	.info-item {
		display: flex;
		gap: 1rem;
		padding: 0.75rem;
		background: #161b22;
		border-radius: 6px;
	}

	.info-item .label {
		font-weight: 600;
		color: #8b949e;
		min-width: 120px;
	}

	.info-item .value {
		color: #e6edf3;
	}

	.color-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		color: white;
		font-family: monospace;
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* Plans Section */
	.plans-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #8b949e;
	}

	.plans-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.plan-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.plan-card:hover {
		border-color: #484f58;
	}

	.plan-info {
		flex: 1;
	}

	.plan-name {
		font-weight: 600;
		color: #e6edf3;
	}

	.plan-meta {
		font-size: 0.75rem;
		color: #8b949e;
		margin-top: 0.25rem;
	}

	.btn-remove {
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #8b949e;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-remove:hover {
		background: #da3633;
		border-color: #da3633;
		color: white;
	}

	/* Scrollbar */
	.editor-content::-webkit-scrollbar {
		width: 10px;
	}

	.editor-content::-webkit-scrollbar-track {
		background: #0d1117;
	}

	.editor-content::-webkit-scrollbar-thumb {
		background: #30363d;
		border-radius: 5px;
	}

	.editor-content::-webkit-scrollbar-thumb:hover {
		background: #484f58;
	}
</style>
