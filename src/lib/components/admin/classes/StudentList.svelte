<script>
	import { studentsStore } from '$lib/stores/students.svelte.js';

	let { classItem } = $props();

	let showAddForm = $state(false);
	let showImportForm = $state(false);
	let newStudent = $state({ name: '', email: '', notes: '' });
	let csvText = $state('');
	let editingStudent = $state(null);

	// Get students for this class
	let students = $derived.by(() => {
		return studentsStore.getStudentsForClass(classItem.id);
	});

	async function handleAddStudent() {
		if (newStudent.name.trim()) {
			await studentsStore.createStudent(classItem.id, newStudent);
			newStudent = { name: '', email: '', notes: '' };
			showAddForm = false;
		}
	}

	async function handleDeleteStudent(studentId) {
		if (confirm('Diesen Schüler wirklich löschen?')) {
			await studentsStore.deleteStudent(classItem.id, studentId);
		}
	}

	async function handleImportCSV() {
		try {
			const count = await studentsStore.importFromCSV(classItem.id, csvText);
			alert(`${count} Schüler erfolgreich importiert!`);
			csvText = '';
			showImportForm = false;
		} catch (error) {
			alert(`Fehler beim Importieren: ${error.message}`);
		}
	}

	function handleExportCSV() {
		const csv = studentsStore.exportToCSV(classItem.id);
		
		// Create download
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${classItem.name}_schueler.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}

	async function handleSaveEdit(student) {
		await studentsStore.updateStudent(classItem.id, student.id, student);
		editingStudent = null;
	}

	function startEdit(student) {
		editingStudent = { ...student };
	}

	function cancelEdit() {
		editingStudent = null;
	}
</script>

