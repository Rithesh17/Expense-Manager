// Expense Manager - Utility Functions

import type { 
  Expense, 
  Category, 
  Budget, 
  ExpenseStats, 
  CategoryStats,
  BudgetProgress,
  DateFormat 
} from '$lib/types';

// ============================================
// ID Generation
// ============================================

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Generate a shareable ID (shorter, URL-friendly)
 */
export function generateShareableId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ============================================
// Date Utilities
// ============================================

/**
 * Get current date as ISO string (date only)
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current timestamp as ISO string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format date according to user preference
 */
export function formatDate(dateStr: string, format: DateFormat = 'MM/DD/YYYY'): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`;
  }
}

/**
 * Format date as relative time (Today, Yesterday, etc.)
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = date.toDateString();
  
  if (dateOnly === today.toDateString()) {
    return 'Today';
  } else if (dateOnly === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(dateStr);
    }
  }
}

/**
 * Get start of day
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of week (Sunday)
 */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return startOfDay(d);
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  return startOfDay(d);
}

/**
 * Get start of year
 */
export function startOfYear(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setMonth(0, 1);
  return startOfDay(d);
}

// ============================================
// Currency Formatting
// ============================================

/**
 * Format amount as currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ============================================
// Expense Calculations
// ============================================

/**
 * Calculate total of expenses
 */
export function calculateTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}

/**
 * Calculate expense statistics
 */
export function calculateStats(expenses: Expense[]): ExpenseStats {
  if (expenses.length === 0) {
    return { total: 0, count: 0, average: 0, highest: 0, lowest: 0 };
  }
  
  const amounts = expenses.map(e => e.amount);
  const total = amounts.reduce((sum, a) => sum + a, 0);
  
  return {
    total,
    count: expenses.length,
    average: total / expenses.length,
    highest: Math.max(...amounts),
    lowest: Math.min(...amounts)
  };
}

/**
 * Calculate stats by category
 */
export function calculateCategoryStats(
  expenses: Expense[], 
  categories: Category[]
): CategoryStats[] {
  const total = calculateTotal(expenses);
  const categoryMap = new Map<string, number>();
  
  // Sum by category
  expenses.forEach(exp => {
    const current = categoryMap.get(exp.categoryId) || 0;
    categoryMap.set(exp.categoryId, current + exp.amount);
  });
  
  // Build stats array
  const stats: CategoryStats[] = [];
  categoryMap.forEach((amount, categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    stats.push({
      categoryId,
      categoryName: category?.name || 'Unknown',
      total: amount,
      count: expenses.filter(e => e.categoryId === categoryId).length,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: category?.color || '#64748B'
    });
  });
  
  // Sort by total descending
  return stats.sort((a, b) => b.total - a.total);
}

/**
 * Get expenses for a date range
 */
export function filterByDateRange(
  expenses: Expense[], 
  startDate: Date, 
  endDate: Date
): Expense[] {
  const start = startOfDay(startDate).getTime();
  const end = endOfDay(endDate).getTime();
  
  return expenses.filter(exp => {
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
    return expDate.getTime() >= start && expDate.getTime() <= end;
  });
}

/**
 * Get today's expenses
 */
export function getTodayExpenses(expenses: Expense[]): Expense[] {
  const today = new Date();
  return filterByDateRange(expenses, today, today);
}

/**
 * Get this week's expenses
 */
export function getWeekExpenses(expenses: Expense[]): Expense[] {
  const start = startOfWeek();
  const end = new Date();
  return filterByDateRange(expenses, start, end);
}

/**
 * Get this month's expenses
 */
export function getMonthExpenses(expenses: Expense[]): Expense[] {
  const start = startOfMonth();
  const end = new Date();
  return filterByDateRange(expenses, start, end);
}

// ============================================
// Budget Calculations
// ============================================

/**
 * Calculate budget progress
 */
export function calculateBudgetProgress(budget: Budget, spent: number): BudgetProgress {
  const remaining = Math.max(budget.amount - spent, 0);
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  
  let status: 'safe' | 'warning' | 'danger';
  if (percentage >= 100) {
    status = 'danger';
  } else if (percentage >= 80) {
    status = 'warning';
  } else {
    status = 'safe';
  }
  
  return {
    budget,
    spent,
    remaining,
    percentage: Math.min(percentage, 100),
    status
  };
}

/**
 * Get spent amount for a budget
 */
export function getSpentForBudget(
  budget: Budget, 
  expenses: Expense[]
): number {
  // Filter expenses by date range
  const startDate = new Date(budget.startDate);
  const endDate = budget.endDate ? new Date(budget.endDate) : new Date();
  
  let filtered = filterByDateRange(expenses, startDate, endDate);
  
  // Filter by category if not overall budget
  if (budget.categoryId) {
    filtered = filtered.filter(e => e.categoryId === budget.categoryId);
  }
  
  return calculateTotal(filtered);
}

// ============================================
// Search & Filter
// ============================================

/**
 * Search expenses by text
 */
export function searchExpenses(expenses: Expense[], query: string): Expense[] {
  if (!query.trim()) return expenses;
  
  const lowerQuery = query.toLowerCase();
  return expenses.filter(exp => 
    exp.description.toLowerCase().includes(lowerQuery) ||
    exp.merchant?.toLowerCase().includes(lowerQuery) ||
    exp.notes?.toLowerCase().includes(lowerQuery) ||
    exp.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Sort expenses
 */
export function sortExpenses(
  expenses: Expense[], 
  field: 'date' | 'amount' | 'description' = 'date',
  direction: 'asc' | 'desc' = 'desc'
): Expense[] {
  const sorted = [...expenses].sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'date':
        // Handle date as string, Date object, or Timestamp
        const getDateValue = (date: any): number => {
          if (typeof date === 'string') return new Date(date).getTime();
          if (date instanceof Date) return date.getTime();
          if (date && typeof date === 'object' && 'toDate' in date) return (date as any).toDate().getTime();
          return new Date(date).getTime();
        };
        comparison = getDateValue(a.date) - getDateValue(b.date);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'description':
        comparison = a.description.localeCompare(b.description);
        break;
    }
    
    return direction === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

// ============================================
// Validation
// ============================================

/**
 * Validate expense data
 */
export function validateExpense(data: Partial<Expense>): string[] {
  const errors: string[] = [];
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!data.description?.trim()) {
    errors.push('Description is required');
  }
  
  if (!data.categoryId) {
    errors.push('Category is required');
  }
  
  if (!data.date) {
    errors.push('Date is required');
  }
  
  return errors;
}

/**
 * Validate category data
 */
export function validateCategory(data: Partial<Category>): string[] {
  const errors: string[] = [];
  
  if (!data.name?.trim()) {
    errors.push('Name is required');
  }
  
  if (data.budget !== undefined && data.budget < 0) {
    errors.push('Budget cannot be negative');
  }
  
  return errors;
}

// ============================================
// Data Transformation
// ============================================

/**
 * Group expenses by date
 */
export function groupByDate(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>();
  
  expenses.forEach(exp => {
    const dateKey = exp.date.split('T')[0];
    const group = groups.get(dateKey) || [];
    group.push(exp);
    groups.set(dateKey, group);
  });
  
  return groups;
}

/**
 * Group expenses by category
 */
export function groupByCategory(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>();
  
  expenses.forEach(exp => {
    const group = groups.get(exp.categoryId) || [];
    group.push(exp);
    groups.set(exp.categoryId, group);
  });
  
  return groups;
}

/**
 * Parse tags from comma-separated string
 */
export function parseTags(tagString: string): string[] {
  if (!tagString.trim()) return [];
  return tagString
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0);
}

/**
 * Convert tags array to string
 */
export function tagsToString(tags: string[]): string {
  return tags.join(', ');
}

// ============================================
// Chart Data Helpers
// ============================================

/**
 * Get daily spending for the last N days
 */
export function getDailySpending(expenses: Expense[], days: number = 7): Array<{label: string, value: number, date: string}> {
  const result: Array<{label: string, value: number, date: string}> = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayExpenses = expenses.filter(e => {
      // Handle date as string, Date object, or Timestamp
      const expenseDate = typeof e.date === 'string' 
        ? e.date 
        : (e.date instanceof Date 
          ? e.date.toISOString().split('T')[0] 
          : new Date(e.date).toISOString().split('T')[0]);
      return expenseDate.startsWith(dateStr);
    });
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Short day label (Mon, Tue, etc.)
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    result.push({
      label: dayLabel,
      value: total,
      date: dateStr
    });
  }
  
  return result;
}

/**
 * Get monthly spending for the last N months
 */
export function getMonthlySpending(expenses: Expense[], months: number = 6): Array<{label: string, value: number, month: string}> {
  const result: Array<{label: string, value: number, month: string}> = [];
  const today = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const monthExpenses = expenses.filter(e => {
      // Handle date as string, Date object, or Timestamp
      let expDate: Date;
      if (typeof e.date === 'string') {
        expDate = new Date(e.date);
      } else if (e.date instanceof Date) {
        expDate = e.date;
      } else if (e.date && typeof e.date === 'object' && 'toDate' in e.date) {
        expDate = (e.date as any).toDate();
      } else {
        expDate = new Date(e.date);
      }
      return expDate.getFullYear() === year && expDate.getMonth() === month;
    });
    
    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Short month label
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
    
    result.push({
      label: monthLabel,
      value: total,
      month: `${year}-${String(month + 1).padStart(2, '0')}`
    });
  }
  
  return result;
}

/**
 * Get spending trend (daily totals) for sparkline
 */
export function getSpendingTrend(expenses: Expense[], days: number = 14): number[] {
  const daily = getDailySpending(expenses, days);
  return daily.map(d => d.value);
}

/**
 * Get biggest expense from list
 */
export function getBiggestExpense(expenses: Expense[]): Expense | null {
  if (expenses.length === 0) return null;
  return expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]);
}

/**
 * Get most frequent category
 */
export function getMostFrequentCategory(expenses: Expense[]): string | null {
  if (expenses.length === 0) return null;
  
  const counts: Record<string, number> = {};
  expenses.forEach(e => {
    counts[e.categoryId] = (counts[e.categoryId] || 0) + 1;
  });
  
  let maxCount = 0;
  let maxCat = null;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxCat = cat;
    }
  }
  
  return maxCat;
}
