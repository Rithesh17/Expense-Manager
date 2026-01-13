<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { PageHeader, Modal, EmptyState } from '$lib/components';
	import { expenses, expenseActions, categories } from '$lib/stores';
	import { preferences } from '$lib/stores/preferences';
	import { formatCurrency, formatDate, formatRelativeDate } from '$lib/utils';
	import type { Expense, PaymentMethod, ExpenseFormData } from '$lib/types';

	// Get expense ID from route params
	let expenseId = $derived($page.params.id);
	
	// Check for edit mode from query params
	let shouldStartEditing = $derived($page.url.searchParams.get('edit') === 'true');
	
	// Find the expense
	let expense = $derived($expenses.find(e => e.id === expenseId));
	
	// Get category info
	let category = $derived(expense ? $categories.find(c => c.id === expense.categoryId) : null);
	
	// UI state
	let showDeleteModal = $state(false);
	let isEditing = $state(false);
	let hasInitialized = $state(false);
	
	// Auto-start editing if query param is set
	$effect(() => {
		if (shouldStartEditing && expense && !hasInitialized) {
			hasInitialized = true;
			startEditing();
		}
	});
	
	// Edit form state
	let editAmount = $state('');
	let editDescription = $state('');
	let editCategoryId = $state('');
	let editDate = $state('');
	let editPaymentMethod = $state<PaymentMethod>('card');
	let editMerchant = $state('');
	let editNotes = $state('');
	let editTags = $state('');
	let editError = $state('');
	let isSaving = $state(false);

	const paymentMethods: { id: PaymentMethod; name: string; icon: string }[] = [
		{ id: 'cash', name: 'Cash', icon: '💵' },
		{ id: 'card', name: 'Card', icon: '💳' },
		{ id: 'digital', name: 'Digital Wallet', icon: '📱' },
		{ id: 'bank', name: 'Bank Transfer', icon: '🏦' },
		{ id: 'other', name: 'Other', icon: '💰' },
	];

	// Initialize edit form when entering edit mode
	function startEditing() {
		if (!expense) return;
		editAmount = expense.amount.toString();
		editDescription = expense.description;
		editCategoryId = expense.categoryId;
		editDate = expense.date.split('T')[0];
		editPaymentMethod = expense.paymentMethod || 'card';
		editMerchant = expense.merchant || '';
		editNotes = expense.notes || '';
		editTags = expense.tags?.join(', ') || '';
		editError = '';
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
		editError = '';
	}

	function handleSaveEdit(e: Event) {
		e.preventDefault();
		editError = '';

		// Validation
		if (!editAmount || parseFloat(editAmount) <= 0) {
			editError = 'Please enter a valid amount';
			return;
		}

		if (!editDescription.trim()) {
			editError = 'Please enter a description';
			return;
		}

		if (!editCategoryId) {
			editError = 'Please select a category';
			return;
		}

		isSaving = true;

		try {
			const updates: Partial<Expense> = {
				amount: parseFloat(editAmount),
				description: editDescription.trim(),
				categoryId: editCategoryId,
				date: editDate,
				paymentMethod: editPaymentMethod,
				merchant: editMerchant.trim() || undefined,
				notes: editNotes.trim() || undefined,
				tags: editTags.trim() ? editTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t) : undefined
			};

			expenseActions.update(expenseId, updates);
			isEditing = false;
		} catch (err) {
			editError = 'Failed to save changes. Please try again.';
			console.error(err);
		} finally {
			isSaving = false;
		}
	}

	function handleDelete() {
		expenseActions.delete(expenseId);
		goto('/expenses');
	}

	function getPaymentMethodInfo(method: PaymentMethod | undefined) {
		return paymentMethods.find(m => m.id === method) || { name: 'Unknown', icon: '💰' };
	}
</script>

<svelte:head>
	<title>{expense ? expense.description : 'Expense Not Found'} | Expense Manager</title>
	<meta name="description" content="View expense details" />
</svelte:head>