<div class="student-list">
	<div class="section-header">
		<h3>Schülerliste</h3>
		<div class="header-actions">
			<button class="btn btn-secondary" onclick={handleExportCSV}>
				📥 CSV Export
			</button>
			<button
				class="btn btn-secondary"
				onclick={() => showImportForm = !showImportForm}
			>
				📤 CSV Import
			</button>
			<button
				class="btn btn-primary"
				onclick={() => showAddForm = !showAddForm}
			>
				{showAddForm ? '✕' : '+ Schüler hinzufügen'}
			</button>
		</div>
	</div>

	{#if showAddForm}
		<div class="add-form">
			<div class="form-group">
				<label for="studentName">Name *</label>
				<input
					id="studentName"
					type="text"
					bind:value={newStudent.name}
					placeholder="z.B. Max Mustermann"
				/>
			</div>

			<div class="form-group">
				<label for="studentEmail">E-Mail (optional)</label>
				<input
					id="studentEmail"
					type="email"
					bind:value={newStudent.email}
					placeholder="max@example.com"
				/>
			</div>

			<div class="form-group">
				<label for="studentNotes">Notizen (optional)</label>
				<textarea
					id="studentNotes"
					bind:value={newStudent.notes}
					placeholder="Zusätzliche Informationen..."
					rows="2"
				></textarea>
			</div>

			<button class="btn btn-success" onclick={handleAddStudent}>
				✓ Hinzufügen
			</button>
		</div>
	{/if}

	{#if showImportForm}
		<div class="import-form">
			<div class="form-group">
				<label for="csvImport">CSV Daten</label>
				<textarea
					id="csvImport"
					bind:value={csvText}
					placeholder="Name,Email,Notizen
Max Mustermann,max@example.com,Guter Schüler
Anna Schmidt,anna@example.com,"
					rows="6"
				></textarea>
				<small>Format: Name,Email,Notizen (eine Zeile pro Schüler)</small>
			</div>

			<div class="form-actions">
				<button class="btn btn-success" onclick={handleImportCSV}>
					📥 Importieren
				</button>
				<button class="btn btn-cancel" onclick={() => showImportForm = false}>
					Abbrechen
				</button>
			</div>
		</div>
	{/if}

	<div class="students-container">
		{#if students.length === 0}
			<div class="empty-state">
				<p>Noch keine Schüler in dieser Klasse.</p>
			</div>
		{:else}
			<div class="students-table">
				<div class="table-header">
					<div class="col-name">Name</div>
					<div class="col-email">E-Mail</div>
					<div class="col-notes">Notizen</div>
					<div class="col-actions">Aktionen</div>
				</div>

				{#each students as student (student.id)}
					{#if editingStudent && editingStudent.id === student.id}
						<div class="table-row editing">
							<div class="col-name">
								<input type="text" bind:value={editingStudent.name} />
							</div>
							<div class="col-email">
								<input type="email" bind:value={editingStudent.email} />
							</div>
							<div class="col-notes">
								<input type="text" bind:value={editingStudent.notes} />
							</div>
							<div class="col-actions">
								<button
									class="btn-icon btn-save"
									onclick={() => handleSaveEdit(editingStudent)}
									title="Speichern"
								>
									✓
								</button>
								<button
									class="btn-icon btn-cancel-edit"
									onclick={cancelEdit}
									title="Abbrechen"
								>
									✕
								</button>
							</div>
						</div>
					{:else}
						<div class="table-row">
							<div class="col-name">{student.name}</div>
							<div class="col-email">{student.email || '-'}</div>
							<div class="col-notes">{student.notes || '-'}</div>
							<div class="col-actions">
								<button
									class="btn-icon"
									onclick={() => startEdit(student)}
									title="Bearbeiten"
								>
									✏️
								</button>
								<button
									class="btn-icon btn-delete"
									onclick={() => handleDeleteStudent(student.id)}
									title="Löschen"
								>
									🗑️
								</button>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<div class="student-count">
				Gesamt: {students.length} Schüler
			</div>
		{/if}
	</div>
</div>

<style>
	.student-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
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

	/* Forms */
	.add-form,
	.import-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
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
		background: #0d1117;
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

	.form-group small {
		font-size: 0.75rem;
		color: #8b949e;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
	}

	/* Table */
	.students-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #8b949e;
	}

	.students-table {
		display: flex;
		flex-direction: column;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		overflow: hidden;
	}

	.table-header,
	.table-row {
		display: grid;
		grid-template-columns: 2fr 2fr 3fr 100px;
		gap: 1rem;
		padding: 0.75rem 1rem;
		align-items: center;
	}

	.table-header {
		background: #0d1117;
		border-bottom: 1px solid #30363d;
		font-size: 0.75rem;
		font-weight: 600;
		color: #8b949e;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.table-row {
		border-bottom: 1px solid #30363d;
		transition: background 0.2s;
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.table-row:hover:not(.editing) {
		background: #0d1117;
	}

	.table-row.editing {
		background: #0d1117;
	}

	.table-row.editing input {
		width: 100%;
		padding: 0.375rem 0.5rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.875rem;
	}

	.table-row.editing input:focus {
		outline: none;
		border-color: #1f6feb;
	}

	.col-name {
		font-weight: 600;
		color: #e6edf3;
	}

	.col-email,
	.col-notes {
		color: #8b949e;
		font-size: 0.875rem;
	}

	.col-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.btn-icon {
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: 1px solid #30363d;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-icon:hover {
		background: #21262d;
		border-color: #484f58;
	}

	.btn-icon.btn-delete:hover {
		background: #da3633;
		border-color: #da3633;
	}

	.btn-icon.btn-save {
		color: #238636;
	}

	.btn-icon.btn-save:hover {
		background: #238636;
		border-color: #238636;
		color: white;
	}

	.btn-icon.btn-cancel-edit {
		color: #da3633;
	}

	.btn-icon.btn-cancel-edit:hover {
		background: #da3633;
		border-color: #da3633;
		color: white;
	}

	.student-count {
		text-align: right;
		font-size: 0.875rem;
		color: #8b949e;
		padding: 0 1rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.table-header,
		.table-row {
			grid-template-columns: 1fr;
		}

		.col-email,
		.col-notes {
			display: none;
		}

		.header-actions {
			width: 100%;
			flex-direction: column;
		}

		.header-actions .btn {
			width: 100%;
		}
	}
</style>
