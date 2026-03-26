<script>
	import { onMount } from 'svelte';

	let {
		onDirectorySelect = () => {}
	} = $props();

	let recentDirectories = $state([]);
	let loading = $state(true);

	onMount(async () => {
		if (window.electronAPI) {
			const recent = await window.electronAPI.getRecentDirectories();
			recentDirectories = recent || [];
			loading = false;
		}
	});

	async function handleChooseDirectory() {
		if (!window.electronAPI) return;

		const newPath = await window.electronAPI.chooseWorkingDirectory();
		if (newPath) {
			onDirectorySelect(newPath);
		}
	}

	function handleSelectRecent(dir) {
		onDirectorySelect(dir.path);
	}

	function formatDate(timestamp) {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'gerade eben';
		if (diffMins < 60) return `vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`;
		if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
		if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;

		return date.toLocaleDateString('de-DE');
	}
</script>

<div class="welcome-screen">
	<div class="welcome-content">
		<div class="logo">📚</div>
		<h1>Atelier</h1>
		<p class="subtitle">Wählen Sie ein Arbeitsverzeichnis um zu beginnen</p>

		<button class="btn-primary" onclick={handleChooseDirectory}>
			📁 Verzeichnis öffnen
		</button>

		{#if !loading && recentDirectories.length > 0}
			<div class="recent-section">
				<h2>Zuletzt geöffnet</h2>
				<div class="recent-list">
					{#each recentDirectories as dir (dir.path)}
						<button class="recent-item" onclick={() => handleSelectRecent(dir)}>
							<div class="recent-icon">📁</div>
							<div class="recent-info">
								<div class="recent-name">{dir.name}</div>
								<div class="recent-path">{dir.path}</div>
							</div>
							<div class="recent-time">{formatDate(dir.lastAccessed)}</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.welcome-screen {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		background: #0d1117;
		color: #e6edf3;
		padding: 2rem;
	}

	.welcome-content {
		max-width: 600px;
		width: 100%;
		text-align: center;
	}

	.logo {
		font-size: 5rem;
		margin-bottom: 1rem;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 3rem;
		font-weight: 700;
		color: #e6edf3;
	}

	.subtitle {
		margin: 0 0 2rem;
		font-size: 1.125rem;
		color: #8b949e;
	}

	.btn-primary {
		padding: 1rem 2rem;
		background: #1f6feb;
		border: none;
		border-radius: 8px;
		color: white;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 12px rgba(31, 111, 235, 0.3);
	}

	.btn-primary:hover {
		background: #388bfd;
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(31, 111, 235, 0.4);
	}

	.recent-section {
		margin-top: 3rem;
		text-align: left;
	}

	.recent-section h2 {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #8b949e;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.recent-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.recent-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.recent-item:hover {
		background: #21262d;
		border-color: #1f6feb;
		transform: translateX(4px);
	}

	.recent-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.recent-info {
		flex: 1;
		min-width: 0;
	}

	.recent-name {
		font-weight: 600;
		color: #e6edf3;
		font-size: 1rem;
		margin-bottom: 0.25rem;
	}

	.recent-path {
		font-size: 0.75rem;
		color: #8b949e;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-family: 'Courier New', monospace;
	}

	.recent-time {
		font-size: 0.75rem;
		color: #8b949e;
		flex-shrink: 0;
	}
</style>
