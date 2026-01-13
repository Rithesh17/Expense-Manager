<script lang="ts">
	/**
	 * @type {{
	 *   value?: string,
	 *   onselect?: (color: string) => void
	 * }}
	 */
	let { 
		value = '#3B82F6',
		onselect
	} = $props();

	// Curated color palette for expense categories
	const colorGroups = [
		{
			name: 'Reds',
			colors: ['#EF4444', '#DC2626', '#B91C1C', '#F87171', '#FCA5A5']
		},
		{
			name: 'Oranges',
			colors: ['#F97316', '#EA580C', '#C2410C', '#FB923C', '#FDBA74']
		},
		{
			name: 'Yellows',
			colors: ['#F59E0B', '#D97706', '#B45309', '#FBBF24', '#FCD34D']
		},
		{
			name: 'Greens',
			colors: ['#10B981', '#059669', '#047857', '#34D399', '#6EE7B7']
		},
		{
			name: 'Teals',
			colors: ['#14B8A6', '#0D9488', '#0F766E', '#2DD4BF', '#5EEAD4']
		},
		{
			name: 'Blues',
			colors: ['#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA', '#93C5FD']
		},
		{
			name: 'Indigos',
			colors: ['#6366F1', '#4F46E5', '#4338CA', '#818CF8', '#A5B4FC']
		},
		{
			name: 'Purples',
			colors: ['#8B5CF6', '#7C3AED', '#6D28D9', '#A78BFA', '#C4B5FD']
		},
		{
			name: 'Pinks',
			colors: ['#EC4899', '#DB2777', '#BE185D', '#F472B6', '#F9A8D4']
		},
		{
			name: 'Grays',
			colors: ['#64748B', '#475569', '#334155', '#94A3B8', '#CBD5E1']
		}
	];

	// Flatten colors for grid display
	let allColors = $derived(colorGroups.flatMap(g => g.colors.slice(0, 2)));

	let showCustomInput = $state(false);
	let customColor = $state(value);

	function handleSelect(color: string) {
		onselect?.(color);
	}

	function handleCustomColorChange(e: Event) {
		const input = e.target as HTMLInputElement;
		customColor = input.value;
		onselect?.(input.value);
	}
</script>

<div class="color-picker">
	<!-- Color Grid -->
	<div class="color-grid">
		{#each allColors as color}
			<button 
				type="button"
				class="color-btn"
				class:selected={value === color}
				style="background-color: {color};"
				onclick={() => handleSelect(color)}
				title={color}
			>
				{#if value === color}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Custom Color Input -->
	<div class="custom-color">
		<button 
			type="button"
			class="custom-toggle"
			onclick={() => showCustomInput = !showCustomInput}
		>
			<span class="toggle-icon">🎨</span>
			<span>Custom Color</span>
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				width="16" 
				height="16" 
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2"
				class:rotated={showCustomInput}
			>
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</button>

		{#if showCustomInput}
			<div class="custom-input-row">
				<input 
					type="color" 
					class="color-input"
					value={customColor}
					oninput={handleCustomColorChange}
				/>
				<input 
					type="text" 
					class="hex-input em-input"
					value={customColor}
					placeholder="#000000"
					maxlength="7"
					oninput={(e) => {
						const input = e.target as HTMLInputElement;
						if (/^#[0-9A-Fa-f]{6}$/.test(input.value)) {
							customColor = input.value;
							onselect?.(input.value);
						}
					}}
				/>
			</div>
		{/if}
	</div>

	<!-- Selected Preview -->
	<div class="selected-preview">
		<span class="preview-label">Selected:</span>
		<span class="preview-swatch" style="background-color: {value};"></span>
		<span class="preview-hex">{value}</span>
	</div>
</div>

<style>
	.color-picker {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		background-color: var(--em-bg-tertiary);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
	}

	.color-btn {
		width: 100%;
		aspect-ratio: 1;
		border: 2px solid transparent;
		border-radius: var(--em-radius-sm);
		cursor: pointer;
		transition: all var(--em-transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.color-btn:hover {
		transform: scale(1.1);
		box-shadow: var(--em-shadow-md);
	}

	.color-btn.selected {
		border-color: white;
		box-shadow: 0 0 0 2px var(--em-primary);
	}

	.custom-color {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--em-border);
	}

	.custom-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: transparent;
		border: none;
		color: var(--em-text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: color var(--em-transition-fast);
	}

	.custom-toggle:hover {
		color: var(--em-text-primary);
	}

	.custom-toggle svg {
		margin-left: auto;
		transition: transform var(--em-transition-fast);
	}

	.custom-toggle svg.rotated {
		transform: rotate(180deg);
	}

	.toggle-icon {
		font-size: 1rem;
	}

	.custom-input-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.color-input {
		width: 48px;
		height: 40px;
		padding: 0;
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-sm);
		cursor: pointer;
		background: transparent;
	}

	.color-input::-webkit-color-swatch-wrapper {
		padding: 2px;
	}

	.color-input::-webkit-color-swatch {
		border: none;
		border-radius: 4px;
	}

	.hex-input {
		flex: 1;
		font-family: monospace;
		text-transform: uppercase;
	}

	.selected-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--em-border);
	}

	.preview-label {
		font-size: 0.75rem;
		color: var(--em-text-muted);
	}

	.preview-swatch {
		width: 20px;
		height: 20px;
		border-radius: var(--em-radius-sm);
		border: 1px solid var(--em-border);
	}

	.preview-hex {
		font-size: 0.75rem;
		font-family: monospace;
		color: var(--em-text-secondary);
		text-transform: uppercase;
	}
</style>
