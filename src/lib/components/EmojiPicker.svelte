<script lang="ts">
	/**
	 * @type {{
	 *   value?: string,
	 *   onselect?: (emoji: string) => void
	 * }}
	 */
	let { 
		value = '📋',
		onselect
	} = $props();

	// Common expense-related emojis organized by category
	const emojiGroups = [
		{
			name: 'Food & Drink',
			emojis: ['🍔', '🍕', '🍜', '🍳', '☕', '🍺', '🍷', '🥗', '🍰', '🍩', '🛒', '🥡']
		},
		{
			name: 'Transport',
			emojis: ['🚗', '🚕', '🚌', '🚇', '✈️', '🚲', '⛽', '🚙', '🏍️', '🚁', '⛵', '🚀']
		},
		{
			name: 'Shopping',
			emojis: ['🛍️', '👕', '👟', '💄', '🎁', '💎', '👜', '🕶️', '⌚', '📱', '💻', '🎮']
		},
		{
			name: 'Home & Utilities',
			emojis: ['🏠', '💡', '🔌', '📺', '🛋️', '🧹', '🔧', '🚿', '🌡️', '📦', '🔑', '🛠️']
		},
		{
			name: 'Health & Wellness',
			emojis: ['💊', '🏥', '💪', '🧘', '🏃', '🩺', '💉', '🧬', '🧴', '🦷', '👁️', '❤️']
		},
		{
			name: 'Entertainment',
			emojis: ['🎬', '🎵', '🎮', '📚', '🎨', '🎭', '🎤', '🎸', '🎯', '🎲', '🎳', '🎪']
		},
		{
			name: 'Education & Work',
			emojis: ['📚', '🎓', '✏️', '📝', '💼', '📊', '📈', '🖥️', '📁', '📌', '🗂️', '📋']
		},
		{
			name: 'Travel & Vacation',
			emojis: ['✈️', '🏖️', '🏔️', '🏕️', '🗺️', '🧳', '🎒', '🏨', '⛱️', '🚢', '🗽', '🎡']
		},
		{
			name: 'Finance',
			emojis: ['💰', '💵', '💳', '🏦', '📈', '💹', '🪙', '💎', '📉', '🧾', '💸', '🏧']
		},
		{
			name: 'Misc',
			emojis: ['🎉', '🌟', '⭐', '💫', '🔥', '❄️', '🌈', '☀️', '🌙', '🐾', '🌸', '🍀']
		}
	];

	let activeGroup = $state(0);

	function handleSelect(emoji: string) {
		onselect?.(emoji);
	}
</script>

<div class="emoji-picker">
	<!-- Category Tabs -->
	<div class="picker-tabs">
		{#each emojiGroups as group, index}
			<button 
				type="button"
				class="tab-btn" 
				class:active={activeGroup === index}
				onclick={() => activeGroup = index}
				title={group.name}
			>
				{group.emojis[0]}
			</button>
		{/each}
	</div>

	<!-- Emoji Grid -->
	<div class="emoji-grid">
		{#each emojiGroups[activeGroup].emojis as emoji}
			<button 
				type="button"
				class="emoji-btn"
				class:selected={value === emoji}
				onclick={() => handleSelect(emoji)}
			>
				{emoji}
			</button>
		{/each}
	</div>

	<!-- Selected Preview -->
	<div class="selected-preview">
		<span class="preview-label">Selected:</span>
		<span class="preview-emoji">{value}</span>
	</div>
</div>

<style>
	.emoji-picker {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		background-color: var(--em-bg-tertiary);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
	}

	.picker-tabs {
		display: flex;
		gap: 0.25rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--em-border);
		overflow-x: auto;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		border-radius: var(--em-radius-sm);
		font-size: 1.125rem;
		cursor: pointer;
		transition: all var(--em-transition-fast);
		flex-shrink: 0;
	}

	.tab-btn:hover {
		background-color: var(--em-bg-hover);
	}

	.tab-btn.active {
		background-color: var(--em-primary);
	}

	.emoji-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.25rem;
	}

	.emoji-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		aspect-ratio: 1;
		background: transparent;
		border: 2px solid transparent;
		border-radius: var(--em-radius-sm);
		font-size: 1.5rem;
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.emoji-btn:hover {
		background-color: var(--em-bg-hover);
		transform: scale(1.1);
	}

	.emoji-btn.selected {
		border-color: var(--em-primary);
		background-color: var(--em-info-bg);
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

	.preview-emoji {
		font-size: 1.5rem;
	}
</style>
