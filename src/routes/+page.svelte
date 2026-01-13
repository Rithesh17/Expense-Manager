<script lang="ts">
	import { PageHeader, StatCard, EmptyState, QuickAddExpense, DonutChart, BarChart, SparkLine } from '$lib/components';
	import { 
		expenses, 
		todayExpenses, 
		weekExpenses, 
		monthExpenses,
		todayStats,
		weekStats,
		monthStats,
		categories,
		overallBudgetProgress,
		categoryBudgetProgress
	} from '$lib/stores';
	import { 
		formatCurrency, 
		formatRelativeDate, 
		calculateCategoryStats, 
		getDailySpending,
		getSpendingTrend,
		getBiggestExpense,
		getMostFrequentCategory
	} from '$lib/utils';
	import { preferences } from '$lib/stores/preferences';
	
	// Quick add modal state
	let showQuickAdd = $state(false);
	
	// Date range state
	let selectedPeriod = $state<'week' | 'month' | 'year'>('month');

	// Get recent expenses (last 5)
	let recentExpenses = $derived($expenses.slice(0, 5));
	
	// Get category stats for the selected period
	let periodExpenses = $derived(() => {
		switch (selectedPeriod) {
			case 'week': return $weekExpenses;
			case 'year': 
				const yearStart = new Date(new Date().getFullYear(), 0, 1);
				return $expenses.filter(e => new Date(e.date) >= yearStart);
			default: return $monthExpenses;
		}
	});
	
	let categoryStats = $derived(calculateCategoryStats(periodExpenses(), $categories));
	
	// Get top 5 categories for donut chart
	let topCategories = $derived(categoryStats.slice(0, 5));
	
	// Donut chart data
	let donutData = $derived(topCategories.map(cat => ({
		label: cat.categoryName,
		value: cat.total,
		color: cat.color
	})));
	
	// Daily spending for bar chart (last 7 days)
	let dailySpending = $derived(getDailySpending($expenses, 7));
	
	// Spending trend for sparkline (last 14 days)
	let spendingTrend = $derived(getSpendingTrend($expenses, 14));
	
	// Quick stats
	let biggestExpense = $derived(getBiggestExpense(periodExpenses()));
	let mostFrequentCategoryId = $derived(getMostFrequentCategory(periodExpenses()));
	let mostFrequentCategory = $derived(
		mostFrequentCategoryId ? $categories.find(c => c.id === mostFrequentCategoryId) : null
	);
	let averageExpense = $derived(() => {
		const exp = periodExpenses();
		return exp.length > 0 ? exp.reduce((sum, e) => sum + e.amount, 0) / exp.length : 0;
	});
	
	// Budget progress
	let budgetRemaining = $derived(() => {
		if ($overallBudgetProgress) {
			return $overallBudgetProgress.remaining;
		}
		return 0;
	});
	
	let budgetPercentageUsed = $derived(() => {
		if ($overallBudgetProgress) {
			return $overallBudgetProgress.percentage;
		}
		return 0;
	});
	
	let budgetStatus = $derived(() => {
		if ($overallBudgetProgress) {
			return $overallBudgetProgress.status;
		}
		return 'safe';
	});

	// Get category info for an expense
	function getCategoryInfo(categoryId: string) {
		const cat = $categories.find(c => c.id === categoryId);
		return cat || { name: 'Unknown', icon: '📋', color: '#64748B' };
	}
	
	// Period label
	let periodLabel = $derived(() => {
		switch (selectedPeriod) {
			case 'week': return 'This Week';
			case 'year': return 'This Year';
			default: return 'This Month';
		}
	});
	
	// Period total
	let periodTotal = $derived(() => {
		const exp = periodExpenses();
		return exp.reduce((sum, e) => sum + e.amount, 0);
	});
</script>

<svelte:head>
	<title>Dashboard | Expense Manager</title>
	<meta name="description" content="Track your expenses and manage your budget with Expense Manager." />
</svelte:head>

