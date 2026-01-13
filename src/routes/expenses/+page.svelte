<script lang="ts">
	import { goto } from '$app/navigation';
	import { PageHeader, EmptyState, Modal } from '$lib/components';
	import { 
		expenses,
		expenseActions,
		categories 
	} from '$lib/stores';
	import { preferences } from '$lib/stores/preferences';
	import { formatCurrency, formatDate, searchExpenses, sortExpenses, filterByDateRange } from '$lib/utils';

	// Filter state
	let searchQuery = $state('');
	let selectedCategoryFilters = $state<string[]>([]);
	let sortBy = $state('date-desc');
	let showFilters = $state(false);
	
	// Bulk selection state
	let selectedExpenseIds = $state<Set<string>>(new Set());
	let showBulkDeleteModal = $state(false);
	let showBulkCategoryModal = $state(false);
	let bulkCategoryId = $state('');
	
	// Compute filtered expenses
	let filteredExpenses = $derived(() => {
		let result = [...$expenses];
		
		// Apply search
		if (searchQuery.trim()) {
			result = searchExpenses(result, searchQuery);
		}
		
		// Apply category filter (multi-select)
		if (selectedCategoryFilters.length > 0) {
			result = result.filter(exp => selectedCategoryFilters.includes(exp.categoryId));
		}
		
		// Apply sort
		const [field, direction] = sortBy.split('-') as ['date' | 'amount' | 'description', 'asc' | 'desc'];
		result = sortExpenses(result, field, direction);
		
		return result;
	});
	
	// Check if all filtered expenses are selected
	let allSelected = $derived(() => {
		const filtered = filteredExpenses();
		return filtered.length > 0 && filtered.every(e => selectedExpenseIds.has(e.id));
	});
	
	// Number of selected items
	let selectedCount = $derived(selectedExpenseIds.size);
	
	// Check if any filters are active
	let hasActiveFilters = $derived(
		searchQuery.trim() !== '' || selectedCategoryFilters.length > 0 || sortBy !== 'date-desc'
	);

	function getCategoryInfo(categoryId: string) {
		const cat = $categories.find(c => c.id === categoryId);
		return cat || { name: 'Unknown', icon: '📋', color: '#64748B' };
	}

	function handleDelete(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (confirm('Are you sure you want to delete this expense?')) {
			expenseActions.delete(id);
			selectedExpenseIds.delete(id);
			selectedExpenseIds = new Set(selectedExpenseIds);
		}
	}

	function toggleCategoryFilter(catId: string) {
		if (selectedCategoryFilters.includes(catId)) {
			selectedCategoryFilters = selectedCategoryFilters.filter(id => id !== catId);
		} else {
			selectedCategoryFilters = [...selectedCategoryFilters, catId];
		}
	}

	function clearFilters() {
		searchQuery = '';
		selectedCategoryFilters = [];
		sortBy = 'date-desc';
	}
	
	// Selection functions
	function toggleSelection(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (selectedExpenseIds.has(id)) {
			selectedExpenseIds.delete(id);
		} else {
			selectedExpenseIds.add(id);
		}
		selectedExpenseIds = new Set(selectedExpenseIds);
	}
	
	function toggleSelectAll() {
		const filtered = filteredExpenses();
		if (allSelected()) {
			// Deselect all filtered
			filtered.forEach(e => selectedExpenseIds.delete(e.id));
		} else {
			// Select all filtered
			filtered.forEach(e => selectedExpenseIds.add(e.id));
		}
		selectedExpenseIds = new Set(selectedExpenseIds);
	}
	
	function clearSelection() {
		selectedExpenseIds = new Set();
	}
	
	// Bulk actions
	function handleBulkDelete() {
		const count = expenseActions.deleteMany([...selectedExpenseIds]);
		selectedExpenseIds = new Set();
		showBulkDeleteModal = false;
	}
	
	function handleBulkCategoryChange() {
		if (!bulkCategoryId) return;
		
		selectedExpenseIds.forEach(id => {
			expenseActions.update(id, { categoryId: bulkCategoryId });
		});
		
		selectedExpenseIds = new Set();
		showBulkCategoryModal = false;
		bulkCategoryId = '';
	}
	
	function openBulkCategoryModal() {
		bulkCategoryId = '';
		showBulkCategoryModal = true;
	}
</script>

<svelte:head>
	<title>Expenses | Expense Manager</title>
	<meta name="description" content="View and manage all your expenses." />
</svelte:head>

