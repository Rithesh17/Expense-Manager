<script lang="ts">
	import { PageHeader, EmptyState, Modal, EmojiPicker, ColorPicker } from '$lib/components';
	import { categories, categoryActions, expenses, expenseActions, monthExpenses } from '$lib/stores';
	import { preferences } from '$lib/stores/preferences';
	import { formatCurrency, calculateTotal } from '$lib/utils';
	import type { Category, BudgetPeriod } from '$lib/types';

	// Modal states
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let editingCategory = $state<Category | null>(null);
	let deletingCategory = $state<Category | null>(null);

	// Add form state
	let addName = $state('');
	let addIcon = $state('📋');
	let addColor = $state('#3B82F6');
	let addBudget = $state('');
	let addBudgetPeriod = $state<BudgetPeriod>('monthly');
	let addError = $state('');

	// Edit form state
	let editName = $state('');
	let editIcon = $state('📋');
	let editColor = $state('#3B82F6');
	let editBudget = $state('');
	let editBudgetPeriod = $state<BudgetPeriod>('monthly');
	let editError = $state('');

	// Delete state
	let reassignCategoryId = $state('');
	let deleteExpenses = $state(false);

	// Calculate stats for each category
	function getCategoryStats(categoryId: string) {
		const allCategoryExpenses = $expenses.filter(e => e.categoryId === categoryId);
		const monthCategoryExpenses = $monthExpenses.filter(e => e.categoryId === categoryId);
		return {
			totalExpenseCount: allCategoryExpenses.length,
			monthExpenseCount: monthCategoryExpenses.length,
			monthSpent: calculateTotal(monthCategoryExpenses)
		};
	}

	function getBudgetPercentage(spent: number, budget: number | undefined) {
		if (!budget || budget === 0) return 0;
		return Math.min((spent / budget) * 100, 100);
	}

	function getBudgetStatus(spent: number, budget: number | undefined) {
		if (!budget) return 'none';
		const percentage = spent / budget;
		if (percentage >= 1) return 'danger';
		if (percentage >= 0.8) return 'warning';
		return 'safe';
	}

	// Add Category
	function openAddModal() {
		addName = '';
		addIcon = '📋';
		addColor = '#3B82F6';
		addBudget = '';
		addBudgetPeriod = 'monthly';
		addError = '';
		showAddModal = true;
	}

	function handleAddCategory() {
		addError = '';

		if (!addName.trim()) {
			addError = 'Category name is required';
			return;
		}

		// Check for duplicate name
		if ($categories.some(c => c.name.toLowerCase() === addName.trim().toLowerCase())) {
			addError = 'A category with this name already exists';
			return;
		}

		categoryActions.add({
			userId: 'local',
			name: addName.trim(),
			icon: addIcon,
			color: addColor,
			budget: addBudget ? parseFloat(addBudget) : undefined,
			budgetPeriod: addBudget ? addBudgetPeriod : undefined
		});

		showAddModal = false;
	}

	// Edit Category
	function openEditModal(category: Category) {
		editingCategory = category;
		editName = category.name;
		editIcon = category.icon;
		editColor = category.color;
		editBudget = category.budget?.toString() || '';
		editBudgetPeriod = category.budgetPeriod || 'monthly';
		editError = '';
		showEditModal = true;
	}

	function handleEditCategory() {
		if (!editingCategory) return;
		editError = '';

		if (!editName.trim()) {
			editError = 'Category name is required';
			return;
		}

		// Check for duplicate name (excluding current category)
		if ($categories.some(c => c.id !== editingCategory!.id && c.name.toLowerCase() === editName.trim().toLowerCase())) {
			editError = 'A category with this name already exists';
			return;
		}

		categoryActions.update(editingCategory.id, {
			name: editName.trim(),
			icon: editIcon,
			color: editColor,
			budget: editBudget ? parseFloat(editBudget) : undefined,
			budgetPeriod: editBudget ? editBudgetPeriod : undefined
		});

		showEditModal = false;
		editingCategory = null;
	}

	function closeEditModal() {
		showEditModal = false;
		editingCategory = null;
	}

	// Delete Category
	function openDeleteModal(category: Category) {
		deletingCategory = category;
		reassignCategoryId = '';
		deleteExpenses = false;
		showDeleteModal = true;
	}

	function handleDeleteCategory() {
		if (!deletingCategory) return;

		const categoryExpenses = $expenses.filter(e => e.categoryId === deletingCategory!.id);

		if (categoryExpenses.length > 0) {
			if (deleteExpenses) {
				// Delete all expenses in this category
				const expenseIds = categoryExpenses.map(e => e.id);
				expenseActions.deleteMany(expenseIds);
			} else if (reassignCategoryId) {
				// Reassign expenses to another category
				categoryExpenses.forEach(expense => {
					expenseActions.update(expense.id, { categoryId: reassignCategoryId });
				});
			} else {
				// No action specified - can't delete
				return;
			}
		}

		categoryActions.delete(deletingCategory.id);
		showDeleteModal = false;
		deletingCategory = null;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		deletingCategory = null;
	}

	// Get other categories for reassignment dropdown
	let otherCategories = $derived(
		deletingCategory ? $categories.filter(c => c.id !== deletingCategory.id) : $categories
	);

	// Get expense count for deleting category
	let deletingCategoryExpenseCount = $derived(
		deletingCategory ? $expenses.filter(e => e.categoryId === deletingCategory.id).length : 0
	);

	// Determine if category is system category
	function isSystemCategory(category: Category) {
		return category.userId === null;
	}
