// Expense Manager - Categories Store

import { writable, derived, get } from 'svelte/store';
import type { Category } from '$lib/types';
import { loadFromStorage, saveCategories } from '$lib/utils/storage';
import { generateId, getCurrentTimestamp } from '$lib/utils';
import { browser } from '$app/environment';
import { SEED_CATEGORIES } from './seed-data';
import { userId } from './auth';

// ============================================
// Store Creation
// ============================================

function createCategoriesStore() {
  // Initialize from localStorage or use seed data
  let initialData: Category[] = [];
  if (browser) {
    const stored = loadFromStorage().categories;
    initialData = stored.length > 0 ? stored : SEED_CATEGORIES;
  }
  
  const { subscribe, set, update } = writable<Category[]>(initialData);
  
  // Auto-save on changes
  if (browser) {
    subscribe(categories => {
      saveCategories(categories);
    });
  }
  
  return {
    subscribe,
    set,
    update,
    
    /**
     * Initialize store from storage (call on mount)
     * Seed categories are shown for all users as defaults
     */
    init: () => {
      if (browser) {
        const data = loadFromStorage();
        // Always include seed categories if localStorage is empty
        // Seed categories are defaults for all users (authenticated and unauthenticated)
        const categories = data.categories.length > 0 ? data.categories : SEED_CATEGORIES;
        set(categories);
      }
    },
    
    /**
     * Add a new category
     */
    add: async (data: Omit<Category, 'id' | 'createdAt'>): Promise<Category> => {
      const currentUserId = data.userId || get(userId) || null;
      const category: Category = {
        id: generateId('cat'),
        userId: currentUserId,
        name: data.name.trim(),
        icon: data.icon,
        color: data.color,
        createdAt: getCurrentTimestamp(),
        parentId: data.parentId,
        budget: data.budget,
        budgetPeriod: data.budgetPeriod
      };
      
      update(categories => [...categories, category]);
      
      // Sync to Firestore if authenticated (using dynamic import to avoid circular dependency)
      // Use await to ensure sync completes, but don't block the UI
      if (currentUserId) {
        import('$lib/firebase/sync').then(({ syncCategoryToFirestore }) => {
          syncCategoryToFirestore(category).catch(err => {
            console.error('Failed to sync category to Firestore:', err);
            // If sync fails, the category is still in local storage, so it's not lost
          });
        }).catch(err => {
          console.error('Failed to load sync module:', err);
        });
      }
      
      return category;
    },
    
    /**
     * Update an existing category
     */
    updateCategory: async (id: string, updates: Partial<Category>): Promise<boolean> => {
      let found = false;
      let updatedCategory: Category | null = null;
      
      update(categories => {
        return categories.map(cat => {
          if (cat.id === id) {
            found = true;
            updatedCategory = { ...cat, ...updates };
            return updatedCategory;
          }
          return cat;
        });
      });
      
      // Sync to Firestore if authenticated (using dynamic import to avoid circular dependency)
      if (found && updatedCategory && updatedCategory.userId) {
        import('$lib/firebase/sync').then(({ syncCategoryToFirestore }) => {
          syncCategoryToFirestore(updatedCategory!).catch(err => {
            console.error('Failed to sync category update to Firestore:', err);
          });
        });
      }
      
      return found;
    },
    
    /**
     * Delete a category
     */
    delete: async (id: string): Promise<boolean> => {
      const category = get({ subscribe }).find(cat => cat.id === id);
      const categoryUserId = category?.userId;
      
      let found = false;
      update(categories => {
        return categories.filter(cat => {
          if (cat.id === id) {
            found = true;
            return false;
          }
          return true;
        });
      });
      
      // Delete from Firestore if authenticated (using dynamic import to avoid circular dependency)
      if (found && categoryUserId) {
        import('$lib/firebase/sync').then(({ deleteCategoryFromFirestore }) => {
          deleteCategoryFromFirestore(id).catch(err => {
            console.error('Failed to delete category from Firestore:', err);
          });
        });
      }
      
      return found;
    },
    
    /**
     * Get category by ID
     */
    getById: (id: string): Category | undefined => {
      const categories = get({ subscribe });
      return categories.find(cat => cat.id === id);
    },
    
    /**
     * Get category by name
     */
    getByName: (name: string): Category | undefined => {
      const categories = get({ subscribe });
      return categories.find(cat => 
        cat.name.toLowerCase() === name.toLowerCase()
      );
    },
    
    /**
     * Reset to default categories
     */
    resetToDefaults: (): void => {
      set(SEED_CATEGORIES);
    },
    
    /**
     * Replace all categories (for import)
     */
    replaceAll: (newCategories: Category[]): void => {
      set(newCategories);
    }
  };
}

// Create the store
export const categories = createCategoriesStore();

// ============================================
// Derived Stores
// ============================================

// User categories (non-system)
export const userCategories = derived(categories, $categories =>
  $categories.filter(cat => cat.userId !== null)
);

// System categories
export const systemCategories = derived(categories, $categories =>
  $categories.filter(cat => cat.userId === null)
);

// Categories with budgets
export const categoriesWithBudgets = derived(categories, $categories =>
  $categories.filter(cat => cat.budget !== undefined && cat.budget > 0)
);

// Category count
export const categoryCount = derived(categories, $categories =>
  $categories.length
);

// Category map for quick lookups
export const categoryMap = derived(categories, $categories => {
  const map = new Map<string, Category>();
  $categories.forEach(cat => map.set(cat.id, cat));
  return map;
});

// ============================================
// Actions (for external use)
// ============================================

export const categoryActions = {
  add: categories.add,
  update: categories.updateCategory,
  delete: categories.delete,
  getById: categories.getById,
  getByName: categories.getByName,
  resetToDefaults: categories.resetToDefaults,
  init: categories.init
};
