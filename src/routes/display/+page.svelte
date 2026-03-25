<script>
	import { scheduleStore } from '$lib/stores/schedule.svelte.js';
	import { onMount } from 'svelte';
	import CurrentPhase from '$lib/components/display/CurrentPhase.svelte';
	import ProgressBar from '$lib/components/display/ProgressBar.svelte';
	import TimerControl from '$lib/components/display/TimerControl.svelte';
	import NextPhase from '$lib/components/display/NextPhase.svelte';

	let currentTime = $state(new Date());
	let timeInterval;

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
		<div class="schedule-info">
			{#if currentSchedule}
				<h1>{currentSchedule.name}</h1>
				{#if lessonStartTime && lessonEndTime}
					<div class="lesson-time">
						<span class="lesson-time-icon">🕐</span>
						<span class="lesson-time-text">Lektion: {lessonStartTime} - {lessonEndTime}</span>
					</div>
				{/if}
			{:else}
				<h1>Atelier</h1>
			{/if}
		</div>
		<div class="time-info">
			<div class="time">{formattedTime}</div>
			<div class="date">{formattedDate}</div>
		</div>
	</header>

	<main class="display-content">
		<div class="main-section">
			<CurrentPhase />
			<ProgressBar />
			<NextPhase />
		</div>

		<div class="side-section">
			<TimerControl />
		</div>
	</main>

	<footer class="display-footer">
		<div class="instructions">
			💡 Tipp: Drücken Sie F11 für Vollbildmodus
		</div>
	</footer>
</div>

<style>
	:global(body) {
		overflow: hidden;
	}

	.display-page {
		min-height: 100vh;
		background: var(--color-bg-darker);
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		gap: 1.5rem;
	}

	.display-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		background: var(--color-bg-dark);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.schedule-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.schedule-info h1 {
		margin: 0;
		font-size: 2rem;
		color: var(--color-text);
		font-weight: 700;
	}

	.lesson-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(0, 123, 192, 0.15);
		border-radius: 6px;
		border: 1px solid rgba(0, 123, 192, 0.3);
	}

	.lesson-time-icon {
		font-size: 1.25rem;
	}

	.lesson-time-text {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary);
		font-family: 'Courier New', monospace;
	}

	.time-info {
		text-align: right;
	}

	.time {
		font-size: 2.5rem;
		font-weight: 700;
		font-family: 'Courier New', monospace;
		color: var(--color-primary);
		line-height: 1;
		margin-bottom: 0.25rem;
	}

	.date {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		text-transform: capitalize;
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
	}

	.side-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
	}

	.display-footer {
		padding: 1rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		text-align: center;
	}

	.instructions {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
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
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
			padding: 1rem;
		}

		.schedule-info h1 {
			font-size: 1.25rem;
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
