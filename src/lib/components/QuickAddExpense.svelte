<script lang="ts">
	import { Modal } from '$lib/components';
	import { expenseActions, categories } from '$lib/stores';
	import type { PaymentMethod, ExpenseFormData } from '$lib/types';

	/** @type {{ open?: boolean, onclose?: () => void, onsuccess?: () => void }} */
	let { 
		open = false, 
		onclose,
		onsuccess
	} = $props();

	// Form state
	let amount = $state('');
	let description = $state('');
	let categoryId = $state('');
	let date = $state(new Date().toISOString().split('T')[0]);
	let paymentMethod = $state<PaymentMethod>('card');
	
	// UI state
	let isSubmitting = $state(false);
	let error = $state('');

	const paymentMethods: { id: PaymentMethod; icon: string }[] = [
		{ id: 'cash', icon: '💵' },
		{ id: 'card', icon: '💳' },
		{ id: 'digital', icon: '📱' },
		{ id: 'bank', icon: '🏦' },
	];

	function resetForm() {
		amount = '';
		description = '';
		categoryId = '';
		date = new Date().toISOString().split('T')[0];
		paymentMethod = 'card';
		error = '';
	}

	function handleClose() {
		resetForm();
		onclose?.();
	}

	async function handleSubmit(e: Event) {
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
				paymentMethod
			};
			
			await expenseActions.add(formData);
			resetForm();
			onsuccess?.();
			onclose?.();
		} catch (err) {
			error = 'Failed to save expense. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleSubmitAndAddAnother(e: Event) {
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
				paymentMethod
			};
			
			await expenseActions.add(formData);
			
			// Reset only amount and description for quick successive entries
			amount = '';
			description = '';
			onsuccess?.();
		} catch (err) {
			error = 'Failed to save expense. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#snippet quickAddContent()}
	<form class="quick-add-form" onsubmit={handleSubmit}>
		{#if error}
			<div class="error-message">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="8" x2="12" y2="12"></line>
					<line x1="12" y1="16" x2="12.01" y2="16"></line>
				</svg>
				{error}
			</div>
		{/if}

		<!-- Amount (large, prominent) -->
		<div class="amount-row">
			<span class="currency">$</span>
			<input 
				type="number" 
				class="amount-input"
				placeholder="0.00"
				step="0.01"
				min="0"
				bind:value={amount}
				required
			/>
		</div>

		<!-- Description -->
		<input 
			type="text" 
			class="em-input"
			placeholder="What did you spend on?"
			bind:value={description}
			required
		/>

		<!-- Category & Date Row -->
		<div class="form-row">
			<select class="em-input" bind:value={categoryId} required>
				<option value="">Category...</option>
				{#each $categories as cat}
					<option value={cat.id}>{cat.icon} {cat.name}</option>
				{/each}
			</select>
			<input 
				type="date" 
				class="em-input date-input"
				bind:value={date}
				required
			/>
		</div>

		<!-- Payment Method (compact) -->
		<div class="payment-row">
			{#each paymentMethods as method}
				<button 
					type="button"
					class="payment-btn"
					class:selected={paymentMethod === method.id}
					onclick={() => paymentMethod = method.id}
					title={method.id}
				>
					{method.icon}
				</button>
			{/each}
		</div>

		<!-- Hidden submit for enter key -->
		<button type="submit" hidden aria-label="Submit form"></button>
	</form>
{/snippet}

{#snippet quickAddFooter()}
	<button type="button" class="em-btn em-btn-ghost" onclick={handleClose}>
		Cancel
	</button>
	<button 
		type="button" 
		class="em-btn em-btn-ghost add-another-btn" 
		onclick={handleSubmitAndAddAnother}
		disabled={isSubmitting}
	>
		Save & Add Another
	</button>
	<button 
		type="button" 
		class="em-btn em-btn-primary" 
		onclick={handleSubmit}
		disabled={isSubmitting}
	>
		{#if isSubmitting}
			Saving...
		{:else}
			Save Expense
		{/if}
	</button>
{/snippet}

<Modal 
	{open}
	title="Quick Add Expense"
	onclose={handleClose}
	children={quickAddContent}
	footer={quickAddFooter}
/>

<style>
	.quick-add-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--em-expense-bg);
		border-radius: var(--em-radius-sm);
		color: var(--em-expense);
		font-size: 0.875rem;
	}

	.amount-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 1rem 0;
	}

	.currency {
		font-size: 2rem;
		font-weight: 300;
		color: var(--em-text-muted);
	}

	.amount-input {
		font-size: 2.5rem;
		font-weight: 700;
		text-align: center;
		background: transparent;
		border: none;
		color: var(--em-text-primary);
		max-width: 180px;
		padding: 0;
	}

	.amount-input:focus {
		outline: none;
	}

	.amount-input::placeholder {
		color: var(--em-text-muted);
	}

	.amount-input::-webkit-outer-spin-button,
	.amount-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.amount-input[type=number] {
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.75rem;
	}

	.date-input {
		width: 150px;
	}

	.payment-row {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.payment-btn {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		background-color: var(--em-bg-tertiary);
		border: 2px solid transparent;
		border-radius: var(--em-radius-md);
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.payment-btn:hover {
		background-color: var(--em-bg-hover);
	}

	.payment-btn.selected {
		border-color: var(--em-primary);
		background-color: var(--em-info-bg);
	}

	.add-another-btn {
		margin-right: auto;
	}
</style>
