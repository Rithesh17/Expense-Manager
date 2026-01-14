// Expense Manager - Expenses Store

import { writable, derived, get } from 'svelte/store';
import type { Expense, ExpenseFilters, ExpenseFormData, PaymentMethod } from '$lib/types';
import { loadFromStorage, saveExpenses } from '$lib/utils/storage';
import { 
  generateId, 
  getCurrentDate, 
  getCurrentTimestamp,
  searchExpenses,
  sortExpenses,
  filterByDateRange,
  calculateTotal,
  calculateStats,
  getTodayExpenses,
  getWeekExpenses,
  getMonthExpenses,
  parseTags
} from '$lib/utils';
import { browser } from '$app/environment';
import { userId } from './auth';

// ============================================
// Store Creation
// ============================================

function createExpensesStore() {
  // Initialize from localStorage
  const initialData = browser ? loadFromStorage().expenses : [];
  const { subscribe, set, update } = writable<Expense[]>(initialData);
  
  // Auto-save on changes
  if (browser) {
    subscribe(expenses => {
      saveExpenses(expenses);
    });
  }
  
  return {
    subscribe,
    set,
    update,
    
    /**
     * Initialize store from storage (call on mount)
     */
    init: () => {
      if (browser) {
        const data = loadFromStorage();
        set(data.expenses);
      }
    },
    
    /**
     * Add a new expense
     */
    add: async (formData: ExpenseFormData, expenseUserId?: string): Promise<Expense> => {
      const currentUserId = expenseUserId || get(userId) || 'local';
      const now = getCurrentTimestamp();
      const expense: Expense = {
        id: generateId('exp'),
        userId: currentUserId,
        amount: parseFloat(formData.amount) || 0,
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        date: formData.date || getCurrentDate(),
        createdAt: now,
        updatedAt: now,
        merchant: formData.merchant?.trim(),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes?.trim(),
        tags: formData.tags ? parseTags(formData.tags) : undefined
      };
      
      update(expenses => [expense, ...expenses]);
      
      // Sync to Firestore if authenticated (using dynamic import to avoid circular dependency)
      if (currentUserId !== 'local') {
        import('$lib/firebase/sync').then(({ syncExpenseToFirestore }) => {
          syncExpenseToFirestore(expense).catch(err => {
            console.error('Failed to sync expense to Firestore:', err);
          });
        });
      }
      
      return expense;
    },
    
    /**
     * Update an existing expense
     */
    updateExpense: async (id: string, updates: Partial<Expense>): Promise<boolean> => {
      let found = false;
      let updatedExpense: Expense | null = null;
      
      update(expenses => {
        return expenses.map(exp => {
          if (exp.id === id) {
            found = true;
            updatedExpense = { 
              ...exp, 
              ...updates, 
              updatedAt: getCurrentTimestamp() 
            };
            return updatedExpense;
          }
          return exp;
        });
      });
      
      // Sync to Firestore if authenticated (using dynamic import to avoid circular dependency)
      if (found && updatedExpense && updatedExpense.userId !== 'local') {
        import('$lib/firebase/sync').then(({ syncExpenseToFirestore }) => {
          syncExpenseToFirestore(updatedExpense!).catch(err => {
            console.error('Failed to sync expense update to Firestore:', err);
          });
        });
      }
      
      return found;
    },
    
    /**
     * Delete an expense
     */
    delete: async (id: string): Promise<boolean> => {
      const expense = get({ subscribe }).find(exp => exp.id === id);
      const expenseUserId = expense?.userId;
      
      let found = false;
      update(expenses => {
        const filtered = expenses.filter(exp => {
          if (exp.id === id) {
            found = true;
            return false;
          }
          return true;
        });
        return filtered;
      });
      
      // Delete from Firestore if authenticated (using dynamic import to avoid circular dependency)
      if (found && expenseUserId && expenseUserId !== 'local') {
        import('$lib/firebase/sync').then(({ deleteExpenseFromFirestore }) => {
          deleteExpenseFromFirestore(id).catch(err => {
            console.error('Failed to delete expense from Firestore:', err);
          });
        });
      }
      
      return found;
    },
    
    /**
     * Delete multiple expenses
     */
    deleteMany: async (ids: string[]): Promise<number> => {
      const currentExpenses = get({ subscribe });
      const expensesToDelete = currentExpenses.filter(exp => ids.includes(exp.id));
      
      const idSet = new Set(ids);
      let count = 0;
      update(expenses => {
        return expenses.filter(exp => {
          if (idSet.has(exp.id)) {
            count++;
            return false;
          }
          return true;
        });
      });
      
      // Delete from Firestore if authenticated (using dynamic import to avoid circular dependency)
      const currentUserId = get(userId);
      if (currentUserId) {
        import('$lib/firebase/sync').then(({ deleteExpenseFromFirestore }) => {
          expensesToDelete.forEach(expense => {
            if (expense.userId !== 'local') {
              deleteExpenseFromFirestore(expense.id).catch(err => {
                console.error('Failed to delete expense from Firestore:', err);
              });
            }
          });
        });
      }
      
      return count;
    },
    
    /**
     * Get expense by ID
     */
    getById: (id: string): Expense | undefined => {
      const expenses = get({ subscribe });
      return expenses.find(exp => exp.id === id);
    },
    
    /**
     * Clear all expenses
     */
    clear: (): void => {
      set([]);
    },
    
    /**
     * Replace all expenses (for import)
     */
    replaceAll: (newExpenses: Expense[]): void => {
      set(newExpenses);
    }
  };
}

