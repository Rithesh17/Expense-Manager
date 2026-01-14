// Expense Manager - Firestore Sync Service
// Handles syncing between Firestore and local stores

import { browser } from '$app/environment';
import { get } from 'svelte/store';
import type { Expense, Category, Budget } from '$lib/types';
import { saveExpenses, saveCategories, saveBudgets } from '$lib/utils/storage';

let unsubscribeExpenses: (() => void) | null = null;
let unsubscribeCategories: (() => void) | null = null;
let unsubscribeBudgets: (() => void) | null = null;

/**
 * Start syncing with Firestore for authenticated user
 */
export async function startFirestoreSync() {
	// Only run in browser
	if (!browser) return;

	const { userId } = await import('$lib/stores');
	const currentUserId = get(userId);
	if (!currentUserId) {
		return;
	}

	stopFirestoreSync();

	// Import Firestore functions
	const {
		subscribeToExpenses,
		subscribeToCategories,
		subscribeToBudgets
	} = await import('$lib/firebase/firestore');

	// Subscribe to expenses (using dynamic import to avoid circular dependency)
	const { expenses } = await import('$lib/stores/expenses');
	unsubscribeExpenses = subscribeToExpenses(currentUserId, (firestoreExpenses) => {
		// Only update if data is different to avoid infinite loops
		const currentExpenses = get(expenses);
		const hasChanges =
			currentExpenses.length !== firestoreExpenses.length ||
			JSON.stringify(currentExpenses) !== JSON.stringify(firestoreExpenses);

		if (hasChanges) {
			expenses.set(firestoreExpenses);
			// Also save to localStorage as backup
			saveExpenses(firestoreExpenses);
		}
	});

	// Subscribe to categories (using dynamic import to avoid circular dependency)
	const { categories } = await import('$lib/stores/categories');
	const { SEED_CATEGORIES } = await import('$lib/stores/seed-data');
	let isInitialSync = true; // Track if this is the first sync
	
	unsubscribeCategories = subscribeToCategories(currentUserId, (firestoreCategories) => {
		const currentCategories = get(categories);
		
		if (isInitialSync && firestoreCategories.length === 0 && currentCategories.length > 0) {
			const userCategories = currentCategories.filter(cat => cat.userId === currentUserId);
			if (userCategories.length > 0) {
				isInitialSync = false;
				return;
			}
		}
		
		isInitialSync = false;
		
		const seedCategoryIds = new Set(SEED_CATEGORIES.map(cat => cat.id));
		const uniqueFirestoreCategories = firestoreCategories.filter(
			cat => !seedCategoryIds.has(cat.id)
		);
		const mergedCategories = [...SEED_CATEGORIES, ...uniqueFirestoreCategories];
		
		const currentUserCategories = currentCategories.filter(cat => cat.userId === currentUserId);
		const currentSystemCategories = currentCategories.filter(cat => cat.userId === null);
		const hasChanges =
			currentUserCategories.length !== firestoreCategories.length ||
			currentSystemCategories.length !== SEED_CATEGORIES.length ||
			JSON.stringify(currentUserCategories.sort((a, b) => a.id.localeCompare(b.id))) !== 
			JSON.stringify(firestoreCategories.sort((a, b) => a.id.localeCompare(b.id)));

		if (hasChanges) {
			categories.set(mergedCategories);
			saveCategories(mergedCategories);
		}
	});

	// Subscribe to budgets (using dynamic import to avoid circular dependency)
	const { budgets } = await import('$lib/stores/budgets');
	unsubscribeBudgets = subscribeToBudgets(currentUserId, (firestoreBudgets) => {
		const currentBudgets = get(budgets);
		const hasChanges =
			currentBudgets.length !== firestoreBudgets.length ||
			JSON.stringify(currentBudgets) !== JSON.stringify(firestoreBudgets);

		if (hasChanges) {
			budgets.set(firestoreBudgets);
			saveBudgets(firestoreBudgets);
		}
	});
}

/**
 * Stop syncing with Firestore
 */
export function stopFirestoreSync() {
	if (unsubscribeExpenses) {
		unsubscribeExpenses();
		unsubscribeExpenses = null;
	}
	if (unsubscribeCategories) {
		unsubscribeCategories();
		unsubscribeCategories = null;
	}
	if (unsubscribeBudgets) {
		unsubscribeBudgets();
		unsubscribeBudgets = null;
	}
}

/**
 * Sync expense to Firestore (if authenticated)
 */
