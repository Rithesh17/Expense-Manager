<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import Button from './Button.svelte';
	import Card from './Card.svelte';

	interface Props {
		title: string;
		description: string;
		previewContent: any; // The preview content slot
	}

	let { title, description, previewContent }: Props = $props();
</script>

<div class="demo-preview">
	<div class="demo-header">
		<h1 class="demo-title">{title}</h1>
		<p class="demo-description">{description}</p>
		<Button 
			variant="primary" 
			size="large"
			onclick={() => goto(`${base}/login?returnTo=${encodeURIComponent(window.location.pathname)}`)}
		>
			Wanna try?
		</Button>
	</div>

	<div class="demo-preview-container">
		<div class="demo-preview-content">
			{@render previewContent()}
		</div>
	</div>
</div>

<style>
	.demo-preview {
		padding: 2rem 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.demo-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.demo-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--em-text-primary);
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.demo-description {
		font-size: 1.125rem;
		color: var(--em-text-secondary);
		margin-bottom: 2rem;
		line-height: 1.6;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.demo-header :global(.btn) {
		padding: 1rem 2rem;
		font-size: 1.25rem;
	}

	.demo-preview-container {
		background: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-lg);
		padding: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		max-width: 900px;
		margin: 0 auto;
		position: relative;
		overflow: hidden;
	}

	.demo-preview-container::before {
		content: 'Preview';
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background: var(--em-primary-bg);
		color: var(--em-primary);
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: var(--em-radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.demo-preview-content {
		transform: scale(0.85);
		transform-origin: top center;
		pointer-events: none;
		opacity: 0.9;
	}

	@media (max-width: 768px) {
		.demo-title {
			font-size: 2rem;
		}

		.demo-description {
			font-size: 1rem;
		}

		.demo-preview-container {
			padding: 1rem;
		}

		.demo-preview-content {
			transform: scale(0.75);
		}
	}
</style>
