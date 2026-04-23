<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { lektionenStore } from '$lib/stores/lektionen.svelte.js';
	import { gruppiereNachKW } from '$lib/utils/lektion-parser.js';

	let { isOpen = $bindable(false) } = $props();

	let activeTab = $state('lektionen');

	function handleSelectSchedule(id) {
		scheduleStore.setCurrentSchedule(id);
		isOpen = false;
	}

	async function handleSelectLektion(filename) {
		const lektion = await lektionenStore.loadLektion(filename);
		if (lektion) {
			scheduleStore.setCurrentLektion(lektion);
		}
		isOpen = false;
	}

	let schedules = $derived(scheduleStore.schedules);
	let currentScheduleId = $derived(scheduleStore.currentScheduleId);
	let lektionen = $derived(lektionenStore.list);
	let lektionenNachKW = $derived(gruppiereNachKW(lektionen));
	let sortedKWs = $derived([...lektionenNachKW.keys()].sort((a, b) => b - a));
</script>

<div class="schedule-selector" class:open={isOpen}>
	<div class="selector-header">
		<h3>Auswahl</h3>
		<button class="btn-close" onclick={() => (isOpen = false)} title="Schließen">
			✕
		</button>
	</div>

	<div class="tabs">
		<button class="tab" class:active={activeTab === 'lektionen'} onclick={() => (activeTab = 'lektionen')}>
			Lektionen
		</button>
		<button class="tab" class:active={activeTab === 'plaene'} onclick={() => (activeTab = 'plaene')}>
			Pläne
		</button>
	</div>

	<div class="list">
		{#if activeTab === 'lektionen'}
			{#if lektionen.length === 0}
				<div class="empty-state">
					<p>Keine Lektionen vorhanden.</p>
				</div>
			{:else}
				{#each sortedKWs as kw}
					<div class="kw-group">
						<div class="kw-label">KW {kw}</div>
						{#each lektionenNachKW.get(kw) as l (l.filename)}
							{@const isActive = scheduleStore.currentScheduleId === l.filename}
							<button
								class="item"
								class:active={isActive}
								onclick={() => handleSelectLektion(l.filename)}
							>
								<div class="item-info">
									<div class="item-name">{l.fach} {l.klasse}</div>
									<div class="item-meta">{l.datum} · {l.wochentag} · {l.lektionszahl}. Lektion</div>
								</div>
								{#if isActive}
									<div class="active-indicator">✓</div>
								{/if}
							</button>
						{/each}
					</div>
				{/each}
			{/if}
		{:else}
			{#if schedules.length === 0}
				<div class="empty-state">
					<p>Keine Pläne vorhanden.</p>
				</div>
			{:else}
				{#each schedules as schedule (schedule.id)}
					<button
						class="item"
						class:active={schedule.id === currentScheduleId}
						onclick={() => handleSelectSchedule(schedule.id)}
					>
						<div class="item-info">
							<div class="item-name">{schedule.name}</div>
							<div class="item-meta">
								{schedule.phases.length} Phasen
								{#if schedule.phases.length > 0}
									· {Math.round(schedule.phases.reduce((sum, p) => sum + p.duration, 0) / 60)} Min.
								{/if}
							</div>
						</div>
						{#if schedule.id === currentScheduleId}
							<div class="active-indicator">✓</div>
						{/if}
					</button>
				{/each}
			{/if}
		{/if}
	</div>
</div>

{#if isOpen}
	<button class="overlay" onclick={() => (isOpen = false)} aria-label="Schließen"></button>
{/if}

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		border: none;
		cursor: pointer;
		backdrop-filter: blur(2px);
	}

	.schedule-selector {
		position: fixed;
		top: 0;
		right: -420px;
		width: 420px;
		height: 100vh;
		background: var(--color-bg-dark);
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		transition: right 0.3s ease;
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
	}

	.schedule-selector.open {
		right: 0;
	}

	.selector-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: var(--color-bg-darker);
	}

	h3 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--color-text);
		font-weight: 700;
	}

	.btn-close {
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: var(--color-text);
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-close:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tab {
		flex: 1;
		padding: 0.875rem;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab:hover {
		color: var(--color-text);
		background: rgba(255, 255, 255, 0.04);
	}

	.tab.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}

	.list {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.kw-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.kw-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
		padding: 0.25rem 0.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1.5rem;
		color: var(--color-text-secondary);
	}

	.empty-state p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: var(--color-bg-darker);
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.05);
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
	}

	.item:hover {
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateX(-4px);
		background: rgba(255, 255, 255, 0.03);
	}

	.item.active {
		border-color: var(--color-primary);
		background: rgba(0, 123, 192, 0.15);
	}

	.item.active:hover {
		background: rgba(0, 123, 192, 0.2);
	}

	.item-info {
		flex: 1;
		min-width: 0;
	}

	.item-name {
		font-weight: 600;
		font-size: 1rem;
		color: var(--color-text);
		margin-bottom: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-meta {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
	}

	.active-indicator {
		font-size: 1.25rem;
		color: var(--color-primary);
		line-height: 1;
	}

	.list::-webkit-scrollbar {
		width: 8px;
	}

	.list::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
	}

	.list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.list::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
