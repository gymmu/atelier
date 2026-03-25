<script>
	import { PREDEFINED_PHASES } from '$lib/utils/constants.js';

	let { phaseName, size = 'medium' } = $props();

	let phaseInfo = $derived(
		PREDEFINED_PHASES.find((p) => p.name === phaseName) || {
			icon: '📋',
			color: '#607D8B'
		}
	);
</script>

<div
	class="phase-icon"
	class:tiny={size === 'tiny'}
	class:small={size === 'small'}
	class:large={size === 'large'}
	style="--phase-color: {phaseInfo.color}"
>
	<span class="icon">{phaseInfo.icon}</span>
</div>

<style>
	.phase-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background: var(--phase-color);
		border-radius: 50%;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.phase-icon.tiny {
		width: 1.5rem;
		height: 1.5rem;
	}

	.phase-icon.small {
		width: 2rem;
		height: 2rem;
	}

	.phase-icon.large {
		width: 5rem;
		height: 5rem;
	}

	.icon {
		font-size: 1.5rem;
	}

	.phase-icon.tiny .icon {
		font-size: 0.75rem;
	}

	.phase-icon.small .icon {
		font-size: 1rem;
	}

	.phase-icon.large .icon {
		font-size: 2.5rem;
	}
</style>
