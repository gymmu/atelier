<script>
	/**
	 * ActivityBar - VS Code-style Icon Sidebar
	 * Vertikale Icon-Leiste für Navigation zwischen Hauptbereichen
	 */
	
	let {
		activeView = $bindable('lektionen'),
		onViewChange = () => {}
	} = $props();

	const views = [
		{ id: 'lektionen', icon: '📅', label: 'Lektionen', description: 'Lektionspläne (YAML)' },
		{ id: 'plans', icon: '📋', label: 'Pläne', description: 'Zeitpläne verwalten' },
		{ id: 'classes', icon: '🎓', label: 'Klassen', description: 'Klassen und Schüler verwalten' },
		{ id: 'files', icon: '📁', label: 'Dateien', description: 'Dateien durchsuchen' }
	];

	function handleViewClick(viewId) {
		activeView = viewId;
		onViewChange(viewId);
	}
</script>

<div class="activity-bar">
	{#each views as view (view.id)}
		<button
			class="activity-item"
			class:active={activeView === view.id}
			onclick={() => handleViewClick(view.id)}
			title={view.description}
			aria-label={view.label}
		>
			<span class="icon">{view.icon}</span>
			<span class="label">{view.label}</span>
		</button>
	{/each}
</div>

<style>
	.activity-bar {
		display: flex;
		flex-direction: column;
		width: 50px;
		background: #161b22;
		border-right: 1px solid #30363d;
		flex-shrink: 0;
	}

	.activity-item {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.75rem 0;
		background: transparent;
		border: none;
		border-left: 2px solid transparent;
		color: #8b949e;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
	}

	.activity-item:hover {
		color: #e6edf3;
		background: rgba(255, 255, 255, 0.05);
	}

	.activity-item.active {
		color: #1f6feb;
		border-left-color: #1f6feb;
		background: rgba(31, 111, 235, 0.1);
	}

	.activity-item .icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.activity-item .label {
		font-size: 0.625rem;
		font-weight: 500;
		text-align: center;
		line-height: 1;
	}

	/* Tooltip bei Hover */
	.activity-item::after {
		content: attr(title);
		position: absolute;
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-left: 0.5rem;
		padding: 0.375rem 0.75rem;
		background: #21262d;
		border: 1px solid #30363d;
		border-radius: 6px;
		color: #e6edf3;
		font-size: 0.75rem;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s;
		z-index: 100;
	}

	.activity-item:hover::after {
		opacity: 1;
	}
</style>
