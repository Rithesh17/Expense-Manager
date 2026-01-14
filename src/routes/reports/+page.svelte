<script lang="ts">
	import { PageHeader, StatCard, DonutChart, BarChart, SpendingHeatmap, EmptyState, DemoPreview } from '$lib/components';
	import { 
		expenses,
		weekExpenses, 
		monthExpenses,
		weekStats,
		monthStats,
		categories,
		isAuthenticated,
		authLoading
	} from '$lib/stores';
	import { preferences } from '$lib/stores/preferences';
	import { 
		formatCurrency, 
		calculateCategoryStats, 
		calculateStats, 
		startOfYear, 
		startOfMonth,
		startOfWeek,
		filterByDateRange,
		getMonthlySpending
	} from '$lib/utils';
	import { downloadAsCSV } from '$lib/utils/storage';

	type Period = 'week' | 'month' | 'year';
	let selectedPeriod = $state<Period>('month');
	
	// Heatmap month selector
	let heatmapMonth = $state(new Date());

	// Calculate period expenses
	let yearExpenses = $derived(filterByDateRange($expenses, startOfYear(), new Date()));
	let yearStats = $derived(calculateStats(yearExpenses));

	// Previous period expenses for comparison
	let previousPeriodExpenses = $derived(() => {
		const now = new Date();
		switch (selectedPeriod) {
			case 'week': {
				const lastWeekStart = new Date(startOfWeek());
				lastWeekStart.setDate(lastWeekStart.getDate() - 7);
				const lastWeekEnd = new Date(startOfWeek());
				lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
				return filterByDateRange($expenses, lastWeekStart, lastWeekEnd);
			}
			case 'year': {
				const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
				const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
				return filterByDateRange($expenses, lastYearStart, lastYearEnd);
			}
			default: {
				const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
				return filterByDateRange($expenses, lastMonthStart, lastMonthEnd);
			}
		}
	});

	let previousStats = $derived(calculateStats(previousPeriodExpenses()));

	// Get stats based on selected period
	let currentStats = $derived(() => {
		switch (selectedPeriod) {
			case 'week': return $weekStats;
			case 'year': return yearStats;
			default: return $monthStats;
		}
	});

	let currentExpenses = $derived(() => {
		switch (selectedPeriod) {
			case 'week': return $weekExpenses;
			case 'year': return yearExpenses;
			default: return $monthExpenses;
		}
	});

	// Calculate change percentage
	let changePercentage = $derived(() => {
		const current = currentStats().total;
		const previous = previousStats.total;
		if (previous === 0) return current > 0 ? 100 : 0;
		return ((current - previous) / previous) * 100;
	});

	// Category breakdown for selected period
	let categoryStats = $derived(calculateCategoryStats(currentExpenses(), $categories));

	// Donut chart data
	let donutData = $derived(categoryStats.slice(0, 6).map(cat => ({
		label: cat.categoryName,
		value: cat.total,
		color: cat.color
	})));

	// Monthly trend (last 6 months)
	let monthlyTrend = $derived(getMonthlySpending($expenses, 6));

	// Daily spending for heatmap (for selected month)
	let dailySpendingMap = $derived(() => {
		const map = new Map<string, number>();
		$expenses.forEach(exp => {
			// Handle date as string, Date object, or Timestamp
			let dateStr: string;
			if (typeof exp.date === 'string') {
				dateStr = exp.date.split('T')[0];
			} else if (exp.date instanceof Date) {
				dateStr = exp.date.toISOString().split('T')[0];
			} else if (exp.date && typeof exp.date === 'object' && 'toDate' in exp.date) {
				// Firestore Timestamp
				dateStr = (exp.date as any).toDate().toISOString().split('T')[0];
			} else {
				dateStr = new Date(exp.date).toISOString().split('T')[0];
			}
			map.set(dateStr, (map.get(dateStr) || 0) + exp.amount);
		});
		return map;
	});

	// Day of week analysis
	let dayOfWeekData = $derived(() => {
		const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const totals = [0, 0, 0, 0, 0, 0, 0];
		const counts = [0, 0, 0, 0, 0, 0, 0];
		
		currentExpenses().forEach(exp => {
			// Handle date as string, Date object, or Timestamp
			let expDate: Date;
			if (typeof exp.date === 'string') {
				expDate = new Date(exp.date);
			} else if (exp.date instanceof Date) {
				expDate = exp.date;
			} else if (exp.date && typeof exp.date === 'object' && 'toDate' in exp.date) {
				// Firestore Timestamp
				expDate = (exp.date as any).toDate();
			} else {
				expDate = new Date(exp.date);
			}
			const day = expDate.getDay();
			totals[day] += exp.amount;
			counts[day]++;
		});
		
		return days.map((label, i) => ({
			label,
			value: totals[i],
			count: counts[i],
			average: counts[i] > 0 ? totals[i] / counts[i] : 0
		}));
	});

	// Payment method breakdown
	let paymentMethodData = $derived(() => {
		const methods: Record<string, { total: number; count: number }> = {};
		
		currentExpenses().forEach(exp => {
			const method = exp.paymentMethod || 'other';
			if (!methods[method]) {
				methods[method] = { total: 0, count: 0 };
			}
			methods[method].total += exp.amount;
			methods[method].count++;
		});
		
		const labels: Record<string, string> = {
			cash: '💵 Cash',
			card: '💳 Card',
			digital: '📱 Digital',
			bank: '🏦 Bank',
			other: '📋 Other'
		};
		
		return Object.entries(methods)
			.map(([method, data]) => ({
				method,
				label: labels[method] || method,
				...data
			}))
			.sort((a, b) => b.total - a.total);
	});

	// Top merchants
	let topMerchants = $derived(() => {
		const merchants: Record<string, { total: number; count: number }> = {};
		
		currentExpenses().forEach(exp => {
			const merchant = exp.merchant || 'Unknown';
			if (!merchants[merchant]) {
				merchants[merchant] = { total: 0, count: 0 };
			}
			merchants[merchant].total += exp.amount;
			merchants[merchant].count++;
		});
		
		return Object.entries(merchants)
			.map(([name, data]) => ({ name, ...data }))
			.sort((a, b) => b.total - a.total)
			.slice(0, 5);
	});

	// Period labels
	const periodLabels: Record<Period, { current: string; previous: string }> = {
		week: { current: 'This Week', previous: 'Last Week' },
		month: { current: 'This Month', previous: 'Last Month' },
		year: { current: 'This Year', previous: 'Last Year' }
	};

	// Heatmap month navigation
	function prevMonth() {
		heatmapMonth = new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() - 1, 1);
	}

	function nextMonth() {
		const now = new Date();
		const next = new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() + 1, 1);
		if (next <= now) {
			heatmapMonth = next;
		}
	}

	let canGoNext = $derived(() => {
		const now = new Date();
		const next = new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() + 1, 1);
		return next <= now;
	});

	let heatmapMonthLabel = $derived(
		heatmapMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	);

	function handleExportCSV() {
		const date = new Date().toISOString().split('T')[0];
		downloadAsCSV(`expenses-${selectedPeriod}-${date}.csv`);
	}

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Reports | SpendWise</title>
	<meta name="description" content="View detailed reports and analytics of your spending." />
