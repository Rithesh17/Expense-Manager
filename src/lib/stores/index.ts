// Expense Manager - Svelte Stores
// Reactive state management with localStorage persistence

// Expenses store and derived
export { 
  expenses, 
  expenseActions,
  expenseFilters,
  expenseSort,
  filteredExpenses,
  todayExpenses,
  weekExpenses,
  monthExpenses,
  todayStats,
  weekStats,
  monthStats,
  totalExpenseCount
} from './expenses';

// Categories store and derived
export { 
  categories, 
  categoryActions,
  userCategories,
  systemCategories,
  categoriesWithBudgets,
  categoryCount,
  categoryMap
} from './categories';

// Budgets store and derived
export { 
  budgets, 
  budgetActions,
  overallBudget,
  categoryBudgets,
  budgetProgress,
  overallBudgetProgress,
  categoryBudgetProgress,
  budgetAlerts,
  budgetCount
} from './budgets';

// Preferences store
export { preferences, preferenceActions, initializeTheme } from './preferences';

// App state
export { appState, appActions, initializeStores, isReady, hasError } from './app';

// Auth store and derived
export {
	authStore,
	currentUser,
	userId,
	isAuthenticated,
	authLoading,
	authError,
	authActions
} from './auth';
