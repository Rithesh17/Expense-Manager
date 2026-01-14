<script lang="ts">
	import { PageHeader, EmptyState, Modal, DemoPreview } from '$lib/components';
	import { 
		budgets, 
		budgetActions, 
		overallBudget,
		categoryBudgets,
		budgetProgress,
		overallBudgetProgress,
		categoryBudgetProgress,
		budgetAlerts
	} from '$lib/stores/budgets';
	import { categories } from '$lib/stores/categories';
	import { preferences } from '$lib/stores/preferences';
	import { isAuthenticated, authLoading } from '$lib/stores';
	import { formatCurrency } from '$lib/utils';
	import type { Budget, BudgetPeriod } from '$lib/types';

	// Modal states
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let showOverallModal = $state(false);

	// Form state for adding/editing
	let editingBudget = $state<Budget | null>(null);
	let formCategoryId = $state<string>('');
	let formAmount = $state('');
	let formPeriod = $state<BudgetPeriod>('monthly');
	let formError = $state('');

	// Delete state
	let deletingBudget = $state<Budget | null>(null);

	// Overall budget form state
	let overallAmount = $state('');
	let overallPeriod = $state<BudgetPeriod>('monthly');

	// Get category info
	function getCategoryInfo(categoryId: string | null) {
		if (!categoryId) return { name: 'Overall', icon: '💰', color: '#6366F1' };
		const cat = $categories.find(c => c.id === categoryId);
		return cat || { name: 'Unknown', icon: '📋', color: '#64748B' };
	}

	// Get budget progress for a budget
	function getProgress(budgetId: string) {
		return $budgetProgress.find(p => p.budget.id === budgetId);
	}

	// Categories without budgets (for add form)
	let availableCategories = $derived(
		$categories.filter(cat => !$categoryBudgets.some(b => b.categoryId === cat.id))
	);

	// Reset form
	function resetForm() {
		formCategoryId = '';
		formAmount = '';
		formPeriod = 'monthly';
		formError = '';
		editingBudget = null;
	}

	// Open add modal
	function openAddModal() {
		resetForm();
		if (availableCategories.length > 0) {
			formCategoryId = availableCategories[0].id;
		}
		showAddModal = true;
	}

	// Open edit modal
	function openEditModal(budget: Budget) {
		editingBudget = budget;
		formCategoryId = budget.categoryId || '';
		formAmount = budget.amount.toString();
		formPeriod = budget.period;
		formError = '';
		showEditModal = true;
	}

	// Open delete modal
	function openDeleteModal(budget: Budget) {
		deletingBudget = budget;
		showDeleteModal = true;
	}

	// Open overall budget modal
	function openOverallModal() {
		if ($overallBudget) {
			overallAmount = $overallBudget.amount.toString();
			overallPeriod = $overallBudget.period;
		} else {
			overallAmount = '';
			overallPeriod = 'monthly';
		}
		showOverallModal = true;
	}

	// Handle add budget
	async function handleAddBudget() {
		const amount = parseFloat(formAmount);
		if (isNaN(amount) || amount <= 0) {
			formError = 'Please enter a valid amount';
			return;
		}

		if (!formCategoryId) {
			formError = 'Please select a category';
			return;
		}

		await budgetActions.add({
			categoryId: formCategoryId,
			amount,
			period: formPeriod
		});

		showAddModal = false;
		resetForm();
	}

	// Handle edit budget
	async function handleEditBudget() {
		if (!editingBudget) return;

		const amount = parseFloat(formAmount);
		if (isNaN(amount) || amount <= 0) {
			formError = 'Please enter a valid amount';
			return;
		}

		await budgetActions.update(editingBudget.id, {
			amount,
			period: formPeriod
		});

		showEditModal = false;
		resetForm();
	}

	// Handle delete budget
	async function handleDeleteBudget() {
		if (!deletingBudget) return;
		await budgetActions.delete(deletingBudget.id);
		showDeleteModal = false;
		deletingBudget = null;
	}

	// Handle overall budget save
	async function handleSaveOverallBudget() {
		const amount = parseFloat(overallAmount);
		if (isNaN(amount) || amount <= 0) {
			return;
		}

		if ($overallBudget) {
			await budgetActions.update($overallBudget.id, {
				amount,
				period: overallPeriod
			});
		} else {
			await budgetActions.add({
				categoryId: null,
				amount,
				period: overallPeriod
			});
		}

		showOverallModal = false;
	}

	// Handle delete overall budget
	async function handleDeleteOverallBudget() {
		if ($overallBudget) {
			await budgetActions.delete($overallBudget.id);
		}
		showOverallModal = false;
	}

	// Period labels
	const periodLabels: Record<BudgetPeriod, string> = {
		daily: 'Daily',
		weekly: 'Weekly',
		monthly: 'Monthly',
		yearly: 'Yearly'
	};
