<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import UnifiedSidebar from '$lib/components/admin/UnifiedSidebar.svelte';
	import UnifiedEditor from '$lib/components/admin/UnifiedEditor.svelte';

	let openItems = $state([]);
	let activeItem = $state(null);

	onMount(async () => {
		await scheduleStore.init();
	});

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
</script>

<svelte:head>
	<title>Main View - Atelier</title>
</svelte:head>

<div class="main-view">
	<header class="app-header">
		<div class="header-left">
			<h1>Atelier</h1>
		</div>
		
		<div class="header-actions">
			<button
				class="btn btn-display"
				onclick={() => window.electronAPI ? window.electronAPI.openDisplayWindow() : window.open('/display', '_blank')}
			>
				🖥️ Beamer-Ansicht
			</button>
			<a href="{base}/" class="btn btn-secondary">
				← Home
			</a>
		</div>
	</header>

	<main class="main-content">
		<aside class="sidebar">
			<UnifiedSidebar
				onPlanSelect={handlePlanSelect}
				onFileSelect={handleFileSelect}
				onNewPlan={handleNewPlan}
			/>
		</aside>

		<section class="editor-area">
			<UnifiedEditor
				bind:openItems
				bind:activeItem
				onRunPlan={handleRunPlan}
			/>
		</section>
	</main>
</div>

<style>
	.main-view {
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

	.header-left h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #e6edf3;
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
		width: 280px;
		flex-shrink: 0;
		border-right: 1px solid #30363d;
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
	}
</style>