export async function syncExpenseToFirestore(expense: Expense): Promise<void> {
	if (!browser) return;

	const { isAuthenticated, userId } = await import('$lib/stores');
	const { auth } = await import('$lib/firebase/config');
	
	let currentUser = auth.currentUser;
	if (!currentUser) {
		try {
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					unsubscribe();
					reject(new Error('Auth initialization timeout'));
				}, 5000);
				
				const unsubscribe = auth.onAuthStateChanged((user) => {
					clearTimeout(timeout);
					currentUser = user;
					unsubscribe();
					if (user) {
						resolve();
					} else {
						reject(new Error('No user after auth state change'));
					}
				});
			});
		} catch (error) {
			currentUser = auth.currentUser;
		}
	}
	
	const currentUserId = currentUser?.uid || get(userId);
	
	if (!currentUser || !currentUserId) {
		return;
	}

	const actualUserId = currentUser.uid;
	if (expense.userId !== actualUserId) {
		expense = { ...expense, userId: actualUserId };
	}

	if (!expense.amount || expense.amount <= 0 || !expense.description || expense.description.trim().length === 0 || !expense.categoryId || expense.categoryId.trim().length === 0) {
		return;
	}

	try {
		const { createExpense, updateExpense } = await import('$lib/firebase/firestore');
		
		try {
			await createExpense(expense);
		} catch (createError: any) {
			if (createError?.code === 'already-exists' || createError?.message?.includes('already exists')) {
				await updateExpense(expense.id, expense);
			} else {
				throw createError;
			}
		}
	} catch (error: any) {
		console.error('Error syncing expense to Firestore:', error);
	}
}

/**
 * Sync category to Firestore (if authenticated)
 */
export async function syncCategoryToFirestore(category: Category): Promise<void> {
	if (!browser) return;

	const { isAuthenticated, userId } = await import('$lib/stores');
	const { auth } = await import('$lib/firebase/config');
	const currentUserId = get(userId);
	const currentUser = auth.currentUser;
	
	if (!get(isAuthenticated) || !currentUserId) {
		return;
	}

	if (category.userId === null) {
		return;
	}

	if (category.userId !== currentUserId) {
		category = { ...category, userId: currentUserId };
	}

	if (!category.name || category.name.trim().length === 0) {
		return;
	}

	try {
		const { createCategory, updateCategory } = await import('$lib/firebase/firestore');
		
		try {
			await createCategory(category);
		} catch (createError: any) {
			if (createError?.code === 'already-exists' || createError?.message?.includes('already exists')) {
				await updateCategory(category.id, category);
			} else {
				throw createError;
			}
		}
	} catch (error: any) {
		console.error('Error syncing category to Firestore:', error);
		throw error;
	}
}

/**
 * Sync budget to Firestore (if authenticated)
 */
export async function syncBudgetToFirestore(budget: Budget): Promise<void> {
	if (!browser) return;

	const { isAuthenticated, userId } = await import('$lib/stores');
	const { auth } = await import('$lib/firebase/config');
	const currentUserId = get(userId);
	const currentUser = auth.currentUser;
	
	if (!get(isAuthenticated) || !currentUserId) {
		return;
	}

	if (budget.userId !== currentUserId) {
		budget = { ...budget, userId: currentUserId };
	}

	if (!budget.amount || budget.amount <= 0) {
		return;
	}
	if (!budget.period || budget.period.trim().length === 0) {
		return;
	}

	try {
		const { createBudget, updateBudget } = await import('$lib/firebase/firestore');
		
		try {
			await createBudget(budget);
		} catch (createError: any) {
			if (createError?.code === 'already-exists' || createError?.message?.includes('already exists')) {
				await updateBudget(budget.id, budget);
			} else {
				throw createError;
			}
		}
	} catch (error: any) {
		console.error('Error syncing budget to Firestore:', error);
		throw error;
	}
}

/**
 * Delete expense from Firestore (if authenticated)
 */
export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
	if (!browser) return;

	const { isAuthenticated, userId } = await import('$lib/stores');
	if (!get(isAuthenticated) || !get(userId)) {
		return;
	}

	try {
		const { deleteExpense } = await import('$lib/firebase/firestore');
		await deleteExpense(expenseId);
	} catch (error) {
		// Silently fail - expense is already deleted locally
	}
}

/**
 * Delete category from Firestore (if authenticated)
 */
export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
	if (!browser) return;

	const { isAuthenticated, userId } = await import('$lib/stores');
	if (!get(isAuthenticated) || !get(userId)) {
		return;
	}

	try {
		const { deleteCategory } = await import('$lib/firebase/firestore');
		await deleteCategory(categoryId);
	} catch (error) {
		// Silently fail - category is already deleted locally
	}
}

/**
 * Delete budget from Firestore (if authenticated)
 */
export async function deleteBudgetFromFirestore(budgetId: string): Promise<void> {
	if (!browser) return;

	const { isAuthenticated, userId } = await import('$lib/stores');
	if (!get(isAuthenticated) || !get(userId)) {
		return;
	}

	try {
		const { deleteBudget } = await import('$lib/firebase/firestore');
		await deleteBudget(budgetId);
	} catch (error) {
		// Silently fail - budget is already deleted locally
	}
}
