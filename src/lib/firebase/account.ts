// Expense Manager - Account Management Functions

import { auth, db } from './config';
import { deleteUser, updateProfile, type User } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { browser } from '$app/environment';

/**
 * Update user display name
 */
export async function updateDisplayName(displayName: string): Promise<void> {
	if (!browser) return;
	
	const user = auth.currentUser;
	if (!user) {
		throw new Error('User not authenticated');
	}

	await updateProfile(user, { displayName });
	
	// Also update in Firestore user profile
	const { setUserProfile } = await import('./firestore');
	await setUserProfile(user.uid, { 
		displayName,
		email: user.email || undefined
	});
}

/**
 * Delete user account and all associated data from Firebase
 */
export async function deleteUserAccount(): Promise<void> {
	if (!browser) return;
	
	const user = auth.currentUser;
	if (!user) {
		throw new Error('User not authenticated');
	}

	const userId = user.uid;

	// Delete all user data from Firestore
	const batch = writeBatch(db);

	// Delete all expenses
	const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
	const expensesSnapshot = await getDocs(expensesQuery);
	expensesSnapshot.forEach((docSnapshot) => {
		batch.delete(docSnapshot.ref);
	});

	// Delete all categories
	const categoriesQuery = query(collection(db, 'categories'), where('userId', '==', userId));
	const categoriesSnapshot = await getDocs(categoriesQuery);
	categoriesSnapshot.forEach((docSnapshot) => {
		batch.delete(docSnapshot.ref);
	});

	// Delete all budgets
	const budgetsQuery = query(collection(db, 'budgets'), where('userId', '==', userId));
	const budgetsSnapshot = await getDocs(budgetsQuery);
	budgetsSnapshot.forEach((docSnapshot) => {
		batch.delete(docSnapshot.ref);
	});

	// Delete user profile
	const userProfileRef = doc(db, 'users', userId);
	batch.delete(userProfileRef);

	// Commit all deletions
	await batch.commit();

	// Delete the Firebase Auth account
	await deleteUser(user);
}

/**
 * Delete all user data from Firestore (but keep the account)
 */
export async function deleteAllUserData(): Promise<void> {
	if (!browser) return;
	
	const user = auth.currentUser;
	if (!user) {
		throw new Error('User not authenticated');
	}

	const userId = user.uid;

	// Delete all user data from Firestore
	const batch = writeBatch(db);

	// Delete all expenses
	const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
	const expensesSnapshot = await getDocs(expensesQuery);
	expensesSnapshot.forEach((docSnapshot) => {
		batch.delete(docSnapshot.ref);
	});

	// Delete all categories
	const categoriesQuery = query(collection(db, 'categories'), where('userId', '==', userId));
	const categoriesSnapshot = await getDocs(categoriesQuery);
	categoriesSnapshot.forEach((docSnapshot) => {
		batch.delete(docSnapshot.ref);
	});

	// Delete all budgets
	const budgetsQuery = query(collection(db, 'budgets'), where('userId', '==', userId));
	const budgetsSnapshot = await getDocs(budgetsQuery);
	budgetsSnapshot.forEach((docSnapshot) => {
		batch.delete(docSnapshot.ref);
	});

	// Commit all deletions
	await batch.commit();
}
