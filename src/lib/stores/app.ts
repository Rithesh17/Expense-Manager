// Expense Manager - App State Store

import { writable, derived } from 'svelte/store';
import type { AppState } from '$lib/types';
import { browser } from '$app/environment';
import { preferences, initializeTheme } from './preferences';
import { loadFromStorage } from '$lib/utils/storage';

// ============================================
// App State Store
// ============================================

const DEFAULT_STATE: AppState = {
  isOnline: true,
  isLoading: false,
  lastSyncAt: undefined,
  error: undefined
};

function createAppStateStore() {
  const { subscribe, set, update } = writable<AppState>(DEFAULT_STATE);
  
  return {
    subscribe,
    set,
    update,
    
    /**
     * Set loading state
     */
    setLoading: (isLoading: boolean): void => {
      update(state => ({ ...state, isLoading }));
    },
    
    /**
     * Set error
     */
    setError: (error: string | undefined): void => {
      update(state => ({ ...state, error }));
    },
    
    /**
     * Clear error
     */
    clearError: (): void => {
      update(state => ({ ...state, error: undefined }));
    },
    
    /**
     * Set online status
     */
    setOnline: (isOnline: boolean): void => {
      update(state => ({ ...state, isOnline }));
    },
    
    /**
     * Update last sync time
     */
    updateLastSync: (): void => {
      update(state => ({ 
        ...state, 
        lastSyncAt: new Date().toISOString() 
      }));
    }
  };
}

export const appState = createAppStateStore();

// ============================================
// Initialization
// ============================================

/**
 * Initialize all stores from storage
 */
export async function initializeStores(): Promise<void> {
  if (!browser) return;
  
  appState.setLoading(true);
  
  try {
    // Load data from storage
    const data = loadFromStorage();
    
    // Initialize each store (using dynamic imports to avoid SSR issues)
    const { expenses } = await import('./expenses');
    const { categories } = await import('./categories');
    const { budgets } = await import('./budgets');
    
    expenses.init();
    categories.init();
    budgets.init();
    preferences.init();
    
    // Initialize theme
    initializeTheme();
    
    // Set up online/offline listeners
    window.addEventListener('online', () => appState.setOnline(true));
    window.addEventListener('offline', () => appState.setOnline(false));
    
    // Set initial online state
    appState.setOnline(navigator.onLine);
    
    // Start Firestore sync if authenticated (only in browser)
    const { isAuthenticated } = await import('./auth');
    const { startFirestoreSync, stopFirestoreSync } = await import('$lib/firebase/sync');
    
    const unsubscribe = isAuthenticated.subscribe(async (authenticated) => {
      if (authenticated) {
        try {
          await startFirestoreSync();
          appState.updateLastSync();
        } catch (error) {
          console.error('Failed to start Firestore sync:', error);
        }
      } else {
        stopFirestoreSync();
      }
    });
    
    // Cleanup subscription on unmount (handled by Svelte)
    
    appState.updateLastSync();
  } catch (error) {
    console.error('Error initializing stores:', error);
    appState.setError('Failed to load data');
  } finally {
    appState.setLoading(false);
  }
}

// ============================================
// Derived Stores
// ============================================

// Is app ready (not loading)
export const isReady = derived(appState, $state => !$state.isLoading);

// Has error
export const hasError = derived(appState, $state => !!$state.error);

// ============================================
// Actions (for external use)
// ============================================

export const appActions = {
  init: initializeStores,
  setLoading: appState.setLoading,
  setError: appState.setError,
  clearError: appState.clearError
};
