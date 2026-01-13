<script lang="ts">
	import { goto } from '$app/navigation';
	import { PageHeader } from '$lib/components';
	import { expenseActions, categories } from '$lib/stores';
	import type { PaymentMethod, ExpenseFormData } from '$lib/types';

	// Form state
	let amount = $state('');
	let description = $state('');
	let categoryId = $state('');
	let date = $state(new Date().toISOString().split('T')[0]);
	let paymentMethod = $state<PaymentMethod>('card');
	let merchant = $state('');
	let notes = $state('');
	let tags = $state('');
	
	// UI state
	let isSubmitting = $state(false);
	let error = $state('');

	const paymentMethods: { id: PaymentMethod; name: string; icon: string }[] = [
		{ id: 'cash', name: 'Cash', icon: '💵' },
		{ id: 'card', name: 'Card', icon: '💳' },
		{ id: 'digital', name: 'Digital Wallet', icon: '📱' },
		{ id: 'bank', name: 'Bank Transfer', icon: '🏦' },
	];

	// Get selected category info for display
	let selectedCategory = $derived($categories.find(c => c.id === categoryId));

	function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		
		// Validation
		if (!amount || parseFloat(amount) <= 0) {
			error = 'Please enter a valid amount';
			return;
		}
		
		if (!description.trim()) {
			error = 'Please enter a description';
			return;
		}
		
		if (!categoryId) {
			error = 'Please select a category';
			return;
		}
		
		isSubmitting = true;
		
		try {
			const formData: ExpenseFormData = {
				amount,
				description: description.trim(),
				categoryId,
				date,
				paymentMethod,
				merchant: merchant.trim() || undefined,
				notes: notes.trim() || undefined,
				tags: tags.trim() || undefined
			};
			
			expenseActions.add(formData);
			
			// Navigate to expenses page
			goto('/expenses');
		} catch (err) {
			error = 'Failed to save expense. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}

	function handleReset() {
		amount = '';
		description = '';
		categoryId = '';
		date = new Date().toISOString().split('T')[0];
		paymentMethod = 'card';
		merchant = '';
		notes = '';
		tags = '';
		error = '';
	}
</script>

<svelte:head>
	<title>Add Expense | Expense Manager</title>
	<meta name="description" content="Add a new expense to track your spending." />
</svelte:head>

<div class="add-expense-page">
	<div class="container mx-auto px-4">
		<PageHeader 
			title="Add Expense" 
			subtitle="Record a new expense"
			showBackButton={true}
		/>

		{#if error}
			<div class="error-banner">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="8" x2="12" y2="12"></line>
					<line x1="12" y1="16" x2="12.01" y2="16"></line>
				</svg>
				{error}
			</div>
		{/if}

		<form class="expense-form" onsubmit={handleSubmit}>
			<!-- Amount Field (Prominent) -->
			<div class="amount-section">
				<label class="em-label" for="amount">Amount</label>
				<div class="amount-input-wrapper">
					<span class="currency-symbol">$</span>
					<input 
						type="number" 
						id="amount"
						class="amount-input"
						placeholder="0.00"
						step="0.01"
						min="0"
						bind:value={amount}
						required
					/>
				</div>
			</div>

			<!-- Main Fields -->
			<div class="form-grid">
				<div class="form-group">
					<label class="em-label" for="description">Description</label>
					<input 
						type="text" 
						id="description"
						class="em-input"
						placeholder="What did you spend on?"
						bind:value={description}
						required
					/>
				</div>

				<div class="form-group">
					<label class="em-label" for="date">Date</label>
					<div class="date-input-wrapper">
						<input 
							type="date" 
							id="date"
							class="em-input date-input"
							bind:value={date}
							required
						/>
					</div>
				</div>
			</div>

			<!-- Category Dropdown -->
			<div class="form-group">
				<label class="em-label" for="category">Category</label>
				<div class="select-wrapper">
					<select id="category" class="em-input category-select" bind:value={categoryId} required>
						<option value="">Select a category...</option>
						{#each $categories as cat}
							<option value={cat.id}>{cat.icon} {cat.name}</option>
						{/each}
					</select>
					<span class="select-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</span>
				</div>
			</div>

			<!-- Payment Method -->
			<div class="form-group">
				<label class="em-label" id="payment-label">Payment Method</label>
				<div class="payment-methods" role="radiogroup" aria-labelledby="payment-label">
					{#each paymentMethods as method}
						<button 
							type="button"
							class="payment-option"
							class:selected={paymentMethod === method.id}
							onclick={() => paymentMethod = method.id}
							role="radio"
							aria-checked={paymentMethod === method.id}
						>
							<span class="method-icon">{method.icon}</span>
							<span class="method-name">{method.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Optional Fields (Collapsible) -->
			<details class="optional-fields">
				<summary class="optional-toggle">
					<span>Additional Details</span>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</summary>
				
				<div class="optional-content">
					<div class="form-group">
						<label class="em-label" for="merchant">Merchant</label>
						<input 
							type="text" 
							id="merchant"
							class="em-input"
							placeholder="Where did you make this purchase?"
							bind:value={merchant}
						/>
					</div>

					<div class="form-group">
						<label class="em-label" for="notes">Notes</label>
						<textarea 
							id="notes"
							class="em-input notes-input"
							placeholder="Add any additional notes..."
							rows="3"
							bind:value={notes}
						></textarea>
					</div>

					<div class="form-group">
						<label class="em-label" for="tags">Tags</label>
						<input 
							type="text" 
							id="tags"
							class="em-input"
							placeholder="Enter tags separated by commas"
							bind:value={tags}
						/>
					</div>

					<!-- Receipt Upload Placeholder -->
					<div class="form-group">
						<label class="em-label">Receipt</label>
						<div class="receipt-upload-placeholder">
							<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
								<circle cx="8.5" cy="8.5" r="1.5"></circle>
								<polyline points="21 15 16 10 5 21"></polyline>
							</svg>
							<span class="upload-text">Receipt upload coming soon</span>
							<span class="upload-hint">This feature will be available with Firebase integration</span>
						</div>
					</div>
				</div>
			</details>

			<!-- Submit Buttons -->
			<div class="form-actions">
				<button type="button" class="em-btn em-btn-ghost" onclick={handleReset}>
					Clear
				</button>
				<a href="/" class="em-btn em-btn-ghost cancel-link">Cancel</a>
				<button type="submit" class="em-btn em-btn-primary" disabled={isSubmitting}>
					{#if isSubmitting}
						<span class="spinner"></span>
						Saving...
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						Save Expense
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.add-expense-page {
		padding-bottom: 2rem;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--em-expense-bg);
		border: 1px solid var(--em-expense);
		border-radius: var(--em-radius-md);
		color: var(--em-expense);
		margin-bottom: 1.5rem;
		max-width: 600px;
	}

	.expense-form {
		max-width: 600px;
		padding: 1.5rem;
		background-color: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-lg);
	}

	.amount-section {
		text-align: center;
		padding: 1.5rem 0 2rem;
		border-bottom: 1px solid var(--em-border);
		margin-bottom: 1.5rem;
	}

	.amount-input-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	.currency-symbol {
		font-size: 2.5rem;
		font-weight: 300;
		color: var(--em-text-muted);
	}

	.amount-input {
		font-size: 3rem;
		font-weight: 700;
		text-align: center;
		background: transparent;
		border: none;
		color: var(--em-text-primary);
		max-width: 250px;
	}

	.amount-input:focus {
		outline: none;
	}

	.amount-input::placeholder {
		color: var(--em-text-muted);
	}

	/* Hide number input spinners */
	.amount-input::-webkit-outer-spin-button,
	.amount-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.amount-input[type=number] {
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 500px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	/* Date input wrapper */
	.date-input-wrapper {
		position: relative;
	}

	.date-input {
		cursor: pointer;
	}

	.date-input::-webkit-calendar-picker-indicator {
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.date-input::-webkit-calendar-picker-indicator:hover {
		opacity: 1;
	}

	/* Category Dropdown */
	.select-wrapper {
		position: relative;
	}

	.category-select {
		appearance: none;
		padding-right: 2.5rem;
		cursor: pointer;
	}

	.select-icon {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--em-text-muted);
		pointer-events: none;
	}

	/* Payment Methods */
	.payment-methods {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.payment-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: var(--em-bg-tertiary);
		border: 2px solid transparent;
		border-radius: var(--em-radius-md);
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.payment-option:hover {
		background-color: var(--em-bg-hover);
	}

	.payment-option.selected {
		border-color: var(--em-primary);
		background-color: var(--em-info-bg);
	}

	.method-icon {
		font-size: 1.25rem;
	}

	.method-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--em-text-secondary);
	}

	.payment-option.selected .method-name {
		color: var(--em-text-primary);
	}

	/* Optional Fields */
	.optional-fields {
		margin-bottom: 1.5rem;
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
	}

	.optional-toggle {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		cursor: pointer;
		color: var(--em-text-secondary);
		font-weight: 500;
	}

	.optional-toggle:hover {
		color: var(--em-text-primary);
	}

	.optional-toggle svg {
		transition: transform var(--em-transition-fast);
	}

	.optional-fields[open] .optional-toggle svg {
		transform: rotate(180deg);
	}

	.optional-content {
		padding: 0 1rem 1rem;
	}

	.notes-input {
		resize: vertical;
		min-height: 80px;
	}

	/* Receipt Upload Placeholder */
	.receipt-upload-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		background-color: var(--em-bg-tertiary);
		border: 2px dashed var(--em-border);
		border-radius: var(--em-radius-md);
		color: var(--em-text-muted);
		text-align: center;
	}

	.receipt-upload-placeholder svg {
		opacity: 0.5;
	}

	.upload-text {
		font-weight: 500;
		color: var(--em-text-secondary);
	}

	.upload-hint {
		font-size: 0.75rem;
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--em-border);
	}

	.cancel-link {
		text-decoration: none;
	}

	.spinner {
		width: 1em;
		height: 1em;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