<div class="dashboard">
	<div class="container mx-auto px-4">
		<PageHeader 
			title="Dashboard" 
			subtitle="Track your spending at a glance"
		/>

		<!-- Period Selector -->
		<div class="period-selector">
			<button 
				class="period-btn" 
				class:active={selectedPeriod === 'week'}
				onclick={() => selectedPeriod = 'week'}
			>
				Week
			</button>
			<button 
				class="period-btn" 
				class:active={selectedPeriod === 'month'}
				onclick={() => selectedPeriod = 'month'}
			>
				Month
			</button>
			<button 
				class="period-btn" 
				class:active={selectedPeriod === 'year'}
				onclick={() => selectedPeriod = 'year'}
			>
				Year
			</button>
		</div>

		<!-- Stats Grid -->
		<section class="stats-grid">
			<StatCard 
				title="Today" 
				value={formatCurrency($todayStats.total, $preferences.currency)}
				subtitle="{$todayStats.count} expense{$todayStats.count !== 1 ? 's' : ''}"
				color="expense"
			/>
			<StatCard 
				title={periodLabel()}
				value={formatCurrency(periodTotal(), $preferences.currency)}
				subtitle="{periodExpenses().length} expense{periodExpenses().length !== 1 ? 's' : ''}"
			/>
			<StatCard 
				title="Average" 
				value={formatCurrency(averageExpense(), $preferences.currency)}
				subtitle="per expense"
			/>
			<StatCard 
				title="Budget Used" 
				value="{Math.round(budgetPercentageUsed())}%"
				subtitle={formatCurrency(budgetRemaining(), $preferences.currency) + ' left'}
				color={budgetStatus() === 'danger' ? 'expense' : budgetStatus() === 'warning' ? 'warning' : 'income'}
			/>
		</section>

		<!-- Charts Row -->
		<section class="charts-row">
			<!-- Category Breakdown -->
			<div class="chart-card em-card">
				<div class="section-header">
					<h2 class="section-title">Spending by Category</h2>
				</div>
				<div class="chart-content">
					{#if donutData.length === 0}
						<EmptyState
							title="No data"
							message="Add expenses to see breakdown"
							icon="📊"
						/>
					{:else}
						<DonutChart 
							data={donutData}
							size={180}
							strokeWidth={35}
							totalLabel={periodLabel()}
							formatValue={(v) => formatCurrency(v, $preferences.currency)}
						/>
					{/if}
				</div>
			</div>

			<!-- Daily Spending -->
			<div class="chart-card em-card">
				<div class="section-header">
					<h2 class="section-title">Last 7 Days</h2>
					<div class="trend-indicator">
						<SparkLine 
							data={spendingTrend}
							width={80}
							height={30}
							color="var(--em-primary)"
						/>
					</div>
				</div>
				<div class="chart-content bar-chart-content">
					<BarChart 
						data={dailySpending}
						height={160}
						barColor="var(--em-primary)"
						formatValue={(v) => v > 0 ? formatCurrency(v, $preferences.currency) : ''}
					/>
				</div>
			</div>
		</section>

		<!-- Quick Stats -->
		<section class="quick-stats">
			<div class="quick-stat em-card">
				<div class="stat-icon">💰</div>
				<div class="stat-info">
					<span class="stat-label">Biggest Expense</span>
					{#if biggestExpense}
						<span class="stat-main">{formatCurrency(biggestExpense.amount, $preferences.currency)}</span>
						<span class="stat-sub">{biggestExpense.description}</span>
					{:else}
						<span class="stat-main">—</span>
					{/if}
				</div>
			</div>
			<div class="quick-stat em-card">
				<div class="stat-icon">{mostFrequentCategory?.icon || '📋'}</div>
				<div class="stat-info">
					<span class="stat-label">Top Category</span>
					{#if mostFrequentCategory}
						<span class="stat-main">{mostFrequentCategory.name}</span>
						<span class="stat-sub">{categoryStats.find(c => c.categoryId === mostFrequentCategoryId)?.count || 0} expenses</span>
					{:else}
						<span class="stat-main">—</span>
					{/if}
				</div>
			</div>
			<div class="quick-stat em-card">
				<div class="stat-icon">📈</div>
				<div class="stat-info">
					<span class="stat-label">Daily Average</span>
					<span class="stat-main">
						{formatCurrency(
							dailySpending.reduce((sum, d) => sum + d.value, 0) / 7, 
							$preferences.currency
						)}
					</span>
					<span class="stat-sub">last 7 days</span>
				</div>
			</div>
		</section>

		<!-- Budget Progress (if budgets exist) -->
		{#if $categoryBudgetProgress && $categoryBudgetProgress.length > 0}
			<section class="budget-section em-card">
				<div class="section-header">
					<h2 class="section-title">Budget Progress</h2>
					<a href="/budgets" class="view-all">Manage →</a>
				</div>
				<div class="budget-list">
					{#each $categoryBudgetProgress.slice(0, 4) as progress}
						{@const category = $categories.find(c => c.id === progress.budget.categoryId)}
						<div class="budget-item">
							<div class="budget-header">
								<span class="budget-icon">{category?.icon || '📋'}</span>
								<span class="budget-name">{category?.name || 'Unknown'}</span>
								<span class="budget-amounts">
									{formatCurrency(progress.spent, $preferences.currency)} / {formatCurrency(progress.budget.amount, $preferences.currency)}
								</span>
							</div>
							<div class="budget-bar">
								<div 
									class="budget-fill {progress.status}"
									style="width: {progress.percentage}%;"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Main Content Grid -->
		<div class="content-grid">
			<!-- Recent Expenses -->
			<section class="recent-expenses em-card">
				<div class="section-header">
					<h2 class="section-title">Recent Expenses</h2>
					<a href="/expenses" class="view-all">View All →</a>
				</div>
				
				{#if recentExpenses.length === 0}
					<EmptyState
						title="No expenses yet"
						message="Start tracking by adding your first expense"
						icon="💸"
						actionLabel="Add Expense"
						actionHref="/add"
					/>
				{:else}
					<div class="expense-list">
						{#each recentExpenses as expense}
							{@const category = getCategoryInfo(expense.categoryId)}
							<a href="/expenses/{expense.id}" class="expense-item">
								<div class="expense-icon">{category.icon}</div>
								<div class="expense-details">
									<span class="expense-description">{expense.description}</span>
									<span class="expense-meta">{category.name} • {formatRelativeDate(expense.date)}</span>
								</div>
								<div class="expense-amount amount-negative">
									-{formatCurrency(expense.amount, $preferences.currency)}
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Top Categories List -->
			<section class="top-categories em-card">
				<div class="section-header">
					<h2 class="section-title">Top Categories</h2>
					<a href="/categories" class="view-all">Manage →</a>
				</div>

				{#if topCategories.length === 0}
					<EmptyState
						title="No spending data"
						message="Add expenses to see category breakdown"
						icon="📊"
					/>
				{:else}
					<div class="category-list">
						{#each topCategories as category}
							<div class="category-item">
								<div class="category-info">
									<span class="category-icon-small">{$categories.find(c => c.id === category.categoryId)?.icon || '📋'}</span>
									<span class="category-name">{category.categoryName}</span>
									<span class="category-amount">{formatCurrency(category.total, $preferences.currency)}</span>
								</div>
								<div class="category-bar">
									<div 
										class="category-progress" 
										style="width: {category.percentage}%; background-color: {category.color};"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</div>

		<!-- Quick Add Button (Desktop) -->
		<button class="quick-add-fab" aria-label="Add new expense" onclick={() => showQuickAdd = true}>
			<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
		</button>
	</div>
</div>

<!-- Quick Add Expense Modal -->
<QuickAddExpense 
	open={showQuickAdd} 
	onclose={() => showQuickAdd = false}
/>

<style>
	.dashboard {
		padding-bottom: 2rem;
	}

	/* Period Selector */
	.period-selector {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.period-btn {
		padding: 0.5rem 1rem;
		background-color: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
		color: var(--em-text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.period-btn:hover {
		background-color: var(--em-surface-hover);
		color: var(--em-text-primary);
	}

	.period-btn.active {
		background-color: var(--em-primary);
		border-color: var(--em-primary);
		color: white;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	/* Charts Row */
	.charts-row {
		display: grid;
		grid-template-columns: 1fr 1.5fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 900px) {
		.charts-row {
			grid-template-columns: 1fr;
		}
	}

	.chart-card {
		padding: 0;
		overflow: hidden;
	}

	.chart-content {
		padding: 1.5rem;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
	}

	.bar-chart-content {
		padding: 1rem 1.5rem 1.5rem;
	}

	.trend-indicator {
		display: flex;
		align-items: center;
	}

	/* Quick Stats */
	.quick-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 768px) {
		.quick-stats {
			grid-template-columns: 1fr;
		}
	}

	.quick-stat {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
	}

	.stat-icon {
		font-size: 1.75rem;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-main {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--em-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.stat-sub {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Budget Section */
	.budget-section {
		margin-bottom: 1.5rem;
		padding: 0;
	}

	.budget-list {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.budget-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.budget-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.budget-icon {
		font-size: 1rem;
	}

	.budget-name {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--em-text-primary);
	}

	.budget-amounts {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.budget-bar {
		width: 100%;
		height: 6px;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-full);
		overflow: hidden;
	}

	.budget-fill {
		height: 100%;
		border-radius: var(--em-radius-full);
		transition: width 0.5s ease-out;
	}

	.budget-fill.safe {
		background-color: var(--em-income);
	}

	.budget-fill.warning {
		background-color: var(--em-warning);
	}

	.budget-fill.danger {
		background-color: var(--em-expense);
	}

	/* Content Grid */
	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 900px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--em-border);
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--em-text-primary);
		margin: 0;
	}

	.view-all {
		font-size: 0.875rem;
		color: var(--em-primary);
		text-decoration: none;
		font-weight: 500;
	}

	.view-all:hover {
		color: var(--em-primary-light);
	}

	/* Expense List Styles */
	.expense-list {
		padding: 0.5rem 0;
	}

	.expense-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		transition: background-color var(--em-transition-fast);
		text-decoration: none;
		color: inherit;
	}

	.expense-item:hover {
		background-color: var(--em-bg-hover);
	}

	.expense-icon {
		font-size: 1.5rem;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
	}

	.expense-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.expense-description {
		font-weight: 500;
		color: var(--em-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.expense-meta {
		font-size: 0.75rem;
		color: var(--em-text-muted);
	}

	.expense-amount {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	/* Category List Styles */
	.category-list {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.category-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.category-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.category-icon-small {
		font-size: 1rem;
	}

	.category-name {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--em-text-primary);
	}

	.category-amount {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--em-text-secondary);
		font-variant-numeric: tabular-nums;
	}

	.category-bar {
		width: 100%;
		height: 6px;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-full);
		overflow: hidden;
	}

	.category-progress {
		height: 100%;
		border-radius: var(--em-radius-full);
		transition: width 0.5s ease-out;
	}

	/* Quick Add FAB */
	.quick-add-fab {
		display: none;
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 56px;
		height: 56px;
		background-color: var(--em-primary);
		color: white;
		border: none;
		border-radius: 50%;
		align-items: center;
		justify-content: center;
		box-shadow: var(--em-shadow-lg);
		cursor: pointer;
		transition: all var(--em-transition-fast);
		z-index: 50;
	}

	.quick-add-fab:hover {
		background-color: var(--em-primary-hover);
		transform: scale(1.05);
	}

	@media (min-width: 769px) {
		.quick-add-fab {
			display: flex;
		}
	}
</style>
