<script>
	import { formatTime, getRemainingTime } from '$lib/utils/timer.js';
	import { onMount, onDestroy } from 'svelte';

	let {
		startTime,
		duration,
		isPaused = false,
		pausedAt = null,
		size = 'medium',
		showProgress = false
	} = $props();

	let remaining = $state(0);
	let interval = null;

	function updateRemaining() {
		remaining = getRemainingTime(startTime, duration, isPaused, pausedAt);
	}

	onMount(() => {
		updateRemaining();
		interval = setInterval(updateRemaining, 1000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	let isExpired = $derived(remaining <= 0);
	let progress = $derived((duration * 60 * 1000 - remaining) / (duration * 60 * 1000) * 100);
</script>

<div class="timer" class:small={size === 'small'} class:large={size === 'large'} class:expired={isExpired}>
	<span class="time">{formatTime(remaining)}</span>
	{#if showProgress}
		<div class="progress-bar">
			<div class="progress-fill" style="width: {progress}%"></div>
		</div>
	{/if}
</div>

<style>
	.timer {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.time {
		font-family: 'Courier New', monospace;
		font-weight: 600;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.timer.small .time {
		font-size: 1rem;
	}

	.timer.large .time {
		font-size: 3rem;
	}

	.timer.expired .time {
		color: #f44336;
		animation: pulse 1s infinite;
	}

	.progress-bar {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		transition: width 0.3s ease;
	}

	.expired .progress-fill {
		background: #f44336;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
