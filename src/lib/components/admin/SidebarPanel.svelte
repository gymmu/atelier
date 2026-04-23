<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { classesStore } from '$lib/stores/classes.svelte.js';
	import { lektionenStore } from '$lib/stores/lektionen.svelte.js';
	import LektionenSidebar from '$lib/components/admin/lektionen/LektionenSidebar.svelte';

	let {
		activeView = 'lektionen',
		onPlanSelect = () => {},
		onClassSelect = () => {},
		onFileSelect = () => {},
		onNewPlan = () => {},
		onNewClass = () => {},
		onLektionSelect = () => {},
		onNewLektion = () => {}
	} = $props();

	// Init lektionen store when lektionen view is active
	$effect(() => {
		if (activeView === 'lektionen' && !lektionenStore.initialized) {
			lektionenStore.init();
		}
	});

	let selectedPlan = $state(null);
	let selectedClass = $state(null);
	let selectedFile = $state(null);
	let showNewScheduleForm = $state(false);
	let showNewClassForm = $state(false);
	let newScheduleName = $state('');
	let newClassName = $state('');

	// File explorer state
	let rootItems = $state([]);
	let expandedDirs = $state(new Set());
	let dirContents = $state({});

	async function loadDirectory(path) {
		if (!window.electronAPI) return;

		const items = await window.electronAPI.readDirectory(path);
		
		if (path === '') {
			rootItems = items;
		} else {
			dirContents[path] = items;
		}
	}

	async function toggleDirectory(item) {
		const path = item.path;

		if (expandedDirs.has(path)) {
			expandedDirs.delete(path);
			expandedDirs = new Set(expandedDirs);
		} else {
			expandedDirs.add(path);
			expandedDirs = new Set(expandedDirs);
			
			if (!dirContents[path]) {
				await loadDirectory(path);
			}
		}
	}

	function handlePlanClick(plan) {
		selectedPlan = plan.id;
		selectedFile = null;
		selectedClass = null;
		scheduleStore.setCurrentSchedule(plan.id);
		onPlanSelect(plan);
	}

	function handleClassClick(classItem) {
		selectedClass = classItem.id;
		selectedPlan = null;
		selectedFile = null;
		classesStore.setCurrentClass(classItem.id);
		onClassSelect(classItem);
	}

	function handleFileClick(item) {
		if (item.type === 'directory') {
			toggleDirectory(item);
		} else {
			selectedFile = item.path;
			selectedPlan = null;
			selectedClass = null;
			onFileSelect(item);
		}
	}

	async function handleCreateSchedule() {
		if (newScheduleName.trim()) {
			const schedule = await scheduleStore.createSchedule(newScheduleName.trim());
			scheduleStore.setCurrentSchedule(schedule.id);
			newScheduleName = '';
			showNewScheduleForm = false;
			onNewPlan(schedule);
		}
	}

	async function handleCreateClass() {
		if (newClassName.trim()) {
			const classItem = await classesStore.createClass({ name: newClassName.trim() });
			classesStore.setCurrentClass(classItem.id);
			newClassName = '';
			showNewClassForm = false;
			onNewClass(classItem);
		}
	}

	async function handleDeleteSchedule(id, event) {
		event.stopPropagation();
		if (confirm('Diesen Plan wirklich löschen?')) {
			await scheduleStore.deleteSchedule(id);
		}
	}

	async function handleDeleteClass(id, event) {
		event.stopPropagation();
		if (confirm('Diese Klasse wirklich löschen?')) {
			await classesStore.deleteClass(id);
		}
	}

	function getFileIcon(item) {
		if (item.type === 'directory') {
			return expandedDirs.has(item.path) ? '📂' : '📁';
		}
		
		const ext = item.name.split('.').pop();
		switch (ext) {
			case 'json': return '📄';
			case 'md': return '📝';
			case 'csv': return '📊';
			default: return '📄';
		}
	}

	// Load files on mount
	$effect(() => {
		if (activeView === 'files' && rootItems.length === 0) {
			loadDirectory('');
		}
	});
</script>

