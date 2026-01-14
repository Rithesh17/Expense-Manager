<script lang="ts">
	/**
	 * Bar chart component for spending over time
	 * @type {{
	 *   data: Array<{label: string, value: number, color?: string}>,
	 *   height?: number,
	 *   barColor?: string,
	 *   showLabels?: boolean,
	 *   showValues?: boolean,
	 *   formatValue?: (value: number) => string
	 * }}
	 */
	let {
		data = [],
		height = 200,
		barColor = 'var(--em-primary)',
		showLabels = true,
		showValues = true,
		formatValue = (v: number) => v.toFixed(0)
	} = $props();

	// Calculate max value for scaling
	let maxValue = $derived(Math.max(...data.map(d => d.value), 1));

	// Calculate bar dimensions
	let barGap = 8;
	let labelHeight = $derived(showLabels ? 24 : 0);
	let valueHeight = $derived(showValues ? 20 : 0);
	let chartHeight = $derived(height - labelHeight - valueHeight);

	// Get bar height percentage
	function getBarHeight(value: number): number {
		return (value / maxValue) * 100;
	}
</script>

<div class="bar-chart" style="height: {height}px;">
	<div class="bars-container" style="height: {chartHeight}px;">
		{#each data as item, index}
			{@const barHeight = getBarHeight(item.value)}
			<div class="bar-wrapper">
				{#if showValues}
					<div class="bar-value" class:visible={item.value > 0}>
						{formatValue(item.value)}
					</div>
				{/if}
				<div 
					class="bar"
					style="
						height: {barHeight}%;
						background-color: {item.color || barColor};
						animation-delay: {index * 50}ms;
					"
				>
				</div>
			</div>
		{/each}
	</div>

	{#if showLabels}
		<div class="labels-container">
			{#each data as item}
				<div class="bar-label">{item.label}</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.bar-chart {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.bars-container {
		display: flex;
		align-items: flex-end;
		gap: 4px;
		flex: 1;
	}

	.bar-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
		min-width: 0;
	}

	.bar-value {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--em-text-muted);
		margin-bottom: 0.25rem;
		opacity: 0;
		transition: opacity 0.3s ease;
		white-space: nowrap;
	}

	.bar-value.visible {
		opacity: 1;
	}

	.bar-wrapper:hover .bar-value {
		opacity: 1;
		color: var(--em-text-primary);
	}

	.bar {
		width: 100%;
		max-width: 40px;
		min-height: 2px;
		border-radius: 4px 4px 0 0;
		animation: growBar 0.5s ease-out forwards;
		transform-origin: bottom;
		transform: scaleY(0);
		transition: opacity 0.2s ease;
	}

	.bar-wrapper:hover .bar {
		opacity: 0.8;
	}

	@keyframes growBar {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}

	.labels-container {
		display: flex;
		gap: 4px;
		padding-top: 0.5rem;
	}

	.bar-label {
		flex: 1;
		text-align: center;
		font-size: 0.625rem;
		color: var(--em-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
