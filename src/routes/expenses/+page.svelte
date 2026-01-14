<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { PageHeader, EmptyState, Modal, DemoPreview } from '$lib/components';
	import { 
		expenses,
		expenseActions,
		categories,
		isAuthenticated,
		authLoading
	} from '$lib/stores';
	import { preferences } from '$lib/stores/preferences';
	import { 
		formatCurrency, 
		formatDate, 
		searchExpenses, 
		sortExpenses, 
		filterByDateRange,
		startOfWeek,
		startOfMonth,
		startOfYear
	} from '$lib/utils';
	import type { PaymentMethod } from '$lib/types';

	// Search state
	let searchQuery = $state('');
	
	// Filter state
	let selectedCategoryFilters = $state<string[]>([]);
	let selectedPaymentMethods = $state<PaymentMethod[]>([]);
	let dateFrom = $state('');
	let dateTo = $state('');
	let amountMin = $state('');
	let amountMax = $state('');
	let quickFilter = $state<'today' | 'week' | 'month' | 'year' | 'all'>('all');
	
	// Sort state
	let sortBy = $state('date-desc');
	
	// UI state
	let showFilters = $state(false);
	
	// Bulk selection state
	let selectedExpenseIds = $state<Set<string>>(new Set());
	let showBulkDeleteModal = $state(false);
	let showBulkCategoryModal = $state(false);
	let bulkCategoryId = $state('');
	
	// Payment method options
	const paymentMethods: Array<{value: PaymentMethod, label: string, icon: string}> = [
		{ value: 'cash', label: 'Cash', icon: '💵' },
		{ value: 'card', label: 'Card', icon: '💳' },
		{ value: 'digital', label: 'Digital', icon: '📱' },
		{ value: 'bank', label: 'Bank', icon: '🏦' },
		{ value: 'other', label: 'Other', icon: '📋' }
	];
	
	// Apply quick filter and reset date fields
	function applyQuickFilter(filter: typeof quickFilter) {
		quickFilter = filter;
		dateFrom = '';
		dateTo = '';
	}
	
	// Compute filtered expenses
	let filteredExpenses = $derived(() => {
		let result = [...$expenses];
		
		// Apply quick filter or date range
		if (quickFilter !== 'all' && !dateFrom && !dateTo) {
			const now = new Date();
			let start: Date;
			let end = now;
			
			switch (quickFilter) {
				case 'today':
					start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
					break;
				case 'week':
					start = startOfWeek();
					break;
				case 'month':
					start = startOfMonth();
					break;
				case 'year':
					start = startOfYear();
					break;
				default:
					start = new Date(0);
			}
			result = filterByDateRange(result, start, end);
		} else if (dateFrom || dateTo) {
			const start = dateFrom ? new Date(dateFrom) : new Date(0);
			const end = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
			result = filterByDateRange(result, start, end);
		}
		
		// Apply search
		if (searchQuery.trim()) {
			result = searchExpenses(result, searchQuery);
		}
		
		// Apply category filter (multi-select)
		if (selectedCategoryFilters.length > 0) {
			result = result.filter(exp => selectedCategoryFilters.includes(exp.categoryId));
		}
		
		// Apply payment method filter
		if (selectedPaymentMethods.length > 0) {
			result = result.filter(exp => {
				const method = exp.paymentMethod || 'other';
				return selectedPaymentMethods.includes(method);
			});
		}
		
		// Apply amount range filter
		const minAmount = parseFloat(amountMin);
		const maxAmount = parseFloat(amountMax);
		if (!isNaN(minAmount)) {
			result = result.filter(exp => exp.amount >= minAmount);
		}
		if (!isNaN(maxAmount)) {
			result = result.filter(exp => exp.amount <= maxAmount);
		}
		
		// Apply sort
		const [field, direction] = sortBy.split('-') as ['date' | 'amount' | 'description', 'asc' | 'desc'];
		result = sortExpenses(result, field, direction);
		
		return result;
	});
	
	// Calculate totals for filtered results
	let filteredTotal = $derived(filteredExpenses().reduce((sum, e) => sum + e.amount, 0));
	
	// Check if all filtered expenses are selected
	let allSelected = $derived(() => {
		const filtered = filteredExpenses();
		return filtered.length > 0 && filtered.every(e => selectedExpenseIds.has(e.id));
	});
	
	// Number of selected items
	let selectedCount = $derived(selectedExpenseIds.size);
	
	// Count active filters
	let activeFilterCount = $derived(() => {
		let count = 0;
		if (selectedCategoryFilters.length > 0) count++;
		if (selectedPaymentMethods.length > 0) count++;
		if (dateFrom || dateTo) count++;
		if (amountMin || amountMax) count++;
		if (quickFilter !== 'all') count++;
		return count;
	});
	
	// Check if any filters are active
	let hasActiveFilters = $derived(
		searchQuery.trim() !== '' || 
		activeFilterCount() > 0 || 
		sortBy !== 'date-desc'
	);

	function getCategoryInfo(categoryId: string) {
		const cat = $categories.find(c => c.id === categoryId);
		return cat || { name: 'Unknown', icon: '📋', color: '#64748B' };
	}

	async function handleDelete(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (confirm('Are you sure you want to delete this expense?')) {
			await expenseActions.delete(id);
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
	
	function togglePaymentMethod(method: PaymentMethod) {
		if (selectedPaymentMethods.includes(method)) {
			selectedPaymentMethods = selectedPaymentMethods.filter(m => m !== method);
		} else {
			selectedPaymentMethods = [...selectedPaymentMethods, method];
		}
	}

	function clearFilters() {
		searchQuery = '';
		selectedCategoryFilters = [];
		selectedPaymentMethods = [];
		dateFrom = '';
		dateTo = '';
		amountMin = '';
		amountMax = '';
		quickFilter = 'all';
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
			filtered.forEach(e => selectedExpenseIds.delete(e.id));
		} else {
			filtered.forEach(e => selectedExpenseIds.add(e.id));
		}
		selectedExpenseIds = new Set(selectedExpenseIds);
	}
	
	function clearSelection() {
		selectedExpenseIds = new Set();
	}
	
	// Bulk actions
	function handleBulkDelete() {
		expenseActions.deleteMany([...selectedExpenseIds]);
		selectedExpenseIds = new Set();
		showBulkDeleteModal = false;
	}
	
	async function handleBulkCategoryChange() {
		if (!bulkCategoryId) return;
		
		for (const id of selectedExpenseIds) {
			await expenseActions.update(id, { categoryId: bulkCategoryId });
		}
		
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
	<title>Expenses | SpendWise</title>
	<meta name="description" content="View and manage all your expenses." />
</svelte:head>

{#snippet expensesContent()}
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
						Change Category
					</button>
					<button class="em-btn em-btn-danger" onclick={() => showBulkDeleteModal = true}>
						Delete Selected
					</button>
				</div>
			</div>
		{:else}
			<!-- Quick Filters -->
			<div class="quick-filters">
				<button 
					class="quick-filter-btn" 
					class:active={quickFilter === 'all' && !dateFrom && !dateTo}
					onclick={() => applyQuickFilter('all')}
				>All</button>
				<button 
					class="quick-filter-btn" 
					class:active={quickFilter === 'today'}
					onclick={() => applyQuickFilter('today')}
				>Today</button>
				<button 
					class="quick-filter-btn" 
					class:active={quickFilter === 'week'}
					onclick={() => applyQuickFilter('week')}
				>This Week</button>
				<button 
					class="quick-filter-btn" 
					class:active={quickFilter === 'month'}
					onclick={() => applyQuickFilter('month')}
				>This Month</button>
				<button 
					class="quick-filter-btn" 
					class:active={quickFilter === 'year'}
					onclick={() => applyQuickFilter('year')}
				>This Year</button>
			</div>
		
			<!-- Search and Filter Bar -->
			<div class="toolbar">
				<div class="search-box">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					<input 
						type="text" 
						placeholder="Search description, merchant, notes, tags..." 
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
					class:active={showFilters || activeFilterCount() > 0}
					onclick={() => showFilters = !showFilters}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
					</svg>
					Filters
					{#if activeFilterCount() > 0}
						<span class="filter-count">{activeFilterCount()}</span>
					{/if}
				</button>

				<a href={`${base}/add`} class="add-btn em-btn em-btn-primary">
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
					<h3 class="filter-title">Advanced Filters</h3>
					{#if hasActiveFilters}
						<button class="clear-filters-btn" onclick={clearFilters}>
							Clear All
						</button>
					{/if}
				</div>

				<div class="filter-content">
					<div class="filter-row">
						<!-- Date Range -->
						<div class="filter-group">
							<label class="filter-label" for="date-from">Date Range</label>
							<div class="date-range">
								<input 
									id="date-from"
									type="date" 
									class="em-input date-input"
									bind:value={dateFrom}
									onchange={() => quickFilter = 'all'}
									max={dateTo || undefined}
									aria-label="Date from"
								/>
								<span class="date-separator" aria-hidden="true">to</span>
								<input 
									id="date-to"
									type="date" 
									class="em-input date-input"
									bind:value={dateTo}
									onchange={() => quickFilter = 'all'}
									min={dateFrom || undefined}
									aria-label="Date to"
								/>
							</div>
						</div>

						<!-- Amount Range -->
						<div class="filter-group">
							<label class="filter-label" for="amount-min">Amount Range</label>
							<div class="amount-range">
								<div class="amount-input-wrapper">
									<span class="currency-prefix" aria-hidden="true">{$preferences.currency}</span>
									<input 
										id="amount-min"
										type="number" 
										class="em-input amount-input"
										placeholder="Min"
										step="0.01"
										min="0"
										bind:value={amountMin}
										aria-label="Minimum amount"
									/>
								</div>
								<span class="range-separator" aria-hidden="true">–</span>
								<div class="amount-input-wrapper">
									<span class="currency-prefix" aria-hidden="true">{$preferences.currency}</span>
									<input 
										id="amount-max"
										type="number" 
										class="em-input amount-input"
										placeholder="Max"
										step="0.01"
										min="0"
										bind:value={amountMax}
										aria-label="Maximum amount"
									/>
								</div>
							</div>
						</div>

						<!-- Sort -->
						<div class="filter-group">
							<label class="filter-label" for="sort-by">Sort By</label>
							<select id="sort-by" class="em-input filter-select" bind:value={sortBy}>
								<option value="date-desc">Newest First</option>
								<option value="date-asc">Oldest First</option>
								<option value="amount-desc">Highest Amount</option>
								<option value="amount-asc">Lowest Amount</option>
							</select>
						</div>
					</div>

					<!-- Payment Methods -->
					<fieldset class="filter-group">
						<legend class="filter-label">Payment Method</legend>
						<div class="payment-chips">
							{#each paymentMethods as method}
								<button 
									class="payment-chip"
									class:selected={selectedPaymentMethods.includes(method.value)}
									onclick={() => togglePaymentMethod(method.value)}
									aria-pressed={selectedPaymentMethods.includes(method.value)}
								>
									<span class="chip-icon" aria-hidden="true">{method.icon}</span>
									<span class="chip-name">{method.label}</span>
								</button>
							{/each}
						</div>
					</fieldset>

					<!-- Categories -->
					<fieldset class="filter-group">
						<legend class="filter-label">Categories</legend>
						<div class="category-chips">
							{#each $categories as cat}
								<button 
									class="category-chip"
									class:selected={selectedCategoryFilters.includes(cat.id)}
									onclick={() => toggleCategoryFilter(cat.id)}
									style="--chip-color: {cat.color}"
									aria-pressed={selectedCategoryFilters.includes(cat.id)}
								>
									<span class="chip-icon" aria-hidden="true">{cat.icon}</span>
									<span class="chip-name">{cat.name}</span>
									{#if selectedCategoryFilters.includes(cat.id)}
										<svg class="chip-check" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
											<polyline points="20 6 9 17 4 12"></polyline>
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					</fieldset>
				</div>
			</div>
		{/if}

		<!-- Active Filters Summary -->
		{#if hasActiveFilters && !showFilters && selectedCount === 0}
			<div class="active-filters-bar">
				<span class="active-filters-label">Active filters:</span>
				<div class="active-filters-tags">
					{#if searchQuery.trim()}
						<span class="filter-tag">
							Search: "{searchQuery}"
							<button onclick={() => searchQuery = ''}>×</button>
						</span>
					{/if}
					{#if quickFilter !== 'all'}
						<span class="filter-tag">
							{quickFilter === 'today' ? 'Today' : quickFilter === 'week' ? 'This Week' : quickFilter === 'month' ? 'This Month' : 'This Year'}
							<button onclick={() => quickFilter = 'all'}>×</button>
						</span>
					{/if}
					{#if dateFrom || dateTo}
						<span class="filter-tag">
							Date: {dateFrom || '...'} to {dateTo || '...'}
							<button onclick={() => { dateFrom = ''; dateTo = ''; }}>×</button>
						</span>
					{/if}
					{#if amountMin || amountMax}
						<span class="filter-tag">
							Amount: {amountMin || '0'} - {amountMax || '∞'}
							<button onclick={() => { amountMin = ''; amountMax = ''; }}>×</button>
						</span>
					{/if}
					{#if selectedPaymentMethods.length > 0}
						<span class="filter-tag">
							{selectedPaymentMethods.length} payment method{selectedPaymentMethods.length > 1 ? 's' : ''}
							<button onclick={() => selectedPaymentMethods = []}>×</button>
						</span>
					{/if}
					{#if selectedCategoryFilters.length > 0}
						<span class="filter-tag">
							{selectedCategoryFilters.length} categor{selectedCategoryFilters.length > 1 ? 'ies' : 'y'}
							<button onclick={() => selectedCategoryFilters = []}>×</button>
						</span>
					{/if}
				</div>
				<button class="clear-all-btn" onclick={clearFilters}>Clear all</button>
			</div>
		{/if}

		<!-- Results Summary -->
		{#if filteredExpenses().length > 0}
			<div class="results-summary">
				<span class="results-count">{filteredExpenses().length} expense{filteredExpenses().length !== 1 ? 's' : ''}</span>
				<span class="results-total">Total: {formatCurrency(filteredTotal, $preferences.currency)}</span>
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
					actionHref={`${base}/add`}
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
					<a 
						href={`${base}/expenses/${expense.id}`} 
						class="list-row" 
						class:selected={isSelected}
						data-sveltekit-preload-data="off"
						data-sveltekit-noscroll
					>
						<div class="cell checkbox">
							<label class="checkbox-label">
								<input 
									type="checkbox" 
									class="row-checkbox"
									checked={isSelected}
									onclick={(e) => e.stopPropagation()}
									onchange={(e) => toggleSelection(expense.id, e)}
									aria-label={`Select expense: ${expense.description}`}
								/>
								<span class="sr-only">Select expense</span>
							</label>
						</div>
						<div class="cell description">
							<span class="expense-icon">{category.icon}</span>
							<div class="expense-info">
								<span class="expense-name">{expense.description}</span>
								{#if expense.merchant}
									<span class="expense-merchant">{expense.merchant}</span>
								{/if}
							</div>
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
								onclick={(e) => { 
									e.preventDefault(); 
									e.stopPropagation();
									// Use window.location for more reliable navigation on static sites
									// This avoids SvelteKit's __data.json fetch issues
									setTimeout(() => {
										window.location.href = `${base}/expenses/${expense.id}?edit=true`;
									}, 0);
								}}
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
			{/if}
		</div>
	</div>
</div>
{/snippet}

{#if $authLoading}
	<div class="expenses-page">
		<div class="container mx-auto px-4">
			<PageHeader title="Expenses" subtitle="Loading..." />
		</div>
	</div>
{:else if !$isAuthenticated}
	<DemoPreview
		title="Expenses"
		description="View, search, and manage your expenses. Filter by category, date, payment method, and more. Track your spending easily."
	>
		{#snippet previewContent()}
			{@render expensesContent()}
		{/snippet}
	</DemoPreview>
{:else}
	{@render expensesContent()}
{/if}

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

	/* Quick Filters */
	.quick-filters {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}

	.quick-filter-btn {
		padding: 0.5rem 1rem;
		background-color: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-full);
		color: var(--em-text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.quick-filter-btn:hover {
		background-color: var(--em-surface-hover);
		color: var(--em-text-primary);
	}

	.quick-filter-btn.active {
		background-color: var(--em-primary);
		border-color: var(--em-primary);
		color: white;
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

	.search-input::placeholder {
		color: var(--em-text-muted);
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
	}

	.filter-toggle:hover,
	.filter-toggle.active {
		background-color: var(--em-surface-hover);
		color: var(--em-text-primary);
		border-color: var(--em-primary);
	}

	.filter-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		background-color: var(--em-primary);
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: var(--em-radius-full);
		padding: 0 0.375rem;
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
		padding: 1.25rem;
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.filter-title {
		font-size: 1rem;
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

	.filter-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.filter-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.25rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: none;
		padding: 0;
		margin: 0;
	}

	.filter-group legend,
	.filter-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--em-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
		padding: 0;
	}

	.filter-select {
		max-width: 200px;
	}

	.date-range {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.date-input {
		flex: 1;
		min-width: 0;
	}

	.date-separator {
		color: var(--em-text-muted);
		font-size: 0.875rem;
	}

	.amount-range {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.amount-input-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		background-color: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
		overflow: hidden;
	}

	.currency-prefix {
		padding: 0 0.5rem 0 0.75rem;
		color: var(--em-text-muted);
		font-size: 0.875rem;
	}

	.amount-input {
		flex: 1;
		border: none !important;
		min-width: 60px;
	}

	.range-separator {
		color: var(--em-text-muted);
	}

	/* Payment Chips */
	.payment-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.payment-chip {
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

	.payment-chip:hover {
		background-color: var(--em-bg-hover);
	}

	.payment-chip.selected {
		background-color: var(--em-primary);
		border-color: var(--em-primary);
		color: white;
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

	/* Active Filters Bar */
	.active-filters-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background-color: var(--em-surface);
		border-radius: var(--em-radius-md);
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.active-filters-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--em-text-muted);
		text-transform: uppercase;
	}

	.active-filters-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		flex: 1;
	}

	.filter-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem 0.25rem 0.75rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-full);
		font-size: 0.75rem;
		color: var(--em-text-primary);
	}

	.filter-tag button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		background: transparent;
		border: none;
		color: var(--em-text-muted);
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
	}

	.filter-tag button:hover {
		color: var(--em-expense);
	}

	.clear-all-btn {
		background: transparent;
		border: none;
		color: var(--em-primary);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
	}

	/* Results Summary */
	.results-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		margin-bottom: 0.5rem;
	}

	.results-count {
		font-size: 0.875rem;
		color: var(--em-text-secondary);
	}

	.results-total {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--em-text-primary);
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

	.checkbox-label {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.row-checkbox {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: var(--em-primary);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
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
		flex-shrink: 0;
	}

	.expense-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.expense-name {
		font-weight: 500;
		color: var(--em-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.expense-merchant {
		font-size: 0.75rem;
		color: var(--em-text-muted);
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

		.filter-row {
			grid-template-columns: 1fr;
		}

		.date-range,
		.amount-range {
			flex-direction: column;
		}

		.date-separator,
		.range-separator {
			display: none;
		}
	}
</style>
