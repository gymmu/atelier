<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { onMount } from 'svelte';
	import CurrentPhase from '$lib/components/display/CurrentPhase.svelte';
	import ProgressBar from '$lib/components/display/ProgressBar.svelte';
	import TimerControl from '$lib/components/display/TimerControl.svelte';
	import SessionControls from '$lib/components/display/SessionControls.svelte';
	import ScheduleSelector from '$lib/components/display/ScheduleSelector.svelte';
	import SessionOutline from '$lib/components/display/SessionOutline.svelte';

	let currentTime = $state(new Date());
	let timeInterval;
	let scheduleSelectorOpen = $state(false);

	onMount(() => {
		// Update time every second
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		return () => {
			if (timeInterval) clearInterval(timeInterval);
		};
	});

	let currentSchedule = $derived(scheduleStore.currentSchedule);

	let formattedTime = $derived(
		currentTime.toLocaleTimeString('de-CH', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})
	);

	let formattedDate = $derived(
		currentTime.toLocaleDateString('de-CH', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	// Berechne Lektionszeiten
	let lessonStartTime = $derived.by(() => {
		if (!currentSchedule || !currentSchedule.startTime) return null;
		return currentSchedule.startTime;
	});

	let lessonEndTime = $derived.by(() => {
		if (!currentSchedule || !currentSchedule.startTime || !currentSchedule.phases.length) return null;
		
		const [hours, minutes] = currentSchedule.startTime.split(':').map(Number);
		const startDate = new Date();
		startDate.setHours(hours, minutes, 0, 0);
		
		const totalMinutes = currentSchedule.phases.reduce((sum, p) => sum + p.duration, 0);
		const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);
		
		return endDate.toLocaleTimeString('de-CH', {
			hour: '2-digit',
			minute: '2-digit'
		});
	});
</script>

<svelte:head>
	<title>Beamer-Ansicht - Atelier</title>
</svelte:head>

<div class="display-page">
	<header class="display-header">
		<div class="header-left">
			{#if currentSchedule}
				<h1>{currentSchedule.name}</h1>
			{:else}
				<h1>Atelier</h1>
			{/if}
		</div>
		
		<div class="header-center">
			{#if lessonStartTime && lessonEndTime}
				<div class="lesson-time">
					🕐 {lessonStartTime} - {lessonEndTime}
				</div>
			{/if}
		</div>
		
		<div class="header-right">
			<button 
				class="btn-change-schedule" 
				onclick={() => (scheduleSelectorOpen = true)}
				title={currentSchedule ? "Zeitplan wechseln" : "Zeitplan auswählen"}
			>
				📋
			</button>
			<div class="time-info">
				<div class="time">{formattedTime}</div>
				<div class="date">{formattedDate}</div>
			</div>
		</div>
	</header>

	<main class="display-content">
		<div class="main-section">
			<CurrentPhase />
			<ProgressBar />
		</div>

		<div class="side-section">
			<SessionControls />
			<SessionOutline />
			<TimerControl />
		</div>
	</main>
</div>

<ScheduleSelector bind:isOpen={scheduleSelectorOpen} />

<style>
	:global(body) {
		overflow: hidden;
	}

	.display-page {
		height: 100vh;
		background: var(--color-bg-darker);
		display: flex;
		flex-direction: column;
		padding: 1rem;
		gap: 1rem;
		overflow: hidden;
	}

	.display-header {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 1.5rem;
		padding: 0.875rem 1.5rem;
		background: var(--color-bg-dark);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		flex-shrink: 0;
	}

	.header-left h1 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--color-text);
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.header-center {
		display: flex;
		justify-content: center;
	}

	.lesson-time {
		padding: 0.5rem 1rem;
		background: rgba(0, 123, 192, 0.15);
		border-radius: 6px;
		border: 1px solid rgba(0, 123, 192, 0.3);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		font-family: 'Courier New', monospace;
		white-space: nowrap;
	}

	.header-right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
	}

	.btn-change-schedule {
		padding: 0.5rem;
		width: 2.5rem;
		height: 2.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: var(--color-text);
		font-size: 1.25rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.btn-change-schedule:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}

	.time-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.125rem;
	}

	.time {
		font-size: 1.75rem;
		font-weight: 700;
		font-family: 'Courier New', monospace;
		color: var(--color-primary);
		line-height: 1;
	}

	.date {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		text-transform: capitalize;
		white-space: nowrap;
	}

	.display-content {
		flex: 1;
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
		min-height: 0;
	}

	.main-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE and Edge */
	}

	/* Scrollbar verstecken für Webkit-Browser (Chrome, Safari) */
	.main-section::-webkit-scrollbar {
		display: none;
	}

	.side-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE and Edge */
	}

	/* Scrollbar verstecken für Webkit-Browser (Chrome, Safari) */
	.side-section::-webkit-scrollbar {
		display: none;
	}

	/* Responsive Design */
	@media (max-width: 1400px) {
		.display-page {
			padding: 1rem;
			gap: 1rem;
		}

		.display-header {
			padding: 1rem 1.5rem;
		}

		.schedule-info h1 {
			font-size: 1.5rem;
		}

		.time {
			font-size: 2rem;
		}

		.display-content {
			gap: 1rem;
		}

		.main-section,
		.side-section {
			gap: 1rem;
		}
	}

	@media (max-width: 1024px) {
		.display-content {
			grid-template-columns: 1fr;
		}

		.side-section {
			max-height: 400px;
		}
	}

	@media (max-width: 768px) {
		.display-page {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.display-header {
			grid-template-columns: 1fr;
			gap: 0.75rem;
			padding: 0.75rem;
		}

		.header-left h1 {
			font-size: 1.25rem;
		}

		.header-center {
			justify-content: flex-start;
		}

		.lesson-time {
			font-size: 0.875rem;
			padding: 0.375rem 0.75rem;
		}

		.header-right {
			justify-content: space-between;
		}

		.time {
			font-size: 1.5rem;
		}

		.date {
			font-size: 0.6875rem;
		}

		.btn-change-schedule {
			width: 2.25rem;
			height: 2.25rem;
			font-size: 1.125rem;
		}

		.lesson-time {
			padding: 0.375rem 0.75rem;
		}

		.lesson-time-icon {
			font-size: 1rem;
		}

		.lesson-time-text {
			font-size: 0.875rem;
		}

		.time-info {
			text-align: left;
			width: 100%;
		}

		.time {
			font-size: 1.75rem;
		}

		.date {
			font-size: 0.75rem;
		}

		.display-footer {
			padding: 0.75rem;
		}

		.instructions {
			font-size: 0.75rem;
		}
	}

	/* Fullscreen optimizations */
	@media (min-width: 1920px) {
		.display-header {
			padding: 2rem 3rem;
		}

		.schedule-info h1 {
			font-size: 2.5rem;
		}

		.time {
			font-size: 3rem;
		}

		.date {
			font-size: 1rem;
		}
	}
</style>