<div class="expenses-page">
	<div class="container mx-auto px-4">
		<PageHeader 
			title="Expenses" 
			subtitle="View and manage all your expenses"
		/>

		<!-- Bulk Action Bar -->
		{#if selectedCount > 0}
			<div class="bulk-action-bar">
				<div class="bulk-info">
					<button class="clear-selection-btn" onclick={clearSelection} aria-label="Clear selection">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
					<span class="selected-count">{selectedCount} selected</span>
				</div>
				<div class="bulk-actions">
					<button class="em-btn em-btn-ghost" onclick={openBulkCategoryModal}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
							<line x1="7" y1="7" x2="7.01" y2="7"></line>
						</svg>
						Change Category
					</button>
					<button class="em-btn em-btn-danger" onclick={() => showBulkDeleteModal = true}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="3 6 5 6 21 6"></polyline>
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
						</svg>
						Delete Selected
					</button>
				</div>
			</div>
		{:else}
			<!-- Search and Filter Bar -->
			<div class="toolbar">
				<div class="search-box">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					<input 
						type="text" 
						placeholder="Search expenses..." 
						class="search-input"
						bind:value={searchQuery}
					/>
					{#if searchQuery}
						<button class="clear-search" onclick={() => searchQuery = ''} aria-label="Clear search">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					{/if}
				</div>
				
				<button 
					class="filter-toggle" 
					class:active={showFilters || hasActiveFilters}
					onclick={() => showFilters = !showFilters}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
					</svg>
					Filters
					{#if hasActiveFilters}
						<span class="filter-badge"></span>
					{/if}
				</button>

				<a href="/add" class="add-btn em-btn em-btn-primary">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					<span class="add-btn-text">Add</span>
				</a>
			</div>
		{/if}

		<!-- Filter Panel -->
		{#if showFilters && selectedCount === 0}
			<div class="filter-panel em-card">
				<div class="filter-header">
					<h3 class="filter-title">Filters & Sort</h3>
					{#if hasActiveFilters}
						<button class="clear-filters-btn" onclick={clearFilters}>
							Clear All
						</button>
					{/if}
				</div>

				<div class="filter-content">
					<!-- Sort -->
					<div class="filter-group">
						<label class="filter-label">Sort By</label>
						<select class="em-input filter-select" bind:value={sortBy}>
							<option value="date-desc">Newest First</option>
							<option value="date-asc">Oldest First</option>
							<option value="amount-desc">Highest Amount</option>
							<option value="amount-asc">Lowest Amount</option>
						</select>
					</div>

					<!-- Categories (Multi-select) -->
					<div class="filter-group">
						<label class="filter-label">Categories</label>
						<div class="category-chips">
							{#each $categories as cat}
								<button 
									class="category-chip"
									class:selected={selectedCategoryFilters.includes(cat.id)}
									onclick={() => toggleCategoryFilter(cat.id)}
									style="--chip-color: {cat.color}"
								>
									<span class="chip-icon">{cat.icon}</span>
									<span class="chip-name">{cat.name}</span>
									{#if selectedCategoryFilters.includes(cat.id)}
										<svg class="chip-check" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
											<polyline points="20 6 9 17 4 12"></polyline>
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Expense List -->
		<div class="expense-list em-card">
			{#if filteredExpenses().length === 0}
				<EmptyState 
					title="No expenses found"
					message={hasActiveFilters ? "Try adjusting your filters" : "Add your first expense to get started"}
					icon="🔍"
					actionLabel="Add Expense"
					actionHref="/add"
				/>
			{:else}
				<div class="list-header">
					<span class="header-item checkbox">
						<input 
							type="checkbox" 
							class="row-checkbox"
							checked={allSelected()}
							onchange={toggleSelectAll}
							aria-label="Select all expenses"
						/>
					</span>
					<span class="header-item description">Description</span>
					<span class="header-item category">Category</span>
					<span class="header-item date">Date</span>
					<span class="header-item amount">Amount</span>
					<span class="header-item actions">Actions</span>
				</div>
				
				{#each filteredExpenses() as expense}
					{@const category = getCategoryInfo(expense.categoryId)}
					{@const isSelected = selectedExpenseIds.has(expense.id)}
					<a href="/expenses/{expense.id}" class="list-row" class:selected={isSelected}>
						<div class="cell checkbox" onclick={(e) => toggleSelection(expense.id, e)}>
							<input 
								type="checkbox" 
								class="row-checkbox"
								checked={isSelected}
								onclick={(e) => e.stopPropagation()}
								onchange={(e) => toggleSelection(expense.id, e)}
							/>
						</div>
						<div class="cell description">
							<span class="expense-icon">{category.icon}</span>
							<span class="expense-name">{expense.description}</span>
						</div>
						<div class="cell category">
							<span class="category-badge" style="background-color: {category.color}20; color: {category.color};">
								{category.name}
							</span>
						</div>
						<div class="cell date">{formatDate(expense.date, $preferences.dateFormat)}</div>
						<div class="cell amount amount-negative">-{formatCurrency(expense.amount, $preferences.currency)}</div>
						<div class="cell actions">
							<button 
								class="action-btn edit" 
								aria-label="Edit expense" 
								onclick={(e) => { e.preventDefault(); goto(`/expenses/${expense.id}?edit=true`); }}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
								</svg>
							</button>
							<button 
								class="action-btn delete" 
								aria-label="Delete expense" 
								onclick={(e) => handleDelete(expense.id, e)}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
								</svg>
							</button>
						</div>
					</a>
				{/each}
				
				<div class="list-footer">
					<span class="count">{filteredExpenses().length} expense{filteredExpenses().length !== 1 ? 's' : ''}</span>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Bulk Delete Modal -->
{#snippet bulkDeleteContent()}
	<div class="modal-content-center">
		<p>Are you sure you want to delete <strong>{selectedCount}</strong> expense{selectedCount !== 1 ? 's' : ''}?</p>
		<p class="warning-text">This action cannot be undone.</p>
	</div>
{/snippet}

{#snippet bulkDeleteFooter()}
	<button class="em-btn em-btn-ghost" onclick={() => showBulkDeleteModal = false}>
		Cancel
	</button>
	<button class="em-btn em-btn-danger" onclick={handleBulkDelete}>
		Delete {selectedCount} Expense{selectedCount !== 1 ? 's' : ''}
	</button>
{/snippet}

<Modal 
	open={showBulkDeleteModal} 
	title="Delete Expenses" 
	onclose={() => showBulkDeleteModal = false}
	children={bulkDeleteContent}
	footer={bulkDeleteFooter}
/>

<!-- Bulk Category Change Modal -->
{#snippet bulkCategoryContent()}
	<div class="modal-form">
		<p>Select a new category for <strong>{selectedCount}</strong> expense{selectedCount !== 1 ? 's' : ''}:</p>
		<select class="em-input" bind:value={bulkCategoryId}>
			<option value="">Select a category...</option>
			{#each $categories as cat}
				<option value={cat.id}>{cat.icon} {cat.name}</option>
			{/each}
		</select>
	</div>
{/snippet}

{#snippet bulkCategoryFooter()}
	<button class="em-btn em-btn-ghost" onclick={() => showBulkCategoryModal = false}>
		Cancel
	</button>
	<button class="em-btn em-btn-primary" onclick={handleBulkCategoryChange} disabled={!bulkCategoryId}>
		Change Category
	</button>
{/snippet}

<Modal 
	open={showBulkCategoryModal} 
	title="Change Category" 
	onclose={() => showBulkCategoryModal = false}
	children={bulkCategoryContent}
	footer={bulkCategoryFooter}
/>

<style>
	.expenses-page {
		padding-bottom: 2rem;
	}

	/* Bulk Action Bar */
	.bulk-action-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background-color: var(--em-primary);
		border-radius: var(--em-radius-md);
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.bulk-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.clear-selection-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: rgba(255, 255, 255, 0.2);
		border: none;
		border-radius: var(--em-radius-sm);
		color: white;
		cursor: pointer;
		transition: background-color var(--em-transition-fast);
	}

	.clear-selection-btn:hover {
		background-color: rgba(255, 255, 255, 0.3);
	}

	.selected-count {
		font-weight: 600;
		color: white;
	}

	.bulk-actions {
		display: flex;
		gap: 0.5rem;
	}

	.bulk-actions .em-btn-ghost {
		background-color: rgba(255, 255, 255, 0.15);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.bulk-actions .em-btn-ghost:hover {
		background-color: rgba(255, 255, 255, 0.25);
	}

	/* Toolbar */
	.toolbar {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
		align-items: center;
	}

	.search-box {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background-color: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
		padding: 0 1rem;
	}

	.search-box svg {
		color: var(--em-text-muted);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		padding: 0.75rem 0;
		color: var(--em-text-primary);
		font-size: 1rem;
		min-width: 0;
	}

	.search-input:focus {
		outline: none;
	}

	.clear-search {
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--em-text-muted);
		cursor: pointer;
		padding: 0.25rem;
	}

	.clear-search:hover {
		color: var(--em-text-primary);
	}

	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
		color: var(--em-text-secondary);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--em-transition-fast);
		position: relative;
	}

	.filter-toggle:hover,
	.filter-toggle.active {
		background-color: var(--em-surface-hover);
		color: var(--em-text-primary);
		border-color: var(--em-primary);
	}

	.filter-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 10px;
		height: 10px;
		background-color: var(--em-primary);
		border-radius: 50%;
	}

	.add-btn {
		text-decoration: none;
		white-space: nowrap;
	}

	.add-btn-text {
		display: none;
	}

	@media (min-width: 640px) {
		.add-btn-text {
			display: inline;
		}
	}

	/* Filter Panel */
	.filter-panel {
		margin-bottom: 1rem;
		padding: 1rem;
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.filter-title {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0;
		color: var(--em-text-primary);
	}

	.clear-filters-btn {
		background: transparent;
		border: none;
		color: var(--em-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.clear-filters-btn:hover {
		text-decoration: underline;
	}

	.filter-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--em-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.filter-select {
		max-width: 200px;
	}

	/* Category Chips */
	.category-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.category-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background-color: var(--em-bg-tertiary);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-full);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.category-chip:hover {
		background-color: var(--em-bg-hover);
	}

	.category-chip.selected {
		background-color: var(--chip-color, var(--em-primary));
		border-color: var(--chip-color, var(--em-primary));
		color: white;
	}

	.chip-icon {
		font-size: 0.875rem;
	}

	.chip-name {
		font-weight: 500;
	}

	.chip-check {
		margin-left: 0.125rem;
	}

	/* List Styles */
	.expense-list {
		overflow: hidden;
	}

	.list-header {
		display: none;
		padding: 1rem 1.25rem;
		background-color: var(--em-bg-tertiary);
		border-bottom: 1px solid var(--em-border);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--em-text-muted);
	}

	@media (min-width: 768px) {
		.list-header {
			display: grid;
			grid-template-columns: 40px 2fr 1fr 1fr 1fr 100px;
			gap: 1rem;
			align-items: center;
		}
	}

	.header-item.checkbox {
		display: flex;
		justify-content: center;
	}

	a.list-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--em-border);
		transition: background-color var(--em-transition-fast);
		text-decoration: none;
		color: inherit;
		cursor: pointer;
	}

	a.list-row:hover {
		background-color: var(--em-bg-hover);
	}

	a.list-row.selected {
		background-color: var(--em-info-bg);
	}

	a.list-row:last-of-type {
		border-bottom: none;
	}

	@media (min-width: 768px) {
		a.list-row {
			display: grid;
			grid-template-columns: 40px 2fr 1fr 1fr 1fr 100px;
			gap: 1rem;
			align-items: center;
		}
	}

	.cell {
		display: flex;
		align-items: center;
	}

	.cell.checkbox {
		justify-content: center;
	}

	.row-checkbox {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: var(--em-primary);
	}

	.cell.description {
		flex: 1;
		gap: 0.75rem;
		min-width: 200px;
	}

	.expense-icon {
		font-size: 1.25rem;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
	}

	.expense-name {
		font-weight: 500;
		color: var(--em-text-primary);
	}

	.cell.category {
		width: 100%;
	}

	@media (min-width: 768px) {
		.cell.category {
			width: auto;
		}
		
		.cell.checkbox {
			display: flex;
		}
	}

	@media (max-width: 767px) {
		.cell.checkbox {
			position: absolute;
			right: 1rem;
			top: 1rem;
		}
		
		a.list-row {
			position: relative;
			padding-right: 3rem;
		}
	}

	.category-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: var(--em-radius-full);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.cell.date {
		font-size: 0.875rem;
		color: var(--em-text-secondary);
	}

	.cell.amount {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.cell.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background-color: var(--em-bg-tertiary);
		border: none;
		border-radius: var(--em-radius-md);
		color: var(--em-text-secondary);
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.action-btn:hover {
		background-color: var(--em-bg-hover);
		color: var(--em-text-primary);
	}

	.action-btn.edit:hover {
		background-color: var(--em-info-bg);
		color: var(--em-primary);
	}

	.action-btn.delete:hover {
		background-color: var(--em-expense-bg);
		color: var(--em-expense);
	}

	.list-footer {
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--em-border);
		text-align: center;
	}

	.count {
		font-size: 0.875rem;
		color: var(--em-text-muted);
	}

	/* Modal content */
	.modal-content-center {
		text-align: center;
	}

	.modal-content-center p {
		margin: 0 0 0.5rem;
		color: var(--em-text-secondary);
	}

	.warning-text {
		color: var(--em-expense) !important;
		font-size: 0.875rem;
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.modal-form p {
		margin: 0;
		color: var(--em-text-secondary);
	}

	@media (max-width: 639px) {
		.toolbar {
			flex-wrap: wrap;
		}

		.search-box {
			width: 100%;
			order: 1;
		}

		.filter-toggle {
			order: 2;
			flex: 1;
		}

		.add-btn {
			order: 3;
		}

		.bulk-action-bar {
			flex-direction: column;
			align-items: stretch;
		}

		.bulk-info {
			justify-content: center;
		}

		.bulk-actions {
			flex-direction: column;
		}
	}
</style>