</script>

<svelte:head>
	<title>Budgets | SpendWise</title>
	<meta name="description" content="Set and track your spending budgets." />
</svelte:head>

{#snippet budgetsContent()}
<div class="budgets-page">
	<div class="container mx-auto px-4">
		<PageHeader 
			title="Budgets" 
			subtitle="Set limits and track your spending"
		/>

		<!-- Budget Alerts -->
		{#if $budgetAlerts.length > 0}
			<section class="alerts-section">
				{#each $budgetAlerts as alert}
					{@const category = getCategoryInfo(alert.budget.categoryId)}
					<div class="alert-card {alert.status}">
						<span class="alert-icon">{alert.status === 'danger' ? '🚨' : '⚠️'}</span>
						<div class="alert-content">
							<strong>{category.name}</strong>
							{#if alert.status === 'danger'}
								is over budget by {formatCurrency(Math.abs(alert.remaining), $preferences.currency)}
							{:else}
								is at {Math.round(alert.percentage)}% - only {formatCurrency(alert.remaining, $preferences.currency)} left
							{/if}
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Overall Budget Card -->
		<section class="overall-budget em-card">
			{#if $overallBudget && $overallBudgetProgress}
				{@const progress = $overallBudgetProgress}
				<div class="overall-header">
					<div class="overall-info">
						<span class="overall-icon">💰</span>
						<div>
							<h2 class="overall-title">Overall Budget</h2>
							<p class="overall-period">{periodLabels[progress.budget.period]}</p>
						</div>
					</div>
					<button class="em-btn em-btn-ghost" onclick={openOverallModal}>Edit</button>
				</div>

				<div class="overall-stats">
					<div class="stat-box">
						<span class="stat-label">Budget</span>
						<span class="stat-amount">{formatCurrency(progress.budget.amount, $preferences.currency)}</span>
					</div>
					<div class="stat-box">
						<span class="stat-label">Spent</span>
						<span class="stat-amount amount-negative">{formatCurrency(progress.spent, $preferences.currency)}</span>
					</div>
					<div class="stat-box">
						<span class="stat-label">Remaining</span>
						<span class="stat-amount {progress.remaining >= 0 ? 'amount-positive' : 'amount-negative'}">
							{formatCurrency(Math.abs(progress.remaining), $preferences.currency)}
							{#if progress.remaining < 0}
								<span class="over-label">over</span>
							{/if}
						</span>
					</div>
				</div>

				<div class="overall-progress">
					<div class="progress-bar-large">
						<div 
							class="progress-fill {progress.status}"
							style="width: {Math.min(progress.percentage, 100)}%;"
						></div>
					</div>
					<div class="progress-labels">
						<span class="{progress.status}">{Math.round(progress.percentage)}% used</span>
						<span>{Math.max(0, Math.round(100 - progress.percentage))}% left</span>
					</div>
				</div>
			{:else}
				<div class="no-overall">
					<span class="no-overall-icon">💰</span>
					<div class="no-overall-text">
						<h3>No Overall Budget Set</h3>
						<p>Set a total spending limit to track your overall spending</p>
					</div>
					<button class="em-btn em-btn-primary" onclick={openOverallModal}>
						Set Overall Budget
					</button>
				</div>
			{/if}
		</section>

		<!-- Category Budgets -->
		<section class="category-budgets">
			<div class="section-header">
				<h2 class="section-title">Category Budgets</h2>
				{#if availableCategories.length > 0}
					<button class="em-btn em-btn-primary" onclick={openAddModal}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						Add Budget
					</button>
				{/if}
			</div>

			{#if $categoryBudgetProgress.length === 0}
				<div class="em-card">
					<EmptyState
						title="No category budgets"
						message="Set budgets for individual categories to track spending"
						icon="📊"
						actionLabel="Add Budget"
						onaction={availableCategories.length > 0 ? openAddModal : undefined}
					/>
				</div>
			{:else}
				<div class="budgets-grid">
					{#each $categoryBudgetProgress as progress}
						{@const category = getCategoryInfo(progress.budget.categoryId)}
						<div class="budget-card em-card">
							<div class="budget-header">
								<span class="budget-icon" style="background-color: {category.color}20; color: {category.color};">
									{category.icon}
								</span>
								<div class="budget-info">
									<h3 class="budget-name">{category.name}</h3>
									<span class="budget-period">{periodLabels[progress.budget.period]}</span>
								</div>
								<div class="budget-status {progress.status}">
									{#if progress.status === 'danger'}
										Over budget!
									{:else if progress.status === 'warning'}
										Almost there
									{:else}
										On track
									{/if}
								</div>
							</div>

							<div class="budget-amounts">
								<div class="amount-spent">
									<span class="amount-label">Spent</span>
									<span class="amount-value">{formatCurrency(progress.spent, $preferences.currency)}</span>
								</div>
								<div class="amount-divider">/</div>
								<div class="amount-total">
									<span class="amount-label">Budget</span>
									<span class="amount-value">{formatCurrency(progress.budget.amount, $preferences.currency)}</span>
								</div>
							</div>

							<div class="budget-progress">
								<div class="progress-bar">
									<div 
										class="progress-fill {progress.status}"
										style="width: {Math.min(progress.percentage, 100)}%;"
									></div>
								</div>
								<div class="progress-footer">
									<span class="remaining-text">
										{#if progress.remaining >= 0}
											{formatCurrency(progress.remaining, $preferences.currency)} remaining
										{:else}
											{formatCurrency(Math.abs(progress.remaining), $preferences.currency)} over
										{/if}
									</span>
									<div class="budget-actions">
										<button 
											class="action-btn" 
											title="Edit"
											onclick={() => openEditModal(progress.budget)}
										>
											✏️
										</button>
										<button 
											class="action-btn" 
											title="Delete"
											onclick={() => openDeleteModal(progress.budget)}
										>
											🗑️
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if availableCategories.length === 0 && $categoryBudgetProgress.length > 0}
				<p class="all-budgeted-notice">
					✓ All categories have budgets set
				</p>
			{/if}
		</section>
	</div>
</div>
{/snippet}

{#if $authLoading}
	<div class="budgets-page">
		<div class="container mx-auto px-4">
			<PageHeader title="Budgets" subtitle="Loading..." />
		</div>
	</div>
{:else if !$isAuthenticated}
	<DemoPreview
		title="Budgets"
		description="Set spending limits and track your progress. Create budgets for overall spending or specific categories. Get alerts when you're approaching or exceeding your limits. Stay in control of your finances."
	>
		{#snippet previewContent()}
			{@render budgetsContent()}
		{/snippet}
	</DemoPreview>
{:else}
	{@render budgetsContent()}
{/if}

<!-- Add Budget Modal -->
{#snippet addModalContent()}
	<form class="budget-form" onsubmit={(e) => { e.preventDefault(); handleAddBudget(); }}>
		{#if formError}
			<div class="form-error">{formError}</div>
		{/if}

		<div class="form-group">
			<label class="form-label" for="add-category">Category</label>
			<select 
				id="add-category" 
				class="form-select"
				bind:value={formCategoryId}
			>
				{#each availableCategories as cat}
					<option value={cat.id}>{cat.icon} {cat.name}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label class="form-label" for="add-amount">Budget Amount</label>
			<div class="amount-input-wrapper">
				<span class="currency-symbol">{$preferences.currency}</span>
				<input 
					type="number" 
					id="add-amount" 
					class="form-input amount-input"
					placeholder="0.00"
					step="0.01"
					min="0"
					bind:value={formAmount}
				/>
			</div>
		</div>

		<div class="form-group">
			<label class="form-label" for="add-period">Period</label>
			<select 
				id="add-period" 
				class="form-select"
				bind:value={formPeriod}
			>
				<option value="weekly">Weekly</option>
				<option value="monthly">Monthly</option>
				<option value="yearly">Yearly</option>
			</select>
		</div>
	</form>
{/snippet}

{#snippet addModalFooter()}
	<button class="em-btn em-btn-ghost" onclick={() => { showAddModal = false; resetForm(); }}>
		Cancel
	</button>
	<button class="em-btn em-btn-primary" onclick={handleAddBudget}>
		Create Budget
	</button>
{/snippet}

<Modal 
	open={showAddModal} 
	title="Add Category Budget" 
	onclose={() => { showAddModal = false; resetForm(); }}
	children={addModalContent}
	footer={addModalFooter}
/>

<!-- Edit Budget Modal -->
{#snippet editModalContent()}
	{@const category = editingBudget ? getCategoryInfo(editingBudget.categoryId) : null}
	<form class="budget-form" onsubmit={(e) => { e.preventDefault(); handleEditBudget(); }}>
		{#if formError}
			<div class="form-error">{formError}</div>
		{/if}

		{#if category}
			<div class="edit-category-preview">
				<span class="preview-icon">{category.icon}</span>
				<span class="preview-name">{category.name}</span>
			</div>
		{/if}

		<div class="form-group">
			<label class="form-label" for="edit-amount">Budget Amount</label>
			<div class="amount-input-wrapper">
				<span class="currency-symbol">{$preferences.currency}</span>
				<input 
					type="number" 
					id="edit-amount" 
					class="form-input amount-input"
					placeholder="0.00"
					step="0.01"
					min="0"
					bind:value={formAmount}
				/>
			</div>
		</div>

		<div class="form-group">
			<label class="form-label" for="edit-period">Period</label>
			<select 
				id="edit-period" 
				class="form-select"
				bind:value={formPeriod}
			>
				<option value="weekly">Weekly</option>
				<option value="monthly">Monthly</option>
				<option value="yearly">Yearly</option>
			</select>
		</div>
	</form>
{/snippet}

{#snippet editModalFooter()}
	<button class="em-btn em-btn-ghost" onclick={() => { showEditModal = false; resetForm(); }}>
		Cancel
	</button>
	<button class="em-btn em-btn-primary" onclick={handleEditBudget}>
		Save Changes
	</button>
{/snippet}

<Modal 
	open={showEditModal} 
	title="Edit Budget" 
	onclose={() => { showEditModal = false; resetForm(); }}
	children={editModalContent}
	footer={editModalFooter}
/>

<!-- Delete Budget Modal -->
{#snippet deleteModalContent()}
	{@const category = deletingBudget ? getCategoryInfo(deletingBudget.categoryId) : null}
	<div class="delete-modal-content">
		<p>Are you sure you want to delete this budget?</p>
		{#if category}
			<div class="delete-budget-preview">
				<span class="preview-icon">{category.icon}</span>
				<span class="preview-name">{category.name}</span>
				<span class="preview-amount">{formatCurrency(deletingBudget?.amount || 0, $preferences.currency)}</span>
			</div>
		{/if}
		<p class="delete-warning">This will remove the budget tracking for this category. Your expenses will not be affected.</p>
	</div>
{/snippet}

{#snippet deleteModalFooter()}
	<button class="em-btn em-btn-ghost" onclick={() => { showDeleteModal = false; deletingBudget = null; }}>
		Cancel
	</button>
	<button class="em-btn em-btn-danger" onclick={handleDeleteBudget}>
		Delete Budget
	</button>
{/snippet}

<Modal 
	open={showDeleteModal} 
	title="Delete Budget" 
	onclose={() => { showDeleteModal = false; deletingBudget = null; }}
	children={deleteModalContent}
	footer={deleteModalFooter}
/>

<!-- Overall Budget Modal -->
{#snippet overallModalContent()}
	<form class="budget-form" onsubmit={(e) => { e.preventDefault(); handleSaveOverallBudget(); }}>
		<div class="form-group">
			<label class="form-label" for="overall-amount">Total Budget Amount</label>
			<div class="amount-input-wrapper">
				<span class="currency-symbol">{$preferences.currency}</span>
				<input 
					type="number" 
					id="overall-amount" 
					class="form-input amount-input"
					placeholder="0.00"
					step="0.01"
					min="0"
					bind:value={overallAmount}
				/>
			</div>
			<p class="form-hint">This is your total spending limit across all categories</p>
		</div>

		<div class="form-group">
			<label class="form-label" for="overall-period">Period</label>
			<select 
				id="overall-period" 
				class="form-select"
				bind:value={overallPeriod}
			>
				<option value="weekly">Weekly</option>
				<option value="monthly">Monthly</option>
				<option value="yearly">Yearly</option>
			</select>
		</div>
	</form>
{/snippet}

{#snippet overallModalFooter()}
	{#if $overallBudget}
		<button class="em-btn em-btn-danger-ghost" onclick={handleDeleteOverallBudget}>
			Remove
		</button>
	{/if}
	<div class="footer-spacer"></div>
	<button class="em-btn em-btn-ghost" onclick={() => showOverallModal = false}>
		Cancel
	</button>
	<button class="em-btn em-btn-primary" onclick={handleSaveOverallBudget}>
		{$overallBudget ? 'Save Changes' : 'Set Budget'}
	</button>
{/snippet}

<Modal 
	open={showOverallModal} 
	title={$overallBudget ? 'Edit Overall Budget' : 'Set Overall Budget'} 
	onclose={() => showOverallModal = false}
	children={overallModalContent}
	footer={overallModalFooter}
/>

<style>
	.budgets-page {
		padding-bottom: 2rem;
	}

	/* Alerts Section */
	.alerts-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.alert-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: var(--em-radius-lg);
		font-size: 0.875rem;
	}

	.alert-card.warning {
		background-color: var(--em-warning-bg);
		color: var(--em-warning);
	}

	.alert-card.danger {
		background-color: var(--em-expense-bg);
		color: var(--em-expense);
	}

	.alert-icon {
		font-size: 1.25rem;
	}

	.alert-content {
		flex: 1;
	}

	/* Overall Budget */
	.overall-budget {
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.overall-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.overall-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.overall-icon {
		font-size: 2.5rem;
	}

	.overall-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.overall-period {
		font-size: 0.875rem;
		color: var(--em-text-muted);
		margin: 0;
	}

	.overall-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		padding: 1.5rem 0;
		border-top: 1px solid var(--em-border);
		border-bottom: 1px solid var(--em-border);
		margin-bottom: 1.5rem;
	}

	.stat-box {
		text-align: center;
	}

	.stat-label {
		display: block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--em-text-muted);
		margin-bottom: 0.5rem;
	}

	.stat-amount {
		font-size: 1.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.over-label {
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--em-expense);
	}

	.overall-progress {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.progress-bar-large {
		width: 100%;
		height: 12px;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-full);
		overflow: hidden;
	}

	.progress-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: var(--em-text-muted);
	}

	/* No Overall Budget */
	.no-overall {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
	}

	.no-overall-icon {
		font-size: 3rem;
	}

	.no-overall-text h3 {
		margin: 0 0 0.25rem;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.no-overall-text p {
		margin: 0;
		color: var(--em-text-muted);
		font-size: 0.875rem;
	}

	/* Category Budgets */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.budgets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.budget-card {
		padding: 1.25rem;
	}

	.budget-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.budget-icon {
		font-size: 1.25rem;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--em-radius-md);
	}

	.budget-info {
		flex: 1;
	}

	.budget-name {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.budget-period {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		text-transform: capitalize;
	}

	.budget-status {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.75rem;
		border-radius: var(--em-radius-full);
	}

	.budget-status.safe {
		background-color: var(--em-income-bg);
		color: var(--em-income);
	}

	.budget-status.warning {
		background-color: var(--em-warning-bg);
		color: var(--em-warning);
	}

	.budget-status.danger {
		background-color: var(--em-expense-bg);
		color: var(--em-expense);
	}

	.budget-amounts {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.amount-spent, .amount-total {
		flex: 1;
	}

	.amount-label {
		display: block;
		font-size: 0.75rem;
		color: var(--em-text-muted);
		margin-bottom: 0.25rem;
	}

	.amount-value {
		font-size: 1.25rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.amount-divider {
		font-size: 1.5rem;
		color: var(--em-text-muted);
	}

	.budget-progress {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
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

	.progress-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.remaining-text {
		font-size: 0.875rem;
		color: var(--em-text-secondary);
	}

	.budget-actions {
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity var(--em-transition-fast);
	}

	.budget-card:hover .budget-actions {
		opacity: 1;
	}

	.action-btn {
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		border-radius: var(--em-radius-sm);
		transition: background-color var(--em-transition-fast);
	}

	.action-btn:hover {
		background-color: var(--em-bg-tertiary);
	}

	.safe { color: var(--em-income); }
	.warning { color: var(--em-warning); }
	.danger { color: var(--em-expense); }

	.all-budgeted-notice {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background-color: var(--em-income-bg);
		color: var(--em-income);
		border-radius: var(--em-radius-md);
		font-size: 0.875rem;
		text-align: center;
	}

	/* Form Styles */
	.budget-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-error {
		padding: 0.75rem 1rem;
		background-color: var(--em-expense-bg);
		color: var(--em-expense);
		border-radius: var(--em-radius-md);
		font-size: 0.875rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--em-text-primary);
	}

	.form-input,
	.form-select {
		padding: 0.75rem 1rem;
		background-color: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
		color: var(--em-text-primary);
		font-size: 1rem;
	}

	.form-input:focus,
	.form-select:focus {
		outline: none;
		border-color: var(--em-primary);
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		margin: 0;
	}

	.amount-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.currency-symbol {
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--em-text-muted);
	}

	.amount-input {
		flex: 1;
		font-size: 1.25rem;
		font-weight: 600;
	}

	/* Edit/Delete Modal Content */
	.edit-category-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
	}

	.preview-icon {
		font-size: 1.5rem;
	}

	.preview-name {
		font-weight: 600;
	}

	.delete-modal-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.delete-budget-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
	}

	.preview-amount {
		margin-left: auto;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.delete-warning {
		color: var(--em-text-muted);
		font-size: 0.875rem;
		margin: 0;
	}

	.footer-spacer {
		flex: 1;
	}

	.em-btn-danger-ghost {
		color: var(--em-expense);
		background: transparent;
	}

	.em-btn-danger-ghost:hover {
		background-color: var(--em-expense-bg);
	}

	@media (max-width: 600px) {
		.overall-stats {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.stat-box {
			display: flex;
			justify-content: space-between;
			align-items: center;
			text-align: left;
		}

		.stat-label {
			margin-bottom: 0;
		}

		.budget-actions {
			opacity: 1;
		}
	}
</style>
