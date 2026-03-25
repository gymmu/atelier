<div class="hero">
	<div class="container">
		<h1 class="title">
			Willkommen im <span class="highlight">Atelier</span>
		</h1>
		<p class="description">
			Ein kreativer Raum für innovative Ideen und digitale Projekte. Hier entstehen moderne
			Webanwendungen mit modernsten Technologien.
		</p>
	</div>
</div>

<style>
	.hero {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(
			135deg,
			var(--color-bg-darker) 0%,
			var(--color-bg-dark) 50%,
			var(--color-bg-darker) 100%
		);
		position: relative;
		overflow: hidden;
	}

	.hero::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 600px;
		height: 600px;
		background: radial-gradient(
			circle,
			rgba(0, 123, 192, 0.15) 0%,
			rgba(0, 123, 192, 0.05) 30%,
			transparent 70%
		);
		border-radius: 50%;
		pointer-events: none;
	}

	.container {
		max-width: 800px;
		text-align: center;
		position: relative;
		z-index: 1;
	}

	.title {
		font-size: clamp(2.5rem, 8vw, 5rem);
		font-weight: 700;
		margin-bottom: 1.5rem;
		line-height: 1.2;
		letter-spacing: -0.02em;
		animation: fadeInUp 0.8s ease-out;
	}

	.highlight {
		color: var(--color-primary);
		position: relative;
		display: inline-block;
	}

	.highlight::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--color-primary);
		transform: scaleX(0);
		transform-origin: right;
		animation: underlineSlide 0.6s ease-out 0.4s forwards;
	}

	.description {
		font-size: clamp(1rem, 2.5vw, 1.25rem);
		color: var(--color-text-secondary);
		line-height: 1.8;
		max-width: 600px;
		margin: 0 auto;
		animation: fadeInUp 0.8s ease-out 0.2s backwards;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes underlineSlide {
		to {
			transform: scaleX(1);
			transform-origin: left;
		}
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero {
			padding: 1rem;
		}

		.title {
			margin-bottom: 1rem;
		}

		.description {
			font-size: 1rem;
		}
	}

	@media (max-width: 480px) {
		.hero::before {
			width: 300px;
			height: 300px;
		}
	}
</style>
