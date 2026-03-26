<script>
	import { onMount } from 'svelte';

	let {
		onFileSelect = () => {}
	} = $props();

	let rootItems = $state([]);
	let expandedDirs = $state(new Set());
	let dirContents = $state({});
	let selectedFile = $state(null);

	onMount(async () => {
		await loadDirectory('');
	});

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

	function handleFileClick(item) {
		if (item.type === 'directory') {
			toggleDirectory(item);
		} else {
			selectedFile = item.path;
			onFileSelect(item);
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

	function formatFileSize(bytes) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<div class="file-explorer">
	<div class="explorer-header">
		<h3>EXPLORER</h3>
	</div>

	<div class="file-tree">
		{#each rootItems as item (item.path)}
			<div class="tree-item">
				<button
					class="file-item"
					class:selected={selectedFile === item.path}
					class:directory={item.type === 'directory'}
					onclick={() => handleFileClick(item)}
				>
					<span class="icon">{getFileIcon(item)}</span>
					<span class="name">{item.name}</span>
					{#if item.type === 'file'}
						<span class="size">{formatFileSize(item.size)}</span>
					{/if}
				</button>

				{#if item.type === 'directory' && expandedDirs.has(item.path)}
					<div class="nested">
						{#if dirContents[item.path]}
							{#each dirContents[item.path] as childItem (childItem.path)}
								<button
									class="file-item"
									class:selected={selectedFile === childItem.path}
									class:directory={childItem.type === 'directory'}
									onclick={() => handleFileClick(childItem)}
								>
									<span class="icon">{getFileIcon(childItem)}</span>
									<span class="name">{childItem.name}</span>
									{#if childItem.type === 'file'}
										<span class="size">{formatFileSize(childItem.size)}</span>
									{/if}
								</button>

								{#if childItem.type === 'directory' && expandedDirs.has(childItem.path)}
									<div class="nested">
										{#if dirContents[childItem.path]}
											{#each dirContents[childItem.path] as subItem (subItem.path)}
												<button
													class="file-item"
													class:selected={selectedFile === subItem.path}
													onclick={() => handleFileClick(subItem)}
												>
													<span class="icon">{getFileIcon(subItem)}</span>
													<span class="name">{subItem.name}</span>
													{#if subItem.type === 'file'}
														<span class="size">{formatFileSize(subItem.size)}</span>
													{/if}
												</button>
											{/each}
										{/if}
									</div>
								{/if}
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.file-explorer {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #161b22;
		border-right: 1px solid #30363d;
		color: #e6edf3;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
	}

	.explorer-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #30363d;
		background: #0d1117;
	}

	.explorer-header h3 {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: #8b949e;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.file-tree {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
	}

	.tree-item {
		display: flex;
		flex-direction: column;
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

	.icon {
		flex-shrink: 0;
		font-size: 1rem;
	}

	.name {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.size {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: #8b949e;
	}

	.nested {
		padding-left: 1.25rem;
	}

	/* Scrollbar styling */
	.file-tree::-webkit-scrollbar {
		width: 10px;
	}

	.file-tree::-webkit-scrollbar-track {
		background: #0d1117;
	}

	.file-tree::-webkit-scrollbar-thumb {
		background: #30363d;
		border-radius: 5px;
	}

	.file-tree::-webkit-scrollbar-thumb:hover {
		background: #484f58;
	}
</style>
