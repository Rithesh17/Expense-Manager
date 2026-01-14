// Expense Manager - Authentication Store

import { writable, derived, get } from 'svelte/store';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, loginUser, registerUser, logoutUser, resetPassword, type AuthError } from '$lib/firebase';
import { browser } from '$app/environment';

// ============================================
// Store Creation
// ============================================

interface AuthState {
	user: User | null;
	loading: boolean;
	error: string | null;
}

function createAuthStore() {
	const initialState: AuthState = {
		user: null,
		loading: true,
		error: null
	};

	const { subscribe, set, update } = writable<AuthState>(initialState);

	// Initialize auth state listener
	if (browser) {
		// Set a timeout to ensure loading doesn't stay true forever
		const loadingTimeout = setTimeout(() => {
			update((state) => {
				if (state.loading) {
					console.warn('Auth loading timeout - setting loading to false');
					return { ...state, loading: false };
				}
				return state;
			});
		}, 2000); // 2 second timeout

		try {
			const unsubscribe = onAuthStateChanged(auth, (user) => {
				clearTimeout(loadingTimeout);
				update((state) => ({
					...state,
					user,
					loading: false,
					error: null
				}));
			}, (error) => {
				// Handle auth initialization errors
				clearTimeout(loadingTimeout);
				console.error('Auth state change error:', error);
				update((state) => ({
					...state,
					loading: false,
					error: error.message
				}));
			});
		} catch (error) {
			// If Firebase auth fails to initialize, set loading to false
			clearTimeout(loadingTimeout);
			console.error('Failed to initialize auth listener:', error);
			update((state) => ({
				...state,
				loading: false,
				error: 'Failed to initialize authentication'
			}));
		}
	} else {
		// In SSR, set loading to false immediately
		update((state) => ({
			...state,
			loading: false
		}));
	}

	return {
		subscribe,
		set,
		update,

		/**
		 * Register a new user
		 */
		register: async (email: string, password: string, displayName?: string): Promise<void> => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				await registerUser(email, password, displayName);
				// Auth state will update automatically via onAuthStateChanged
			} catch (error) {
				const authError = error as AuthError;
				update((state) => ({
					...state,
					loading: false,
					error: authError.message
				}));
				throw error;
			}
		},

		/**
		 * Login with email and password
		 */
		login: async (email: string, password: string): Promise<void> => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				await loginUser(email, password);
				// Auth state will update automatically via onAuthStateChanged
			} catch (error) {
				const authError = error as AuthError;
				update((state) => ({
					...state,
					loading: false,
					error: authError.message
				}));
				throw error;
			}
		},

		/**
		 * Login with Google
		 */
		loginWithGoogle: async (): Promise<void> => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				const { loginWithGoogle } = await import('$lib/firebase/auth');
				await loginWithGoogle();
				// Auth state will update automatically via onAuthStateChanged
			} catch (error) {
				const authError = error as AuthError;
				update((state) => ({
					...state,
					loading: false,
					error: authError.message
				}));
				throw error;
			}
		},

		/**
		 * Logout current user
		 */
		logout: async (): Promise<void> => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				await logoutUser();
				// Auth state will update automatically via onAuthStateChanged
			} catch (error) {
				const authError = error as AuthError;
				update((state) => ({
					...state,
					loading: false,
					error: authError.message
				}));
				throw error;
			}
		},

		/**
		 * Send password reset email
		 */
		resetPassword: async (email: string): Promise<void> => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				await resetPassword(email);
				update((state) => ({ ...state, loading: false }));
			} catch (error) {
				const authError = error as AuthError;
				update((state) => ({
					...state,
					loading: false,
					error: authError.message
				}));
				throw error;
			}
		},

		/**
		 * Clear error message
		 */
		clearError: () => {
			update((state) => ({ ...state, error: null }));
		}
	};
}

export const authStore = createAuthStore();

// ============================================
// Derived Stores
// ============================================

/**
 * Current authenticated user
 */
export const currentUser = derived(authStore, ($auth) => $auth.user);

/**
 * User ID (null if not authenticated)
 */
export const userId = derived(authStore, ($auth) => $auth.user?.uid ?? null);

/**
 * Whether user is authenticated
 */
export const isAuthenticated = derived(authStore, ($auth) => !!$auth.user);

/**
 * Whether auth is still loading
 */
export const authLoading = derived(authStore, ($auth) => $auth.loading);

/**
 * Current auth error
 */
export const authError = derived(authStore, ($auth) => $auth.error);

// ============================================
// Actions
// ============================================

export const authActions = {
	register: (email: string, password: string, displayName?: string) =>
		authStore.register(email, password, displayName),
	login: (email: string, password: string) => authStore.login(email, password),
	loginWithGoogle: () => authStore.loginWithGoogle(),
	logout: () => authStore.logout(),
	resetPassword: (email: string) => authStore.resetPassword(email),
	clearError: () => authStore.clearError()
};