</svelte:head>

{#snippet reportsContent()}
<div class="reports-page">
	<div class="container mx-auto px-4">
		<PageHeader 
			title="Reports" 
			subtitle="Analyze your spending patterns"
		/>

		<!-- Period Selector & Actions -->
		<div class="reports-toolbar">
			<div class="period-selector">
				<button 
					class="period-btn" 
					class:active={selectedPeriod === 'week'}
					onclick={() => selectedPeriod = 'week'}
				>This Week</button>
				<button 
					class="period-btn" 
					class:active={selectedPeriod === 'month'}
					onclick={() => selectedPeriod = 'month'}
				>This Month</button>
				<button 
					class="period-btn" 
					class:active={selectedPeriod === 'year'}
					onclick={() => selectedPeriod = 'year'}
				>This Year</button>
			</div>
			
			<div class="toolbar-actions print-hide">
				<button class="action-btn" onclick={handleExportCSV} title="Export CSV">
					📥 Export
				</button>
				<button class="action-btn" onclick={handlePrint} title="Print Report">
					🖨️ Print
				</button>
			</div>
		</div>

		<!-- Period Comparison -->
		<section class="comparison-section">
			<div class="comparison-card em-card">
				<div class="comparison-period">
					<h3 class="comparison-title">{periodLabels[selectedPeriod].current}</h3>
					<span class="comparison-amount">{formatCurrency(currentStats().total, $preferences.currency)}</span>
					<span class="comparison-count">{currentStats().count} transactions</span>
				</div>
				<div class="comparison-vs">
					<span class="vs-label">vs</span>
					<div class="change-indicator {changePercentage() >= 0 ? 'increase' : 'decrease'}">
						{#if changePercentage() >= 0}
							↑ {Math.abs(changePercentage()).toFixed(1)}%
						{:else}
							↓ {Math.abs(changePercentage()).toFixed(1)}%
						{/if}
					</div>
				</div>
				<div class="comparison-period previous">
					<h3 class="comparison-title">{periodLabels[selectedPeriod].previous}</h3>
					<span class="comparison-amount">{formatCurrency(previousStats.total, $preferences.currency)}</span>
					<span class="comparison-count">{previousStats.count} transactions</span>
				</div>
			</div>
		</section>

		<!-- Summary Stats -->
		<section class="stats-grid">
			<StatCard 
				title="Total Spent" 
				value={formatCurrency(currentStats().total, $preferences.currency)}
				color="expense"
			/>
			<StatCard 
				title="Average" 
				value={formatCurrency(currentStats().average, $preferences.currency)}
			/>
			<StatCard 
				title="Transactions" 
				value={currentStats().count.toString()}
			/>
			<StatCard 
				title="Largest" 
				value={formatCurrency(currentStats().highest, $preferences.currency)}
				color="warning"
			/>
		</section>

		<!-- Charts Row 1 -->
		<div class="charts-grid">
			<!-- Category Breakdown -->
			<section class="chart-card em-card">
				<h2 class="chart-title">Spending by Category</h2>
				
				{#if donutData.length === 0}
					<EmptyState
						title="No data"
						message="No expenses in this period"
						icon="📊"
					/>
				{:else}
					<div class="donut-wrapper">
						<DonutChart 
							data={donutData}
							size={180}
							strokeWidth={35}
							totalLabel="Total"
							formatValue={(v) => formatCurrency(v, $preferences.currency)}
						/>
					</div>
				{/if}
			</section>

			<!-- Monthly Trend -->
			<section class="chart-card em-card">
				<h2 class="chart-title">Monthly Trend</h2>
				
				<div class="bar-chart-wrapper">
					<BarChart 
						data={monthlyTrend}
						height={200}
						barColor="var(--em-primary)"
						formatValue={(v) => formatCurrency(v, $preferences.currency)}
					/>
				</div>
			</section>
		</div>

		<!-- Heatmap and Day of Week Row -->
		<div class="charts-grid two-col">
			<!-- Spending Heatmap with Month Selector -->
			<section class="chart-card em-card">
				<div class="chart-header-with-nav">
					<h2 class="chart-title">Daily Spending</h2>
					<div class="month-nav print-hide">
						<button class="month-nav-btn" onclick={prevMonth} aria-label="Previous month">
							←
						</button>
						<span class="month-label">{heatmapMonthLabel}</span>
						<button 
							class="month-nav-btn" 
							onclick={nextMonth} 
							aria-label="Next month"
							disabled={!canGoNext()}
						>
							→
						</button>
					</div>
				</div>
				<div class="heatmap-wrapper">
					<SpendingHeatmap 
						data={dailySpendingMap()}
						month={heatmapMonth}
					/>
				</div>
			</section>

			<!-- Day of Week -->
			<section class="chart-card em-card">
				<h2 class="chart-title">Spending by Day of Week</h2>
				
				<div class="day-chart">
					{#each dayOfWeekData() as day}
						{@const maxDayValue = Math.max(...dayOfWeekData().map(d => d.value), 1)}
						<div class="day-bar-item">
							<span class="day-label">{day.label}</span>
							<div class="day-bar-wrapper">
								<div 
									class="day-bar-fill"
									style="width: {(day.value / maxDayValue) * 100}%;"
								></div>
							</div>
							<span class="day-amount">{formatCurrency(day.value, $preferences.currency)}</span>
						</div>
					{/each}
				</div>
			</section>
		</div>

		<!-- Payment Methods -->
		<section class="chart-card em-card full-width">
			<h2 class="chart-title">Payment Methods</h2>
			
			{#if paymentMethodData().length === 0}
				<EmptyState
					title="No data"
					message="No payment data available"
					icon="💳"
				/>
			{:else}
				<div class="payment-grid">
					{#each paymentMethodData() as method}
						{@const maxPayment = Math.max(...paymentMethodData().map(m => m.total), 1)}
						<div class="payment-item">
							<div class="payment-header">
								<span class="payment-label">{method.label}</span>
								<span class="payment-amount">{formatCurrency(method.total, $preferences.currency)}</span>
							</div>
							<div class="payment-bar-wrapper">
								<div 
									class="payment-bar-fill"
									style="width: {(method.total / maxPayment) * 100}%;"
								></div>
							</div>
							<span class="payment-count">{method.count} transaction{method.count !== 1 ? 's' : ''}</span>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Top Merchants -->
		{#if topMerchants().length > 0 && topMerchants()[0].name !== 'Unknown'}
			<section class="chart-card em-card full-width">
				<h2 class="chart-title">Top Merchants</h2>
				
				<div class="merchants-grid">
					{#each topMerchants() as merchant, i}
						<div class="merchant-card">
							<span class="merchant-rank">#{i + 1}</span>
							<div class="merchant-info">
								<span class="merchant-name">{merchant.name}</span>
								<span class="merchant-count">{merchant.count} visit{merchant.count !== 1 ? 's' : ''}</span>
							</div>
							<span class="merchant-amount">{formatCurrency(merchant.total, $preferences.currency)}</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Category Table -->
		<section class="chart-card em-card full-width">
			<h2 class="chart-title">Category Breakdown</h2>
			
			{#if categoryStats.length === 0}
				<EmptyState
					title="No expenses"
					message="Add expenses to see the breakdown"
					icon="📋"
				/>
			{:else}
				<div class="category-table-wrapper">
					<table class="category-table">
						<thead>
							<tr>
								<th>Category</th>
								<th class="text-right">Transactions</th>
								<th class="text-right">Total</th>
								<th class="text-right">Average</th>
								<th class="text-right">% of Total</th>
							</tr>
						</thead>
						<tbody>
							{#each categoryStats as cat}
								{@const category = $categories.find(c => c.id === cat.categoryId)}
								<tr>
									<td>
										<span class="cat-icon">{category?.icon || '📋'}</span>
										{cat.categoryName}
									</td>
									<td class="text-right">{cat.count}</td>
									<td class="text-right font-medium">{formatCurrency(cat.total, $preferences.currency)}</td>
									<td class="text-right">{formatCurrency(cat.average, $preferences.currency)}</td>
									<td class="text-right">
										<span class="percentage-badge">{Math.round(cat.percentage)}%</span>
									</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr>
								<td><strong>Total</strong></td>
								<td class="text-right"><strong>{currentStats().count}</strong></td>
								<td class="text-right"><strong>{formatCurrency(currentStats().total, $preferences.currency)}</strong></td>
								<td class="text-right"><strong>{formatCurrency(currentStats().average, $preferences.currency)}</strong></td>
								<td class="text-right"><strong>100%</strong></td>
							</tr>
						</tfoot>
					</table>
				</div>
			{/if}
		</section>
	</div>
</div>
{/snippet}

{#if $authLoading}
	<div class="reports-page">
		<div class="container mx-auto px-4">
			<PageHeader title="Reports" subtitle="Loading..." />
		</div>
	</div>
{:else if !$isAuthenticated}
	<DemoPreview
		title="Reports"
		description="Get detailed insights into your spending patterns with comprehensive analytics, category breakdowns, spending trends, and visual heatmaps. Track your expenses across different time periods and payment methods."
	>
		{#snippet previewContent()}
			{@render reportsContent()}
		{/snippet}
	</DemoPreview>
{:else}
	{@render reportsContent()}
{/if}

<style>
	.reports-page {
		padding-bottom: 2rem;
	}

	/* Toolbar */
	.reports-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.period-selector {
		display: flex;
		gap: 0.5rem;
		background-color: var(--em-surface);
		padding: 0.25rem;
		border-radius: var(--em-radius-lg);
	}

	.period-btn {
		padding: 0.75rem 1.5rem;
		background: transparent;
		border: none;
		border-radius: var(--em-radius-md);
		color: var(--em-text-secondary);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.period-btn:hover {
		color: var(--em-text-primary);
	}

	.period-btn.active {
		background-color: var(--em-primary);
		color: white;
	}

	.toolbar-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		background-color: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-md);
		color: var(--em-text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--em-transition-fast);
	}

	.action-btn:hover {
		background-color: var(--em-surface-hover);
		color: var(--em-text-primary);
	}

	/* Comparison Section */
	.comparison-section {
		margin-bottom: 2rem;
	}

	.comparison-card {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		padding: 1.5rem 2rem;
	}

	.comparison-period {
		text-align: center;
		flex: 1;
		max-width: 200px;
	}

	.comparison-period.previous {
		opacity: 0.7;
	}

	.comparison-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--em-text-secondary);
		margin: 0 0 0.5rem;
	}

	.comparison-amount {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--em-text-primary);
	}

	.comparison-count {
		font-size: 0.75rem;
		color: var(--em-text-muted);
	}

	.comparison-vs {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.vs-label {
		font-size: 0.75rem;
		color: var(--em-text-muted);
		text-transform: uppercase;
	}

	.change-indicator {
		padding: 0.375rem 0.75rem;
		border-radius: var(--em-radius-full);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.change-indicator.increase {
		background-color: var(--em-expense-bg);
		color: var(--em-expense);
	}

	.change-indicator.decrease {
		background-color: var(--em-income-bg);
		color: var(--em-income);
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	/* Charts Grid */
	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.charts-grid.two-col {
		grid-template-columns: 1fr 1fr;
	}

	@media (max-width: 900px) {
		.charts-grid.two-col {
			grid-template-columns: 1fr;
		}
	}

	.chart-card {
		padding: 1.5rem;
	}

	.chart-card.full-width {
		grid-column: 1 / -1;
	}

	.chart-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1.5rem;
	}

	.chart-header-with-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.chart-header-with-nav .chart-title {
		margin: 0;
	}

	.month-nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.month-nav-btn {
		padding: 0.375rem 0.75rem;
		background-color: var(--em-surface);
		border: 1px solid var(--em-border);
		border-radius: var(--em-radius-sm);
		cursor: pointer;
		font-size: 1rem;
		color: var(--em-text-secondary);
		transition: all var(--em-transition-fast);
	}

	.month-nav-btn:hover:not(:disabled) {
		background-color: var(--em-surface-hover);
		color: var(--em-text-primary);
	}

	.month-nav-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.month-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--em-text-primary);
		min-width: 120px;
		text-align: center;
	}

	.donut-wrapper {
		display: flex;
		justify-content: center;
	}

	.bar-chart-wrapper {
		padding: 0.5rem 0;
	}

	.heatmap-wrapper {
		display: flex;
		justify-content: center;
	}

	/* Day of Week Chart */
	.day-chart {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.day-bar-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.day-label {
		width: 40px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--em-text-secondary);
	}

	.day-bar-wrapper {
		flex: 1;
		height: 24px;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-sm);
		overflow: hidden;
	}

	.day-bar-fill {
		height: 100%;
		background: linear-gradient(to right, var(--em-primary), var(--em-primary-light));
		border-radius: var(--em-radius-sm);
		transition: width 0.5s ease;
		min-width: 2px;
	}

	.day-amount {
		width: 80px;
		text-align: right;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--em-text-primary);
	}

	/* Payment Methods Grid */
	.payment-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.payment-item {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.payment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.payment-label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.payment-amount {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--em-text-primary);
	}

	.payment-bar-wrapper {
		height: 8px;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-full);
		overflow: hidden;
	}

	.payment-bar-fill {
		height: 100%;
		background-color: var(--em-primary);
		border-radius: var(--em-radius-full);
		transition: width 0.5s ease;
	}

	.payment-count {
		font-size: 0.6875rem;
		color: var(--em-text-muted);
	}

	/* Merchants Grid */
	.merchants-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.merchant-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-md);
	}

	.merchant-rank {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--em-text-muted);
	}

	.merchant-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.merchant-name {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.merchant-count {
		font-size: 0.6875rem;
		color: var(--em-text-muted);
	}

	.merchant-amount {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--em-text-primary);
	}

	/* Category Table */
	.category-table-wrapper {
		overflow-x: auto;
	}

	.category-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.category-table th {
		text-align: left;
		padding: 0.75rem 1rem;
		font-weight: 500;
		color: var(--em-text-muted);
		border-bottom: 1px solid var(--em-border);
		white-space: nowrap;
	}

	.category-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--em-border);
		white-space: nowrap;
	}

	.category-table tbody tr:hover {
		background-color: var(--em-bg-hover);
	}

	.category-table tfoot td {
		border-bottom: none;
		border-top: 2px solid var(--em-border);
	}

	.cat-icon {
		margin-right: 0.5rem;
	}

	.text-right {
		text-align: right;
	}

	.font-medium {
		font-weight: 500;
	}

	.percentage-badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		background-color: var(--em-bg-tertiary);
		border-radius: var(--em-radius-sm);
		font-size: 0.75rem;
	}

	/* Print styles */
	@media print {
		.print-hide {
			display: none !important;
		}

		.reports-page {
			padding: 0;
		}

		.em-card {
			box-shadow: none;
			border: 1px solid #ccc;
			break-inside: avoid;
		}

		.period-selector {
			background: none;
			padding: 0;
		}

		.period-btn {
			display: none;
		}

		.period-btn.active {
			display: block;
			background: none;
			color: #000;
			padding: 0;
			font-weight: 700;
		}

		/* Force dark text for print */
		.comparison-amount,
		.comparison-title,
		.comparison-count,
		.chart-title,
		.day-label,
		.day-amount,
		.payment-label,
		.payment-amount,
		.payment-count,
		.merchant-name,
		.merchant-amount,
		.merchant-count,
		.merchant-rank,
		.category-table th,
		.category-table td,
		.percentage-badge {
			color: #000 !important;
		}

		.change-indicator {
			background-color: #f0f0f0 !important;
			color: #000 !important;
		}

		.change-indicator.increase {
			border: 1px solid #dc2626;
		}

		.change-indicator.decrease {
			border: 1px solid #16a34a;
		}

		.day-bar-fill,
		.payment-bar-fill {
			background: #333 !important;
		}

		.category-table {
			color: #000;
		}

		.category-table th {
			background-color: #f0f0f0;
		}

		.percentage-badge {
			background-color: #e5e5e5 !important;
		}
	}

	@media (max-width: 600px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}

		.comparison-card {
			flex-direction: column;
			gap: 1rem;
		}

		.comparison-period {
			max-width: none;
		}

		.merchants-grid {
			grid-template-columns: 1fr;
		}

		.category-table {
			font-size: 0.75rem;
		}

		.chart-header-with-nav {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
	}
</style>