<div class="sidebar-panel">
	{#if activeView === 'lektionen'}
		<LektionenSidebar
			onSelectLektion={onLektionSelect}
			onNewLektion={onNewLektion}
		/>
	{:else if activeView === 'plans'}
		<div class="panel-section">
			<div class="section-header">
				<h3>Zeitpläne</h3>
				<button
					class="btn-new"
					onclick={() => (showNewScheduleForm = !showNewScheduleForm)}
					title="Neuer Plan"
				>
					{showNewScheduleForm ? '✕' : '+'}
				</button>
			</div>

			{#if showNewScheduleForm}
				<div class="new-form">
					<input
						type="text"
						bind:value={newScheduleName}
						placeholder="z.B. Klasse 3a - Mathematik"
						onkeydown={(e) => e.key === 'Enter' && handleCreateSchedule()}
					/>
					<button class="btn-create" onclick={handleCreateSchedule}>
						Erstellen
					</button>
				</div>
			{/if}

			<div class="items-list">
				{#if scheduleStore.schedules.length === 0}
					<div class="empty-state">
						<p>Noch keine Pläne vorhanden.</p>
					</div>
				{:else}
					{#each scheduleStore.schedules as schedule (schedule.id)}
						<div
							class="list-item"
							class:active={selectedPlan === schedule.id}
							onclick={() => handlePlanClick(schedule)}
							onkeydown={(e) => e.key === 'Enter' && handlePlanClick(schedule)}
							role="button"
							tabindex="0"
						>
							<div class="item-info">
								<div class="item-name">{schedule.name}</div>
								<div class="item-meta">
									{schedule.phases.length} Phasen
								</div>
							</div>
							<button
								class="btn-delete"
								onclick={(e) => handleDeleteSchedule(schedule.id, e)}
								title="Löschen"
							>
								🗑️
							</button>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{:else if activeView === 'classes'}
		<div class="panel-section">
			<div class="section-header">
				<h3>Klassen</h3>
				<button
					class="btn-new"
					onclick={() => (showNewClassForm = !showNewClassForm)}
					title="Neue Klasse"
				>
					{showNewClassForm ? '✕' : '+'}
				</button>
			</div>

			{#if showNewClassForm}
				<div class="new-form">
					<input
						type="text"
						bind:value={newClassName}
						placeholder="z.B. Klasse 5a"
						onkeydown={(e) => e.key === 'Enter' && handleCreateClass()}
					/>
					<button class="btn-create" onclick={handleCreateClass}>
						Erstellen
					</button>
				</div>
			{/if}

			<div class="items-list">
				{#if classesStore.classes.length === 0}
					<div class="empty-state">
						<p>Noch keine Klassen vorhanden.</p>
					</div>
				{:else}
					{#each classesStore.classes as classItem (classItem.id)}
						<div
							class="list-item"
							class:active={selectedClass === classItem.id}
							onclick={() => handleClassClick(classItem)}
							onkeydown={(e) => e.key === 'Enter' && handleClassClick(classItem)}
							role="button"
							tabindex="0"
						>
							<div class="item-info">
								<div class="item-name">{classItem.name}</div>
								<div class="item-meta">
									{#if classItem.room}
										📍 {classItem.room}
									{:else}
										Kein Raum zugewiesen
									{/if}
								</div>
							</div>
							<button
								class="btn-delete"
								onclick={(e) => handleDeleteClass(classItem.id, e)}
								title="Löschen"
							>
								🗑️
							</button>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{:else if activeView === 'files'}
		<div class="panel-section files-panel">
			<div class="section-header">
				<h3>EXPLORER</h3>
			</div>

			<div class="file-tree">
				{#each rootItems as item (item.path)}
					<button
						class="file-item"
						class:selected={selectedFile === item.path}
						class:directory={item.type === 'directory'}
						onclick={() => handleFileClick(item)}
					>
						<span class="icon">{getFileIcon(item)}</span>
						<span class="name">{item.name}</span>
					</button>

					{#if item.type === 'directory' && expandedDirs.has(item.path)}
						<div class="nested">
							{#if dirContents[item.path]}
								{#each dirContents[item.path] as childItem (childItem.path)}
									<button
										class="file-item"
										class:selected={selectedFile === childItem.path}
										onclick={() => handleFileClick(childItem)}
									>
										<span class="icon">{getFileIcon(childItem)}</span>
										<span class="name">{childItem.name}</span>
									</button>
								{/each}
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.sidebar-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 280px;
		background: #161b22;
		color: #e6edf3;
		overflow: hidden;
	}

	.panel-section {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 1rem;
		padding: 1rem;
		overflow-y: auto;
	}

	.files-panel {
		padding: 0;
		gap: 0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-header h3 {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: #8b949e;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.btn-new {
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		background: #1f6feb;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-new:hover {
		background: #388bfd;
	}

	.new-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #0d1117;
		border-radius: 6px;
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

	.new-form input {
		padding: 0.5rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #e6edf3;
		font-size: 0.875rem;
	}

	.new-form input:focus {
		outline: none;
		border-color: #1f6feb;
	}

	.btn-create {
		padding: 0.5rem;
		background: #1f6feb;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-create:hover {
		background: #388bfd;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 2rem 1rem;
		color: #8b949e;
		font-size: 0.875rem;
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #0d1117;
		border-radius: 6px;
		border: 1px solid #30363d;
		cursor: pointer;
		transition: all 0.2s;
	}

	.list-item:hover {
		border-color: #484f58;
		transform: translateX(2px);
	}

	.list-item.active {
		border-color: #1f6feb;
		background: rgba(31, 111, 235, 0.1);
	}

	.item-info {
		flex: 1;
		min-width: 0;
	}

	.item-name {
		font-weight: 600;
		color: #e6edf3;
		font-size: 0.875rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-meta {
		font-size: 0.75rem;
		color: #8b949e;
		margin-top: 0.25rem;
	}

	.btn-delete {
		padding: 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.list-item:hover .btn-delete {
		opacity: 0.5;
	}

	.btn-delete:hover {
		opacity: 1 !important;
	}

	/* Files Section */
	.files-panel .section-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #30363d;
	}

	.file-tree {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
	}

	.file-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 1rem;
		background: transparent;
		border: none;
		color: #e6edf3;
		cursor: pointer;
		text-align: left;
		font-size: 0.875rem;
		transition: background 0.1s;
		width: 100%;
	}

	.file-item:hover {
		background: #21262d;
	}

	.file-item.selected {
		background: #1f6feb;
	}

	.file-item.directory {
		font-weight: 500;
	}

	.file-item .icon {
		flex-shrink: 0;
		font-size: 1rem;
	}

	.file-item .name {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nested {
		padding-left: 1.25rem;
	}

	/* Scrollbar */
	.panel-section::-webkit-scrollbar,
	.file-tree::-webkit-scrollbar {
		width: 10px;
	}

	.panel-section::-webkit-scrollbar-track,
	.file-tree::-webkit-scrollbar-track {
		background: #0d1117;
	}

	.panel-section::-webkit-scrollbar-thumb,
	.file-tree::-webkit-scrollbar-thumb {
		background: #30363d;
		border-radius: 5px;
	}

	.panel-section::-webkit-scrollbar-thumb:hover,
	.file-tree::-webkit-scrollbar-thumb:hover {
		background: #484f58;
	}
</style>
