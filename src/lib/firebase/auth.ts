import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	sendPasswordResetEmail,
	updateProfile,
	type User,
	type UserCredential
} from 'firebase/auth';
import { auth } from './config';

export interface AuthError {
	code: string;
	message: string;
}

/**
 * Register a new user with email and password
 */
export async function registerUser(
	email: string,
	password: string,
	displayName?: string
): Promise<UserCredential> {
	try {
		const userCredential = await createUserWithEmailAndPassword(auth, email, password);
		
		// Update display name if provided
		if (displayName && userCredential.user) {
			await updateProfile(userCredential.user, { displayName });
		}
		
		return userCredential;
	} catch (error: any) {
		const authError: AuthError = {
			code: error.code || 'auth/unknown-error',
			message: getAuthErrorMessage(error.code)
		};
		throw authError;
	}
}

/**
 * Sign in with email and password
 */
export async function loginUser(email: string, password: string): Promise<UserCredential> {
	try {
		return await signInWithEmailAndPassword(auth, email, password);
	} catch (error: any) {
		const authError: AuthError = {
			code: error.code || 'auth/unknown-error',
			message: getAuthErrorMessage(error.code)
		};
		throw authError;
	}
}

/**
 * Sign out the current user
 */
export async function logoutUser(): Promise<void> {
	try {
		await signOut(auth);
	} catch (error: any) {
		const authError: AuthError = {
			code: error.code || 'auth/unknown-error',
			message: getAuthErrorMessage(error.code)
		};
		throw authError;
	}
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
	try {
		await sendPasswordResetEmail(auth, email);
	} catch (error: any) {
		const authError: AuthError = {
			code: error.code || 'auth/unknown-error',
			message: getAuthErrorMessage(error.code)
		};
		throw authError;
	}
}

/**
 * Sign in with Google
 */
export async function loginWithGoogle(): Promise<UserCredential> {
	try {
		const provider = new GoogleAuthProvider();
		// Request additional scopes if needed
		provider.addScope('profile');
		provider.addScope('email');
		
		return await signInWithPopup(auth, provider);
	} catch (error: any) {
		const authError: AuthError = {
			code: error.code || 'auth/unknown-error',
			message: getAuthErrorMessage(error.code)
		};
		throw authError;
	}
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
	return auth.currentUser;
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(code: string): string {
	const errorMessages: Record<string, string> = {
		'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
		'auth/invalid-email': 'Please enter a valid email address.',
		'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
		'auth/weak-password': 'Password should be at least 6 characters long.',
		'auth/user-disabled': 'This account has been disabled.',
		'auth/user-not-found': 'No account found with this email address.',
		'auth/wrong-password': 'Incorrect password. Please try again.',
		'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
		'auth/network-request-failed': 'Network error. Please check your connection.',
		'auth/invalid-credential': 'Invalid email or password.',
		'auth/requires-recent-login': 'Please sign out and sign in again to complete this action.',
		'auth/popup-closed-by-user': 'Sign-in popup was closed.',
		'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups for this site.',
		'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.'
	};

	return errorMessages[code] || 'An error occurred. Please try again.';
}