<div class="expense-detail-page">
	<div class="container mx-auto px-4">
		{#if !expense}
			<PageHeader 
				title="Expense Not Found" 
				showBackButton={true}
			/>
			<EmptyState
				title="Expense not found"
				message="This expense may have been deleted or doesn't exist."
				icon="🔍"
				actionLabel="View All Expenses"
				actionHref="/expenses"
			/>
		{:else if isEditing}
			<!-- Edit Mode -->
			<PageHeader 
				title="Edit Expense" 
				showBackButton={true}
			/>

			{#if editError}
				<div class="error-banner">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					{editError}
				</div>
			{/if}

			<form class="edit-form em-card" onsubmit={handleSaveEdit}>
				<!-- Amount -->
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
							bind:value={editAmount}
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
							bind:value={editDescription}
							required
						/>
					</div>

					<div class="form-group">
						<label class="em-label" for="date">Date</label>
						<input 
							type="date" 
							id="date"
							class="em-input"
							bind:value={editDate}
							required
						/>
					</div>
				</div>

				<!-- Category -->
				<div class="form-group">
					<label class="em-label" for="category">Category</label>
					<select id="category" class="em-input" bind:value={editCategoryId} required>
						<option value="">Select a category...</option>
						{#each $categories as cat}
							<option value={cat.id}>{cat.icon} {cat.name}</option>
						{/each}
					</select>
				</div>

				<!-- Payment Method -->
				<div class="form-group">
					<label class="em-label">Payment Method</label>
					<div class="payment-methods">
						{#each paymentMethods as method}
							<button 
								type="button"
								class="payment-option"
								class:selected={editPaymentMethod === method.id}
								onclick={() => editPaymentMethod = method.id}
							>
								<span class="method-icon">{method.icon}</span>
								<span class="method-name">{method.name}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Optional Fields -->
				<div class="form-group">
					<label class="em-label" for="merchant">Merchant</label>
					<input 
						type="text" 
						id="merchant"
						class="em-input"
						placeholder="Where did you make this purchase?"
						bind:value={editMerchant}
					/>
				</div>

				<div class="form-group">
					<label class="em-label" for="notes">Notes</label>
					<textarea 
						id="notes"
						class="em-input notes-input"
						placeholder="Add any additional notes..."
						rows="3"
						bind:value={editNotes}
					></textarea>
				</div>

				<div class="form-group">
					<label class="em-label" for="tags">Tags</label>
					<input 
						type="text" 
						id="tags"
						class="em-input"
						placeholder="Enter tags separated by commas"
						bind:value={editTags}
					/>
				</div>

				<!-- Actions -->
				<div class="form-actions">
					<button type="button" class="em-btn em-btn-ghost" onclick={cancelEditing}>
						Cancel
					</button>
					<button type="submit" class="em-btn em-btn-primary" disabled={isSaving}>
						{#if isSaving}
							<span class="spinner"></span>
							Saving...
						{:else}
							Save Changes
						{/if}
					</button>
				</div>
			</form>
		{:else}
			<!-- View Mode -->
			<PageHeader 
				title="Expense Details" 
				showBackButton={true}
			/>

			<div class="expense-detail em-card">
				<!-- Header with amount -->
				<div class="detail-header">
					<div class="category-icon" style="background-color: {category?.color}20;">
						<span>{category?.icon || '📋'}</span>
					</div>
					<div class="header-content">
						<h2 class="expense-description">{expense.description}</h2>
						<span class="category-name" style="color: {category?.color};">
							{category?.name || 'Unknown Category'}
						</span>
					</div>
					<div class="expense-amount amount-negative">
						-{formatCurrency(expense.amount, $preferences.currency)}
					</div>
				</div>

				<!-- Details Grid -->
				<div class="detail-grid">
					<div class="detail-item">
						<span class="detail-label">Date</span>
						<span class="detail-value">
							{formatDate(expense.date, $preferences.dateFormat)}
							<span class="relative-date">({formatRelativeDate(expense.date)})</span>
						</span>
					</div>

					{#if expense.paymentMethod}
						{@const method = getPaymentMethodInfo(expense.paymentMethod)}
						<div class="detail-item">
							<span class="detail-label">Payment Method</span>
							<span class="detail-value">
								{method.icon} {method.name}
							</span>
						</div>
					{/if}

					{#if expense.merchant}
						<div class="detail-item">
							<span class="detail-label">Merchant</span>
							<span class="detail-value">{expense.merchant}</span>
						</div>
					{/if}

					{#if expense.tags && expense.tags.length > 0}
						<div class="detail-item">
							<span class="detail-label">Tags</span>
							<div class="tags-list">
								{#each expense.tags as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						</div>
					{/if}

					{#if expense.notes}
						<div class="detail-item full-width">
							<span class="detail-label">Notes</span>
							<p class="detail-value notes">{expense.notes}</p>
						</div>
					{/if}
				</div>

				<!-- Receipt Placeholder -->
				<div class="receipt-section">
					<div class="receipt-placeholder">
						<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
							<circle cx="8.5" cy="8.5" r="1.5"></circle>
							<polyline points="21 15 16 10 5 21"></polyline>
						</svg>
						<span>No receipt attached</span>
						<button class="em-btn em-btn-ghost" disabled>
							Add Receipt (Coming Soon)
						</button>
					</div>
				</div>

				<!-- Metadata -->
				<div class="metadata">
					<span>Created: {formatDate(expense.createdAt, $preferences.dateFormat)}</span>
					{#if expense.updatedAt !== expense.createdAt}
						<span>Updated: {formatDate(expense.updatedAt, $preferences.dateFormat)}</span>
					{/if}
				</div>

				<!-- Action Buttons -->
				<div class="detail-actions">
					<button class="em-btn em-btn-ghost delete-btn" onclick={() => showDeleteModal = true}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="3 6 5 6 21 6"></polyline>
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
						</svg>
						Delete
					</button>
					<button class="em-btn em-btn-primary" onclick={startEditing}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
							<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
						</svg>
						Edit Expense
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#snippet deleteModalContent()}
	<div class="delete-modal-content">
		<p>Are you sure you want to delete this expense?</p>
		<div class="delete-expense-preview">
			<span class="preview-description">{expense?.description}</span>
			<span class="preview-amount">-{formatCurrency(expense?.amount || 0, $preferences.currency)}</span>
		</div>
		<p class="delete-warning">This action cannot be undone.</p>
	</div>
{/snippet}

{#snippet deleteModalFooter()}
	<button class="em-btn em-btn-ghost" onclick={() => showDeleteModal = false}>
		Cancel
	</button>
	<button class="em-btn em-btn-danger" onclick={handleDelete}>
		Delete Expense
	</button>
{/snippet}

<Modal 
	open={showDeleteModal} 
	title="Delete Expense" 
	onclose={() => showDeleteModal = false}
	children={deleteModalContent}
	footer={deleteModalFooter}
/>

<style>
	.expense-detail-page {
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
		max-width: 700px;
	}

	/* View Mode Styles */
	.expense-detail {
		max-width: 700px;
		padding: 0;
		overflow: hidden;
	}

	.detail-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, var(--em-bg-tertiary) 0%, var(--em-surface) 100%);
		border-bottom: 1px solid var(--em-border);
	}

	.category-icon {
		width: 56px;
		height: 56px;
		border-radius: var(--em-radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.75rem;
		flex-shrink: 0;
	}

	.header-content {
		flex: 1;
		min-width: 0;
	}

	.expense-description {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.25rem;
		color: var(--em-text-primary);
	}

	.category-name {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.expense-amount {
		font-size: 1.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
		padding: 1.5rem;
		border-bottom: 1px solid var(--em-border);
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-item.full-width {
		grid-column: 1 / -1;
	}

	.detail-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--em-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-value {
		font-size: 0.9375rem;
		color: var(--em-text-primary);
	}

	.relative-date {
		color: var(--em-text-muted);
		font-size: 0.8125rem;
	}

	.detail-value.notes {
		margin: 0;
		white-space: pre-wrap;
		line-height: 1.5;
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-full);
		font-size: 0.8125rem;
		color: var(--em-text-secondary);
	}

	.receipt-section {
		padding: 1.5rem;
		border-bottom: 1px solid var(--em-border);
	}

	.receipt-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem;
		background-color: var(--em-bg-tertiary);
		border: 2px dashed var(--em-border);
		border-radius: var(--em-radius-md);
		color: var(--em-text-muted);
		text-align: center;
	}

	.receipt-placeholder svg {
		opacity: 0.5;
	}

	.metadata {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 1rem 1.5rem;
		font-size: 0.75rem;
		color: var(--em-text-muted);
		background-color: var(--em-bg-tertiary);
	}

	.detail-actions {
		display: flex;
		justify-content: space-between;
		padding: 1rem 1.5rem;
	}

	.delete-btn {
		color: var(--em-expense);
	}

	.delete-btn:hover {
		background-color: var(--em-expense-bg);
	}

	/* Edit Mode Styles */
	.edit-form {
		max-width: 700px;
		padding: 1.5rem;
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

	.form-group {
		margin-bottom: 1.5rem;
	}

	.payment-methods {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.payment-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background-color: var(--em-bg-tertiary);
		border: 2px solid transparent;
		border-radius: var(--em-radius-md);
		cursor: pointer;
		transition: all var(--em-transition-fast);
		font-size: 0.875rem;
	}

	.payment-option:hover {
		background-color: var(--em-bg-hover);
	}

	.payment-option.selected {
		border-color: var(--em-primary);
		background-color: var(--em-info-bg);
	}

	.method-icon {
		font-size: 1rem;
	}

	.method-name {
		font-weight: 500;
		color: var(--em-text-secondary);
	}

	.payment-option.selected .method-name {
		color: var(--em-text-primary);
	}

	.notes-input {
		resize: vertical;
		min-height: 80px;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--em-border);
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

	/* Delete Modal */
	.delete-modal-content {
		text-align: center;
	}

	.delete-modal-content p {
		color: var(--em-text-secondary);
		margin: 0 0 1rem;
	}

	.delete-expense-preview {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
		margin-bottom: 1rem;
	}

	.preview-description {
		font-weight: 500;
	}

	.preview-amount {
		font-weight: 600;
		color: var(--em-expense);
	}

	.delete-warning {
		font-size: 0.875rem;
		color: var(--em-expense);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	@media (max-width: 600px) {
		.detail-header {
			flex-wrap: wrap;
		}

		.expense-amount {
			width: 100%;
			text-align: right;
			margin-top: 0.5rem;
		}

		.detail-grid {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