// Create the store
export const expenses = createExpensesStore();

// ============================================
// Derived Stores
// ============================================

// Current filters
export const expenseFilters = writable<ExpenseFilters>({
  search: '',
  categoryId: 'all'
});

// Current sort
export const expenseSort = writable<{ field: 'date' | 'amount' | 'description'; direction: 'asc' | 'desc' }>({
  field: 'date',
  direction: 'desc'
});

// Filtered and sorted expenses
export const filteredExpenses = derived(
  [expenses, expenseFilters, expenseSort],
  ([$expenses, $filters, $sort]) => {
    let result = [...$expenses];
    
    // Apply search
    if ($filters.search) {
      result = searchExpenses(result, $filters.search);
    }
    
    // Apply category filter
    if ($filters.categoryId && $filters.categoryId !== 'all') {
      result = result.filter(exp => exp.categoryId === $filters.categoryId);
    }
    
    // Apply date range filter
    if ($filters.dateFrom || $filters.dateTo) {
      const from = $filters.dateFrom ? new Date($filters.dateFrom) : new Date('1970-01-01');
      const to = $filters.dateTo ? new Date($filters.dateTo) : new Date();
      result = filterByDateRange(result, from, to);
    }
    
    // Apply amount filter
    if ($filters.amountMin !== undefined) {
      result = result.filter(exp => exp.amount >= ($filters.amountMin || 0));
    }
    if ($filters.amountMax !== undefined) {
      result = result.filter(exp => exp.amount <= ($filters.amountMax || Infinity));
    }
    
    // Apply payment method filter
    if ($filters.paymentMethod && $filters.paymentMethod !== 'all') {
      result = result.filter(exp => exp.paymentMethod === $filters.paymentMethod);
    }
    
    // Apply sort
    result = sortExpenses(result, $sort.field, $sort.direction);
    
    return result;
  }
);

// Today's expenses
export const todayExpenses = derived(expenses, $expenses => 
  getTodayExpenses($expenses)
);

// This week's expenses
export const weekExpenses = derived(expenses, $expenses => 
  getWeekExpenses($expenses)
);

// This month's expenses
export const monthExpenses = derived(expenses, $expenses => 
  getMonthExpenses($expenses)
);

// Stats derived stores
export const todayStats = derived(todayExpenses, $today => 
  calculateStats($today)
);

export const weekStats = derived(weekExpenses, $week => 
  calculateStats($week)
);

export const monthStats = derived(monthExpenses, $month => 
  calculateStats($month)
);

// Total counts
export const totalExpenseCount = derived(expenses, $expenses => 
  $expenses.length
);

// ============================================
// Actions (for external use)
// ============================================

export const expenseActions = {
  add: expenses.add,
  update: expenses.updateExpense,
  delete: expenses.delete,
  deleteMany: expenses.deleteMany,
  getById: expenses.getById,
  clear: expenses.clear,
  init: expenses.init,
  
  setFilters: (filters: Partial<ExpenseFilters>) => {
    expenseFilters.update(current => ({ ...current, ...filters }));
  },
  
  clearFilters: () => {
    expenseFilters.set({ search: '', categoryId: 'all' });
  },
  
  setSort: (field: 'date' | 'amount' | 'description', direction: 'asc' | 'desc') => {
    expenseSort.set({ field, direction });
  }
};
