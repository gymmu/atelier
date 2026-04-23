<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { classesStore } from '$lib/stores/classes.svelte.js';
	import { studentsStore } from '$lib/stores/students.svelte.js';
	import { lektionenStore } from '$lib/stores/lektionen.svelte.js';
	import ActivityBar from '$lib/components/admin/ActivityBar.svelte';
	import SidebarPanel from '$lib/components/admin/SidebarPanel.svelte';
	import UnifiedEditor from '$lib/components/admin/UnifiedEditor.svelte';
	import LektionEditor from '$lib/components/admin/lektionen/LektionEditor.svelte';
	import WelcomeScreen from '$lib/components/admin/WelcomeScreen.svelte';

	let hasWorkingDirectory = $state(false);
	let workingDirectoryPath = $state(null);
	let openItems = $state([]);
	let activeItem = $state(null);
	let activeView = $state('lektionen');
	let loading = $state(true);

	onMount(async () => {
		await checkWorkingDirectory();
		await scheduleStore.init();
		await classesStore.init();
		await studentsStore.init();
		await lektionenStore.init();
	});

	async function checkWorkingDirectory() {
		if (!window.electronAPI) {
			loading = false;
			return;
		}

		const path = await window.electronAPI.getWorkingDirectory();
		
		if (path) {
			workingDirectoryPath = path;
			hasWorkingDirectory = true;
		}
		
		loading = false;
	}

	async function handleDirectorySelect(path) {
		if (!window.electronAPI) return;

		// Set the working directory
		const newPath = await window.electronAPI.chooseWorkingDirectory();
		if (newPath) {
			workingDirectoryPath = newPath;
			hasWorkingDirectory = true;
			
			// Reload the page to refresh file explorer
			window.location.reload();
		}
	}

	function handlePlanSelect(plan) {
		// Check if plan is already open
		const existing = openItems.find((i) => i.type === 'plan' && i.id === plan.id);
		
		if (existing) {
			activeItem = existing;
		} else {
			const planItem = { ...plan, type: 'plan' };
			openItems = [...openItems, planItem];
			activeItem = planItem;
		}
	}

	function handleFileSelect(file) {
		// Check if file is already open
		const existing = openItems.find((i) => i.type === 'file' && i.path === file.path);
		
		if (existing) {
			activeItem = existing;
		} else {
			const fileItem = { ...file, type: 'file' };
			openItems = [...openItems, fileItem];
			activeItem = fileItem;
		}
	}

	function handleNewPlan(plan) {
		handlePlanSelect(plan);
	}

	function handleClassSelect(classItem) {
		// Check if class is already open
		const existing = openItems.find((i) => i.type === 'class' && i.id === classItem.id);
		
		if (existing) {
			activeItem = existing;
		} else {
			const item = { ...classItem, type: 'class' };
			openItems = [...openItems, item];
			activeItem = item;
		}
	}

	function handleNewClass(classItem) {
		handleClassSelect(classItem);
	}

	function handleRunPlan(plan) {
		// Set the plan as current
		scheduleStore.setCurrentSchedule(plan.id);
		
		// Open beamer view
		if (window.electronAPI) {
			window.electronAPI.openDisplayWindow();
		} else {
			window.open('/display', '_blank');
		}
	}

	function handleLektionSelect(filename) {
		lektionenStore.selectLektion(filename);
	}

	function handleNewLektion(filename) {
		// Lektion ist bereits im Store gewählt
	}

	function handleRunLektion(lektion) {
		scheduleStore.setCurrentLektion(lektion);
		if (window.electronAPI) {
			window.electronAPI.openDisplayWindow();
		} else {
			window.open('/display', '_blank');
		}
	}

	async function handleChangeDirectory() {
		await handleDirectorySelect();
	}

	function handleViewChange(view) {
		activeView = view;
	}
</script>

<svelte:head>
	<title>Atelier</title>
</svelte:head>

{#if loading}
	<div class="loading-screen">
		<div class="spinner"></div>
		<p>Lade...</p>
	</div>
{:else if !hasWorkingDirectory}
	<WelcomeScreen onDirectorySelect={handleDirectorySelect} />
{:else}
	<div class="admin-page">
		<header class="app-header">
			<div class="header-left">
				<h1>Atelier</h1>
				<span class="working-dir" title={workingDirectoryPath}>
					📁 {workingDirectoryPath?.split('/').pop() || 'Kein Verzeichnis'}
				</span>
			</div>
			
			<div class="header-actions">
				<button class="btn btn-secondary" onclick={handleChangeDirectory}>
					📁 Verzeichnis wechseln
				</button>
				<button
					class="btn btn-display"
					onclick={() => window.electronAPI ? window.electronAPI.openDisplayWindow() : window.open('/display', '_blank')}
				>
					🖥️ Beamer-Ansicht
				</button>
			</div>
		</header>

		<main class="main-content">
			<ActivityBar bind:activeView onViewChange={handleViewChange} />
			
			<aside class="sidebar">
				<SidebarPanel
					{activeView}
					onPlanSelect={handlePlanSelect}
					onClassSelect={handleClassSelect}
					onFileSelect={handleFileSelect}
					onNewPlan={handleNewPlan}
					onNewClass={handleNewClass}
					onLektionSelect={handleLektionSelect}
					onNewLektion={handleNewLektion}
				/>
			</aside>

			<section class="editor-area">
				{#if activeView === 'lektionen'}
					<LektionEditor onRunLektion={handleRunLektion} />
				{:else}
					<UnifiedEditor
						bind:openItems
						bind:activeItem
						onRunPlan={handleRunPlan}
					/>
				{/if}
			</section>
		</main>
	</div>
{/if}

<style>
	.loading-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background: #0d1117;
		color: #e6edf3;
		gap: 1rem;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid #30363d;
		border-top-color: #1f6feb;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.admin-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #0d1117;
		color: #e6edf3;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial,
			sans-serif;
	}

	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.5rem;
		background: #161b22;
		border-bottom: 1px solid #30363d;
		height: 3rem;
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-left h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #e6edf3;
	}

	.working-dir {
		font-size: 0.875rem;
		color: #8b949e;
		max-width: 300px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
		background: transparent;
		color: #e6edf3;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: #e6edf3;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn-display {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-display:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.main-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.sidebar {
		flex-shrink: 0;
		overflow: hidden;
	}

	.editor-area {
		flex: 1;
		overflow: hidden;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.sidebar {
			width: 240px;
		}

		.working-dir {
			display: none;
		}
	}
</style>
