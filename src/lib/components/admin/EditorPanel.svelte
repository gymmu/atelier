<script>
	import MonacoEditor from '$lib/components/shared/MonacoEditor.svelte';

	let {
		openFiles = $bindable([]),
		activeFile = $bindable(null)
	} = $props();

	let fileContents = $state({});
	let unsavedChanges = $state(new Set());

	async function loadFileContent(file) {
		if (!window.electronAPI) return;

		const result = await window.electronAPI.readFile(file.path);
		if (result.success) {
			fileContents[file.path] = result.content;
		}
	}

	async function saveFile(file) {
		if (!window.electronAPI || !fileContents[file.path]) return;

		const result = await window.electronAPI.writeFile(file.path, fileContents[file.path]);
		if (result.success) {
			unsavedChanges.delete(file.path);
			unsavedChanges = new Set(unsavedChanges);
		}
	}

	function handleContentChange(file, content) {
		fileContents[file.path] = content;
		unsavedChanges.add(file.path);
		unsavedChanges = new Set(unsavedChanges);
	}

	function closeFile(file, event) {
		event?.stopPropagation();
		
		if (unsavedChanges.has(file.path)) {
			if (!confirm(`${file.name} has unsaved changes. Close anyway?`)) {
				return;
			}
		}

		openFiles = openFiles.filter((f) => f.path !== file.path);
		delete fileContents[file.path];
		unsavedChanges.delete(file.path);
		unsavedChanges = new Set(unsavedChanges);

		if (activeFile?.path === file.path) {
			activeFile = openFiles[0] || null;
		}
	}

	function getFileLanguage(fileName) {
		const ext = fileName.split('.').pop();
		switch (ext) {
			case 'json':
				return 'json';
			case 'md':
				return 'markdown';
			case 'csv':
				return 'plaintext';
			case 'js':
				return 'javascript';
			default:
				return 'plaintext';
		}
	}

	// Load content when activeFile changes
	$effect(() => {
		if (activeFile && !fileContents[activeFile.path]) {
			loadFileContent(activeFile);
		}
	});

	// Keyboard shortcuts
	function handleKeydown(event) {
		// Ctrl+S / Cmd+S to save
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			if (activeFile) {
				saveFile(activeFile);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="editor-panel">
	{#if openFiles.length === 0}
		<div class="empty-state">
			<div class="icon">📁</div>
			<h2>No file opened</h2>
			<p>Select a file from the explorer to start editing</p>
		</div>
	{:else}
		<div class="tabs">
			{#each openFiles as file (file.path)}
				<div
					class="tab"
					class:active={activeFile?.path === file.path}
					class:unsaved={unsavedChanges.has(file.path)}
				>
					<button class="tab-button" onclick={() => (activeFile = file)}>
						<span class="tab-name">{file.name}</span>
						{#if unsavedChanges.has(file.path)}
							<span class="unsaved-indicator">●</span>
						{/if}
					</button>
					<button class="close-btn" onclick={(e) => closeFile(file, e)}>✕</button>
				</div>
			{/each}
		</div>

		<div class="editor-container">
			{#if activeFile}
				<div class="editor-header">
					<span class="file-path">{activeFile.path}</span>
					<div class="actions">
						{#if unsavedChanges.has(activeFile.path)}
							<button class="btn-save" onclick={() => saveFile(activeFile)}>
								💾 Save
							</button>
						{/if}
					</div>
				</div>

				<div class="editor-content">
					{#if fileContents[activeFile.path] !== undefined}
						<MonacoEditor
							bind:value={fileContents[activeFile.path]}
							language={getFileLanguage(activeFile.name)}
							onChange={(content) => handleContentChange(activeFile, content)}
						/>
					{:else}
						<div class="loading">Loading...</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.editor-panel {
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
		padding: 0.5rem 1rem;
		background: #161b22;
		border-bottom: 1px solid #30363d;
	}

	.file-path {
		font-size: 0.75rem;
		color: #8b949e;
		font-family: 'Courier New', monospace;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-save {
		padding: 0.375rem 0.75rem;
		background: #1f6feb;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.1s;
	}

	.btn-save:hover {
		background: #388bfd;
	}

	.editor-content {
		flex: 1;
		overflow: hidden;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #8b949e;
	}

	/* Tabs scrollbar */
	.tabs::-webkit-scrollbar {
		height: 6px;
	}

	.tabs::-webkit-scrollbar-track {
		background: #161b22;
	}

	.tabs::-webkit-scrollbar-thumb {
		background: #30363d;
		border-radius: 3px;
	}

	.tabs::-webkit-scrollbar-thumb:hover {
		background: #484f58;
	}
</style>
