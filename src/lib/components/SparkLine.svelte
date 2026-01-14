<script lang="ts">
	/**
	 * Sparkline/mini line chart component
	 * @type {{
	 *   data: number[],
	 *   width?: number,
	 *   height?: number,
	 *   color?: string,
	 *   fillColor?: string,
	 *   strokeWidth?: number,
	 *   showDots?: boolean,
	 *   showArea?: boolean
	 * }}
	 */
	let {
		data = [],
		width = 120,
		height = 40,
		color = 'var(--em-primary)',
		fillColor = '',
		strokeWidth = 2,
		showDots = false,
		showArea = true
	} = $props();

	// Calculate bounds
	let minValue = $derived(Math.min(...data, 0));
	let maxValue = $derived(Math.max(...data, 1));
	let range = $derived(maxValue - minValue || 1);

	// Padding for stroke
	let padding = $derived(strokeWidth + 2);

	// Calculate points
	let points = $derived(() => {
		if (data.length < 2) return [];
		const pad = padding;
		const chartWidth = width - pad * 2;
		const chartHeight = height - pad * 2;
		const stepX = chartWidth / (data.length - 1);
		
		return data.map((value, index) => {
			const x = pad + index * stepX;
			const y = pad + chartHeight - ((value - minValue) / range) * chartHeight;
			return { x, y, value };
		});
	});

	// Create SVG path
	let linePath = $derived(() => {
		const pts = points;
		if (pts.length < 2) return '';
		return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
	});

	// Create area path (for fill)
	let areaPath = $derived(() => {
		const pts = points;
		if (pts.length < 2) return '';
		const chartBottom = height - padding;
		return `${linePath} L ${pts[pts.length - 1].x} ${chartBottom} L ${pts[0].x} ${chartBottom} Z`;
	});

	// Determine trend
	let trend = $derived(() => {
		if (data.length < 2) return 'neutral';
		const first = data[0];
		const last = data[data.length - 1];
		if (last > first) return 'up';
		if (last < first) return 'down';
		return 'neutral';
	});

	// Get trend color
	let trendColor = $derived(() => {
		// For expenses, down is good (green), up is bad (red)
		if (trend === 'down') return 'var(--em-income)';
		if (trend === 'up') return 'var(--em-expense)';
		return color;
	});
</script>

{#if data.length >= 2}
	<svg 
		{width} 
		{height} 
		viewBox="0 0 {width} {height}"
		class="sparkline"
	>
		<!-- Area fill -->
		{#if showArea && fillColor}
			<path
				d={areaPath}
				fill={fillColor}
				opacity="0.2"
			/>
		{/if}

		<!-- Line -->
		<path
			d={linePath}
			fill="none"
			stroke={color}
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-linejoin="round"
			class="line"
		/>

		<!-- Dots -->
		{#if showDots}
			{#each points as point, i}
				<circle
					cx={point.x}
					cy={point.y}
					r={strokeWidth + 1}
					fill={i === points.length - 1 ? color : 'var(--em-surface)'}
					stroke={color}
					stroke-width={1}
					class="dot"
				/>
			{/each}
		{/if}

		<!-- End dot (always show last point) -->
		{#if !showDots && points.length > 0}
			{@const lastPoint = points[points.length - 1]}
			<circle
				cx={lastPoint.x}
				cy={lastPoint.y}
				r={strokeWidth + 1}
				fill={color}
				class="end-dot"
			/>
		{/if}
	</svg>
{:else}
	<div class="no-data" style="width: {width}px; height: {height}px;">
		<span>—</span>
	</div>
{/if}

<style>
	.sparkline {
		display: block;
	}

	.line {
		animation: drawLine 0.8s ease-out forwards;
		stroke-dasharray: 1000;
		stroke-dashoffset: 1000;
	}

	@keyframes drawLine {
		to {
			stroke-dashoffset: 0;
		}
	}

	.dot {
		animation: fadeIn 0.3s ease-out forwards;
		opacity: 0;
	}

	.end-dot {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes fadeIn {
		to {
			opacity: 1;
		}
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.7;
			transform: scale(1.2);
		}
	}

	.no-data {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--em-text-muted);
		font-size: 0.75rem;
	}
</style>