</script>

<svelte:head>
	<title>Categories | Expense Manager</title>
	<meta name="description" content="Manage your expense categories." />
</svelte:head>

<div class="categories-page">
	<div class="container mx-auto px-4">
		<PageHeader 
			title="Categories" 
			subtitle="Organize your expenses by category"
		/>

		<!-- Actions Bar -->
		<div class="actions-bar">
			<div class="category-count">
				{$categories.length} categor{$categories.length === 1 ? 'y' : 'ies'}
			</div>
			<button class="em-btn em-btn-primary" onclick={openAddModal}>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				Add Category
			</button>
		</div>

		<!-- Categories Grid -->
		{#if $categories.length === 0}
			<EmptyState
				title="No categories"
				message="Create your first category to organize expenses"
				icon="🏷️"
			/>
		{:else}
			<div class="categories-grid">
				{#each $categories as category}
					{@const stats = getCategoryStats(category.id)}
					{@const budgetStatus = getBudgetStatus(stats.monthSpent, category.budget)}
					<div class="category-card em-card">
						<div class="card-header">
							<div class="category-icon" style="background-color: {category.color}20;">
								<span>{category.icon}</span>
							</div>
							<div class="card-actions">
								<button 
									class="action-btn" 
									aria-label="Edit category" 
									onclick={() => openEditModal(category)}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
										<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
									</svg>
								</button>
								<button 
									class="action-btn delete" 
									aria-label="Delete category" 
									onclick={() => openDeleteModal(category)}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polyline points="3 6 5 6 21 6"></polyline>
										<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
									</svg>
								</button>
							</div>
						</div>

						<div class="card-body">
							<h3 class="category-name">{category.name}</h3>
							<p class="expense-count">
								{stats.totalExpenseCount} total expense{stats.totalExpenseCount !== 1 ? 's' : ''}
								{#if stats.monthExpenseCount > 0}
									<span class="month-count">({stats.monthExpenseCount} this month)</span>
								{/if}
							</p>
							{#if isSystemCategory(category)}
								<span class="system-badge">System</span>
							{/if}
						</div>

						<div class="card-stats">
							<div class="stat-row">
								<span class="stat-label">This Month</span>
								<span class="stat-value">{formatCurrency(stats.monthSpent, $preferences.currency)}</span>
							</div>
							{#if category.budget}
								<div class="stat-row">
									<span class="stat-label">Budget ({category.budgetPeriod})</span>
									<span class="stat-value">{formatCurrency(category.budget, $preferences.currency)}</span>
								</div>
							{/if}
						</div>

						{#if category.budget}
							<div class="budget-progress">
								<div class="progress-bar">
									<div 
										class="progress-fill {budgetStatus}"
										style="width: {getBudgetPercentage(stats.monthSpent, category.budget)}%;"
									></div>
								</div>
								<span class="progress-text {budgetStatus}">
									{Math.round(getBudgetPercentage(stats.monthSpent, category.budget))}% used
								</span>
							</div>
						{:else}
							<div class="no-budget">
								<span class="no-budget-text">No budget set</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Add Category Modal -->
{#snippet addModalContent()}
	<form class="category-form" onsubmit={(e) => { e.preventDefault(); handleAddCategory(); }}>
		{#if addError}
			<div class="form-error">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="8" x2="12" y2="12"></line>
					<line x1="12" y1="16" x2="12.01" y2="16"></line>
				</svg>
				{addError}
			</div>
		{/if}

		<div class="form-group">
			<label class="em-label" for="add-name">Category Name</label>
			<input 
				type="text" 
				id="add-name"
				class="em-input"
				placeholder="e.g., Groceries"
				bind:value={addName}
				required
			/>
		</div>

		<div class="form-row">
			<div class="form-group icon-group">
				<label class="em-label">Icon</label>
				<EmojiPicker value={addIcon} onselect={(emoji) => addIcon = emoji} />
			</div>

			<div class="form-group color-group">
				<label class="em-label">Color</label>
				<ColorPicker value={addColor} onselect={(color) => addColor = color} />
			</div>
		</div>

		<div class="form-group">
			<label class="em-label" for="add-budget">Monthly Budget (Optional)</label>
			<div class="budget-input-row">
				<span class="currency-symbol">$</span>
				<input 
					type="number" 
					id="add-budget"
					class="em-input budget-input"
					placeholder="0.00"
					step="0.01"
					min="0"
					bind:value={addBudget}
				/>
			</div>
		</div>
	</form>
{/snippet}

{#snippet addModalFooter()}
	<button type="button" class="em-btn em-btn-ghost" onclick={() => showAddModal = false}>
		Cancel
	</button>
	<button type="button" class="em-btn em-btn-primary" onclick={handleAddCategory}>
		Create Category
	</button>
{/snippet}

<Modal 
	open={showAddModal} 
	title="Add Category" 
	onclose={() => showAddModal = false}
	children={addModalContent}
	footer={addModalFooter}
	size="lg"
/>

<!-- Edit Category Modal -->
{#snippet editModalContent()}
	<form class="category-form" onsubmit={(e) => { e.preventDefault(); handleEditCategory(); }}>
		{#if editError}
			<div class="form-error">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="8" x2="12" y2="12"></line>
					<line x1="12" y1="16" x2="12.01" y2="16"></line>
				</svg>
				{editError}
			</div>
		{/if}

		<div class="form-group">
			<label class="em-label" for="edit-name">Category Name</label>
			<input 
				type="text" 
				id="edit-name"
				class="em-input"
				placeholder="e.g., Groceries"
				bind:value={editName}
				required
			/>
		</div>

		<div class="form-row">
			<div class="form-group icon-group">
				<label class="em-label">Icon</label>
				<EmojiPicker value={editIcon} onselect={(emoji) => editIcon = emoji} />
			</div>

			<div class="form-group color-group">
				<label class="em-label">Color</label>
				<ColorPicker value={editColor} onselect={(color) => editColor = color} />
			</div>
		</div>

		<div class="form-group">
			<label class="em-label" for="edit-budget">Monthly Budget (Optional)</label>
			<div class="budget-input-row">
				<span class="currency-symbol">$</span>
				<input 
					type="number" 
					id="edit-budget"
					class="em-input budget-input"
					placeholder="0.00"
					step="0.01"
					min="0"
					bind:value={editBudget}
				/>
			</div>
		</div>
	</form>
{/snippet}

{#snippet editModalFooter()}
	<button type="button" class="em-btn em-btn-ghost" onclick={closeEditModal}>
		Cancel
	</button>
	<button type="button" class="em-btn em-btn-primary" onclick={handleEditCategory}>
		Save Changes
	</button>
{/snippet}

<Modal 
	open={showEditModal} 
	title="Edit Category" 
	onclose={closeEditModal}
	children={editModalContent}
	footer={editModalFooter}
	size="lg"
/>

<!-- Delete Category Modal -->
{#snippet deleteModalContent()}
	<div class="delete-content">
		{#if deletingCategory}
			<div class="delete-preview">
				<div class="preview-icon" style="background-color: {deletingCategory.color}20;">
					<span>{deletingCategory.icon}</span>
				</div>
				<span class="preview-name">{deletingCategory.name}</span>
			</div>

			{#if deletingCategoryExpenseCount > 0}
				<div class="warning-box">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
						<line x1="12" y1="9" x2="12" y2="13"></line>
						<line x1="12" y1="17" x2="12.01" y2="17"></line>
					</svg>
					<p>This category has <strong>{deletingCategoryExpenseCount}</strong> expense{deletingCategoryExpenseCount !== 1 ? 's' : ''}.</p>
				</div>

				<div class="reassign-options">
					<label class="option-label">
						<input 
							type="radio" 
							name="delete-action" 
							value="reassign"
							checked={!deleteExpenses}
							onchange={() => deleteExpenses = false}
						/>
						<span>Reassign expenses to another category</span>
					</label>

					{#if !deleteExpenses}
						<select 
							class="em-input reassign-select" 
							bind:value={reassignCategoryId}
						>
							<option value="">Select a category...</option>
							{#each otherCategories as cat}
								<option value={cat.id}>{cat.icon} {cat.name}</option>
							{/each}
						</select>
					{/if}

					<label class="option-label danger-option">
						<input 
							type="radio" 
							name="delete-action" 
							value="delete"
							checked={deleteExpenses}
							onchange={() => deleteExpenses = true}
						/>
						<span>Delete all {deletingCategoryExpenseCount} expense{deletingCategoryExpenseCount !== 1 ? 's' : ''}</span>
					</label>
				</div>
			{:else}
				<p class="delete-message">Are you sure you want to delete this category?</p>
			{/if}

			<p class="delete-warning">This action cannot be undone.</p>
		{/if}
	</div>
{/snippet}

{#snippet deleteModalFooter()}
	<button type="button" class="em-btn em-btn-ghost" onclick={closeDeleteModal}>
		Cancel
	</button>
	<button 
		type="button" 
		class="em-btn em-btn-danger" 
		onclick={handleDeleteCategory}
		disabled={deletingCategoryExpenseCount > 0 && !deleteExpenses && !reassignCategoryId}
	>
		Delete Category
	</button>
{/snippet}

<Modal 
	open={showDeleteModal} 
	title="Delete Category" 
	onclose={closeDeleteModal}
	children={deleteModalContent}
	footer={deleteModalFooter}
/>

<style>
	.categories-page {
		padding-bottom: 2rem;
	}

	.actions-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.category-count {
		font-size: 0.875rem;
		color: var(--em-text-muted);
	}

	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.category-card {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.category-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--em-radius-md);
		font-size: 1.5rem;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: var(--em-bg-tertiary);
		border: none;
		border-radius: var(--em-radius-sm);
		color: var(--em-text-muted);
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.action-btn:hover {
		background-color: var(--em-bg-hover);
		color: var(--em-text-primary);
	}

	.action-btn.delete:hover {
		background-color: var(--em-expense-bg);
		color: var(--em-expense);
	}

	.card-body {
		flex: 1;
	}

	.category-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--em-text-primary);
		margin: 0 0 0.25rem;
	}

	.expense-count {
		font-size: 0.875rem;
		color: var(--em-text-muted);
		margin: 0;
	}

	.month-count {
		color: var(--em-text-secondary);
	}

	.system-badge {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.125rem 0.5rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background-color: var(--em-bg-tertiary);
		color: var(--em-text-muted);
		border-radius: var(--em-radius-full);
	}

	.card-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0;
		border-top: 1px solid var(--em-border);
		border-bottom: 1px solid var(--em-border);
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--em-text-muted);
	}

	.stat-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--em-text-primary);
		font-variant-numeric: tabular-nums;
	}

	.budget-progress {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.progress-bar {
		width: 100%;
		height: 6px;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-full);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: var(--em-radius-full);
		transition: width 0.5s ease-out;
	}

	.progress-fill.safe {
		background-color: var(--em-income);
	}

	.progress-fill.warning {
		background-color: var(--em-warning);
	}

	.progress-fill.danger {
		background-color: var(--em-expense);
	}

	.progress-text {
		font-size: 0.75rem;
		font-weight: 500;
	}

	.progress-text.safe {
		color: var(--em-income);
	}

	.progress-text.warning {
		color: var(--em-warning);
	}

	.progress-text.danger {
		color: var(--em-expense);
	}

	.no-budget {
		padding-top: 0.5rem;
	}

	.no-budget-text {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		font-style: italic;
	}

	/* Form Styles */
	.category-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--em-expense-bg);
		border-radius: var(--em-radius-sm);
		color: var(--em-expense);
		font-size: 0.875rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 600px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	.budget-input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.currency-symbol {
		font-size: 1.25rem;
		color: var(--em-text-muted);
	}

	.budget-input {
		flex: 1;
	}

	/* Delete Modal Styles */
	.delete-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.delete-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
	}

	.preview-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--em-radius-sm);
		font-size: 1.25rem;
	}

	.preview-name {
		font-weight: 600;
		color: var(--em-text-primary);
	}

	.warning-box {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--em-warning-bg);
		border-radius: var(--em-radius-md);
		color: var(--em-warning);
	}

	.warning-box svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.warning-box p {
		margin: 0;
		font-size: 0.875rem;
	}

	.reassign-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.option-label input[type="radio"] {
		accent-color: var(--em-primary);
	}

	.danger-option span {
		color: var(--em-expense);
	}

	.reassign-select {
		margin-left: 1.5rem;
	}

	.delete-message {
		text-align: center;
		color: var(--em-text-secondary);
		margin: 0;
	}

	.delete-warning {
		text-align: center;
		font-size: 0.875rem;
		color: var(--em-expense);
		margin: 0;
	}
</style>
