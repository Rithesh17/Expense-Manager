<script lang="ts">
	/**
	 * Donut/Pie chart component
	 * @type {{
	 *   data: Array<{label: string, value: number, color: string}>,
	 *   size?: number,
	 *   strokeWidth?: number,
	 *   showLegend?: boolean,
	 *   showTotal?: boolean,
	 *   totalLabel?: string,
	 *   formatValue?: (value: number) => string
	 * }}
	 */
	let {
		data = [],
		size = 200,
		strokeWidth = 40,
		showLegend = true,
		showTotal = true,
		totalLabel = 'Total',
		formatValue = (v: number) => v.toFixed(0)
	} = $props();

	// Calculate total
	let total = $derived(data.reduce((sum, d) => sum + d.value, 0));

	// Calculate chart dimensions
	let radius = $derived((size - strokeWidth) / 2);
	let circumference = $derived(2 * Math.PI * radius);
	let center = $derived(size / 2);

	// Calculate segments
	let segments = $derived(() => {
		let currentOffset = 0;
		return data.map((item, index) => {
			const percentage = total > 0 ? item.value / total : 0;
			const length = circumference * percentage;
			const offset = currentOffset;
			currentOffset += length;
			
			return {
				...item,
				percentage: percentage * 100,
				length,
				offset,
				// For animation delay
				delay: index * 100
			};
		});
	});
</script>

<div class="donut-chart-container">
	<div class="chart-wrapper">
		<svg 
			width={size} 
			height={size} 
			viewBox="0 0 {size} {size}"
			class="donut-chart"
		>
			<!-- Background circle -->
			<circle
				cx={center}
				cy={center}
				r={radius}
				fill="none"
				stroke="var(--em-bg-tertiary)"
				stroke-width={strokeWidth}
			/>

			<!-- Data segments -->
			{#each segments() as segment, i}
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					stroke={segment.color}
					stroke-width={strokeWidth}
					stroke-dasharray="{segment.length} {circumference}"
					stroke-dashoffset={-segment.offset}
					transform="rotate(-90 {center} {center})"
					class="segment"
					style="animation-delay: {segment.delay}ms;"
				/>
			{/each}
		</svg>

		<!-- Center text -->
		{#if showTotal}
			<div class="center-text">
				<span class="total-value">{formatValue(total)}</span>
				<span class="total-label">{totalLabel}</span>
			</div>
		{/if}
	</div>

	<!-- Legend -->
	{#if showLegend && data.length > 0}
		<div class="legend">
			{#each segments() as segment}
				<div class="legend-item">
					<span class="legend-dot" style="background-color: {segment.color};"></span>
					<span class="legend-label">{segment.label}</span>
					<span class="legend-value">{segment.percentage.toFixed(1)}%</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.donut-chart-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.chart-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.donut-chart {
		transform: rotate(0deg);
	}

	.segment {
		animation: drawSegment 0.8s ease-out forwards;
		opacity: 0;
	}

	@keyframes drawSegment {
		from {
			opacity: 0;
			stroke-dasharray: 0;
		}
		to {
			opacity: 1;
		}
	}

	.center-text {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.total-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--em-text-primary);
		line-height: 1;
	}

	.total-label {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		margin-top: 0.25rem;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem 1.5rem;
		max-width: 100%;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}

	.legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-label {
		color: var(--em-text-secondary);
	}

	.legend-value {
		color: var(--em-text-muted);
		font-weight: 500;
	}
</style>
