import {
	collection,
	doc,
	getDoc,
	getDocs,
	setDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit,
	type DocumentData,
	type QueryConstraint,
	Timestamp,
	onSnapshot,
	type Unsubscribe,
	writeBatch,
	serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './config';
import type { Expense, Category, Budget } from '$lib/types';

/**
 * Helper function to ensure auth is ready before Firestore operations
 */
async function ensureAuth(): Promise<void> {
	if (!auth.currentUser) {
		// Wait for auth to initialize (max 5 seconds)
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				unsubscribe();
				reject(new Error('Auth initialization timeout'));
			}, 5000);
			
			const unsubscribe = auth.onAuthStateChanged((user) => {
				clearTimeout(timeout);
				unsubscribe();
				if (user) {
					resolve();
				} else {
					reject(new Error('No authenticated user'));
				}
			});
		});
	}
	
	if (!auth.currentUser) {
		throw new Error('No authenticated user - Firestore operations require authentication');
	}
}

// ============================================
// EXPENSES
// ============================================

/**
 * Create a new expense
 * If expense has an id, uses that ID. Otherwise generates a new one.
 */
export async function createExpense(expense: Expense | Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
	// Use provided ID or generate new one
	const expenseId = 'id' in expense ? expense.id : undefined;
	const expenseRef = expenseId ? doc(db, 'expenses', expenseId) : doc(collection(db, 'expenses'));
	
	const expenseData: Expense = 'id' in expense ? expense : {
		...expense,
		id: expenseRef.id,
		createdAt: new Date(),
		updatedAt: new Date()
	};
	
	// Prepare data for Firestore - filter out undefined values and convert dates
	// Ensure required fields are present and valid
	if (!expenseData.userId || !expenseData.categoryId || !expenseData.description) {
		throw new Error('Missing required fields: userId, categoryId, or description');
	}
	
	// Validate and normalize amount (must be a positive number)
	const amount = typeof expenseData.amount === 'number' 
		? expenseData.amount 
		: parseFloat(String(expenseData.amount));
	
	if (isNaN(amount) || amount <= 0) {
		throw new Error(`Invalid amount: ${expenseData.amount}`);
	}
	
	// Validate and normalize description (must be non-empty string)
	const description = String(expenseData.description).trim();
	if (!description || description.length === 0) {
		throw new Error('Description cannot be empty');
	}
	
	// Validate and normalize categoryId (must be non-empty string)
	const categoryId = String(expenseData.categoryId).trim();
	if (!categoryId || categoryId.length === 0) {
		throw new Error('CategoryId cannot be empty');
	}
	
	// Convert date to Timestamp
	let dateTimestamp: Timestamp;
	try {
		if (expenseData.date instanceof Date) {
			dateTimestamp = Timestamp.fromDate(expenseData.date);
		} else if (typeof expenseData.date === 'string') {
			dateTimestamp = Timestamp.fromDate(new Date(expenseData.date));
		} else {
			throw new Error('Invalid date format');
		}
	} catch (error) {
		dateTimestamp = Timestamp.fromDate(new Date());
	}
	
	const firestoreData: any = {
		userId: String(expenseData.userId),
		amount: amount,
		description: description,
		categoryId: categoryId,
		date: dateTimestamp,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	
	// Add optional fields only if they exist
	if (expenseData.merchant !== undefined && expenseData.merchant !== null) {
		firestoreData.merchant = String(expenseData.merchant);
	}
	if (expenseData.paymentMethod !== undefined && expenseData.paymentMethod !== null) {
		firestoreData.paymentMethod = String(expenseData.paymentMethod);
	}
	if (expenseData.notes !== undefined && expenseData.notes !== null) {
		firestoreData.notes = String(expenseData.notes);
	}
	if (expenseData.tags !== undefined && expenseData.tags !== null && Array.isArray(expenseData.tags)) {
		firestoreData.tags = expenseData.tags;
	}
	if (expenseData.receiptUrl !== undefined && expenseData.receiptUrl !== null) {
		firestoreData.receiptUrl = String(expenseData.receiptUrl);
	}
	if (expenseData.location !== undefined && expenseData.location !== null) {
		firestoreData.location = expenseData.location;
	}
	if (expenseData.isShared !== undefined && expenseData.isShared !== null) {
		firestoreData.isShared = Boolean(expenseData.isShared);
	}
	if (expenseData.sharedWith !== undefined && expenseData.sharedWith !== null && Array.isArray(expenseData.sharedWith)) {
		firestoreData.sharedWith = expenseData.sharedWith;
	}
	if (expenseData.shareable !== undefined && expenseData.shareable !== null) {
		firestoreData.shareable = Boolean(expenseData.shareable);
	}
	if (expenseData.shareableId !== undefined && expenseData.shareableId !== null) {
		firestoreData.shareableId = String(expenseData.shareableId);
	}
	if (expenseData.groupId !== undefined && expenseData.groupId !== null) {
		firestoreData.groupId = String(expenseData.groupId);
	}
	if (expenseData.splitType !== undefined && expenseData.splitType !== null) {
		firestoreData.splitType = String(expenseData.splitType);
	}
	if (expenseData.splits !== undefined && expenseData.splits !== null && typeof expenseData.splits === 'object') {
		firestoreData.splits = expenseData.splits;
	}
	
	// Validate data before sending
	const validationErrors: string[] = [];
	if (typeof firestoreData.userId !== 'string' || firestoreData.userId.length === 0) {
		validationErrors.push('userId must be a non-empty string');
	}
	if (typeof firestoreData.amount !== 'number' || firestoreData.amount <= 0) {
		validationErrors.push(`amount must be a positive number, got: ${firestoreData.amount} (${typeof firestoreData.amount})`);
	}
	if (typeof firestoreData.description !== 'string' || firestoreData.description.length === 0) {
		validationErrors.push(`description must be a non-empty string, got: "${firestoreData.description}" (${typeof firestoreData.description})`);
	}
	if (typeof firestoreData.categoryId !== 'string' || firestoreData.categoryId.length === 0) {
		validationErrors.push(`categoryId must be a non-empty string, got: "${firestoreData.categoryId}" (${typeof firestoreData.categoryId})`);
	}
	
	if (validationErrors.length > 0) {
		throw new Error('Data validation failed: ' + validationErrors.join(', '));
	}
	
	try {
		await ensureAuth();
		await setDoc(expenseRef, firestoreData);
	} catch (error: any) {
		if (error?.code === 'permission-denied') {
			console.error('Firestore write failed: permission denied');
		}
		throw error;
	}
	
	return expenseRef.id;
}

/**
 * Get expense by ID
 */
export async function getExpense(id: string): Promise<Expense | null> {
	const expenseRef = doc(db, 'expenses', id);
	
	// Check auth before reading
	const { auth } = await import('./config');
	if (!auth.currentUser) {
		console.warn('⚠️ No auth user when reading expense - this might fail');
	}
	
	try {
		const expenseSnap = await getDoc(expenseRef);
		if (!expenseSnap.exists()) {
			return null;
		}
		const data = convertFirestoreDoc(expenseSnap.data()) as Expense;
		return { ...data, id: data.id || expenseSnap.id };
	} catch (error: any) {
		if (error?.code === 'permission-denied') {
			return null;
		}
		throw error;
	}
}

/**
 * Get all expenses for a user
 */
export async function getExpenses(userId: string, constraints: QueryConstraint[] = []): Promise<Expense[]> {
	const expensesRef = collection(db, 'expenses');
	const q = query(
		expensesRef,
		where('userId', '==', userId),
		...constraints
	);
	
	const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((docSnap) => {
			const data = convertFirestoreDoc(docSnap.data()) as Expense;
			return { ...data, id: data.id || docSnap.id };
		});
}

/**
 * Subscribe to expenses for real-time updates
 */
export function subscribeToExpenses(
	userId: string,
	callback: (expenses: Expense[]) => void,
	constraints: QueryConstraint[] = []
): Unsubscribe {
	const expensesRef = collection(db, 'expenses');
	const q = query(
		expensesRef,
		where('userId', '==', userId),
		...constraints
	);
	
	return onSnapshot(q, (querySnapshot) => {
		const expenses = querySnapshot.docs.map((docSnap) => {
			const data = convertFirestoreDoc(docSnap.data()) as Expense;
			return { ...data, id: data.id || docSnap.id };
		});
		callback(expenses);
	});
}

/**
 * Update an expense
 */
export async function updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
	const expenseRef = doc(db, 'expenses', id);
	
	// Prepare update data - filter out undefined values
	const updateData: any = {
		updatedAt: serverTimestamp()
	};
	
	// Only include fields that are actually being updated
	if (updates.userId !== undefined) updateData.userId = String(updates.userId);
	if (updates.amount !== undefined) {
		const amount = typeof updates.amount === 'number' 
			? updates.amount 
			: parseFloat(String(updates.amount));
		if (!isNaN(amount) && amount > 0) {
			updateData.amount = amount;
		}
	}
	if (updates.description !== undefined) {
		const description = String(updates.description).trim();
		if (description && description.length > 0) {
			updateData.description = description;
		}
	}
	if (updates.categoryId !== undefined) {
		const categoryId = String(updates.categoryId).trim();
		if (categoryId && categoryId.length > 0) {
			updateData.categoryId = categoryId;
		}
	}
		if (updates.date !== undefined) {
			updateData.date = updates.date instanceof Date 
				? Timestamp.fromDate(updates.date) 
				: Timestamp.fromDate(new Date(updates.date));
		}
	if (updates.merchant !== undefined) updateData.merchant = updates.merchant;
	if (updates.paymentMethod !== undefined) updateData.paymentMethod = updates.paymentMethod;
	if (updates.notes !== undefined) updateData.notes = updates.notes;
	if (updates.tags !== undefined) updateData.tags = updates.tags;
	if (updates.receiptUrl !== undefined) updateData.receiptUrl = updates.receiptUrl;
	if (updates.location !== undefined) updateData.location = updates.location;
	if (updates.isShared !== undefined) updateData.isShared = updates.isShared;
	if (updates.sharedWith !== undefined) updateData.sharedWith = updates.sharedWith;
	if (updates.shareable !== undefined) updateData.shareable = updates.shareable;
	if (updates.shareableId !== undefined) updateData.shareableId = updates.shareableId;
	if (updates.groupId !== undefined) updateData.groupId = updates.groupId;
	if (updates.splitType !== undefined) updateData.splitType = updates.splitType;
	if (updates.splits !== undefined) updateData.splits = updates.splits;
	
	await updateDoc(expenseRef, updateData);
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<void> {
	const expenseRef = doc(db, 'expenses', id);
	await deleteDoc(expenseRef);
}

/**
 * Delete multiple expenses
 */
export async function deleteExpenses(ids: string[]): Promise<void> {
	const batch = writeBatch(db);
	
	ids.forEach((id) => {
		const expenseRef = doc(db, 'expenses', id);
		batch.delete(expenseRef);
	});
	
	await batch.commit();
}

// ============================================
// CATEGORIES
// ============================================

/**
 * Create a new category
 * If category has an id, uses that ID. Otherwise generates a new one.
 */
export async function createCategory(category: Category | Omit<Category, 'id' | 'createdAt'>): Promise<string> {
	// Use provided ID or generate new one
	const categoryId = 'id' in category ? category.id : undefined;
	const categoryRef = categoryId ? doc(db, 'categories', categoryId) : doc(collection(db, 'categories'));
	
	const categoryData: Category = 'id' in category ? category : {
		...category,
		id: categoryRef.id,
		createdAt: new Date()
	};
	
	// Validate required fields
	if (!categoryData.name || String(categoryData.name).trim().length === 0) {
		throw new Error('Category name cannot be empty');
	}
	
	// Ensure all required fields are included
	const dataToSave: any = {
		userId: categoryData.userId ?? null,
		name: String(categoryData.name).trim(), // Ensure it's a non-empty string
		icon: String(categoryData.icon || ''),
		color: String(categoryData.color || '#000000'),
		createdAt: serverTimestamp()
	};
	
	// Include optional fields if they exist
	if (categoryData.parentId !== undefined && categoryData.parentId !== null) {
		dataToSave.parentId = String(categoryData.parentId);
	}
	if (categoryData.budget !== undefined && categoryData.budget !== null) {
		const budget = typeof categoryData.budget === 'number' 
			? categoryData.budget 
			: parseFloat(String(categoryData.budget));
		if (!isNaN(budget) && budget > 0) {
			dataToSave.budget = budget;
		}
	}
	if (categoryData.budgetPeriod !== undefined && categoryData.budgetPeriod !== null) {
		dataToSave.budgetPeriod = String(categoryData.budgetPeriod);
	}
	
	try {
		await ensureAuth();
		await setDoc(categoryRef, dataToSave);
	} catch (error: any) {
		if (error?.code === 'permission-denied') {
			console.error('Firestore write failed: permission denied');
		}
		throw error;
	}
	
	return categoryRef.id;
}

/**
 * Get category by ID
 */
export async function getCategory(id: string): Promise<Category | null> {
	const categoryRef = doc(db, 'categories', id);
	const categorySnap = await getDoc(categoryRef);
	
	if (!categorySnap.exists()) {
		return null;
	}
	
	const data = convertFirestoreDoc(categorySnap.data()) as Category;
	// Ensure id is set (use document ID as fallback)
	return { ...data, id: data.id || categorySnap.id };
}

/**
 * Get all categories for a user
 */
export async function getCategories(userId: string | null, constraints: QueryConstraint[] = []): Promise<Category[]> {
	const categoriesRef = collection(db, 'categories');
	const q = query(
		categoriesRef,
		where('userId', '==', userId),
		...constraints
	);
	
	const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((docSnap) => {
			const data = convertFirestoreDoc(docSnap.data()) as Category;
			return { ...data, id: data.id || docSnap.id };
		});
}

/**
 * Subscribe to categories for real-time updates
 */
export function subscribeToCategories(
	userId: string | null,
	callback: (categories: Category[]) => void,
	constraints: QueryConstraint[] = []
): Unsubscribe {
	const categoriesRef = collection(db, 'categories');
	const q = query(
		categoriesRef,
		where('userId', '==', userId),
		...constraints
	);
	
	return onSnapshot(q, (querySnapshot) => {
		const categories = querySnapshot.docs.map((docSnap) => {
			const data = convertFirestoreDoc(docSnap.data()) as Category;
			return { ...data, id: data.id || docSnap.id };
		});
		callback(categories);
	});
}

/**
 * Update a category
 */
export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
	const categoryRef = doc(db, 'categories', id);
	await updateDoc(categoryRef, updates);
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
	const categoryRef = doc(db, 'categories', id);
	await deleteDoc(categoryRef);
}

// ============================================
// BUDGETS
// ============================================

/**
 * Create a new budget
 * If budget has an id, uses that ID. Otherwise generates a new one.
 */
export async function createBudget(budget: Budget | Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
	// Use provided ID or generate new one
	const budgetId = 'id' in budget ? budget.id : undefined;
	const budgetRef = budgetId ? doc(db, 'budgets', budgetId) : doc(collection(db, 'budgets'));
	
	const budgetData: Budget = 'id' in budget ? budget : {
		...budget,
		id: budgetRef.id,
		createdAt: new Date(),
		updatedAt: new Date()
	};
	
	// Validate required fields
	if (!budgetData.userId) {
		throw new Error('Budget userId is required');
	}
	if (!budgetData.amount || budgetData.amount <= 0) {
		throw new Error('Budget amount must be a positive number');
	}
	if (!budgetData.period || String(budgetData.period).trim().length === 0) {
		throw new Error('Budget period is required');
	}
	
	// Convert dates to Timestamps
	let startDateTimestamp: Timestamp;
	try {
		if (budgetData.startDate instanceof Date) {
			startDateTimestamp = Timestamp.fromDate(budgetData.startDate);
		} else if (typeof budgetData.startDate === 'string') {
			startDateTimestamp = Timestamp.fromDate(new Date(budgetData.startDate));
		} else {
			throw new Error('Invalid startDate format');
		}
	} catch (error) {
		startDateTimestamp = Timestamp.fromDate(new Date());
	}
	
	let endDateTimestamp: Timestamp | null = null;
	if (budgetData.endDate) {
		if (budgetData.endDate instanceof Date) {
			endDateTimestamp = Timestamp.fromDate(budgetData.endDate);
		} else if (typeof budgetData.endDate === 'string') {
			endDateTimestamp = Timestamp.fromDate(new Date(budgetData.endDate));
		}
	}
	
	const amount = typeof budgetData.amount === 'number' 
		? budgetData.amount 
		: parseFloat(String(budgetData.amount));
	
	const firestoreData: any = {
		userId: String(budgetData.userId),
		categoryId: budgetData.categoryId ? String(budgetData.categoryId) : null,
		amount: amount,
		period: String(budgetData.period).trim(),
		startDate: startDateTimestamp,
		endDate: endDateTimestamp,
		spent: typeof budgetData.spent === 'number' ? budgetData.spent : 0,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};
	
	try {
		await ensureAuth();
		await setDoc(budgetRef, firestoreData);
	} catch (error: any) {
		if (error?.code === 'permission-denied') {
			console.error('Firestore write failed: permission denied');
		}
		throw error;
	}
	
	return budgetRef.id;
}

/**
 * Get budget by ID
 */
export async function getBudget(id: string): Promise<Budget | null> {
	const budgetRef = doc(db, 'budgets', id);
	
	try {
		const budgetSnap = await getDoc(budgetRef);
		
		if (!budgetSnap.exists()) {
			return null;
		}
		
		const data = convertFirestoreDoc(budgetSnap.data()) as Budget;
		return { ...data, id: data.id || budgetSnap.id };
	} catch (error: any) {
		if (error?.code === 'permission-denied') {
			return null;
		}
		throw error;
	}
}

/**
 * Get all budgets for a user
 */
export async function getBudgets(userId: string, constraints: QueryConstraint[] = []): Promise<Budget[]> {
	const budgetsRef = collection(db, 'budgets');
	const q = query(
		budgetsRef,
		where('userId', '==', userId),
		...constraints
	);
	
	const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((docSnap) => {
			const data = convertFirestoreDoc(docSnap.data()) as Budget;
			return { ...data, id: data.id || docSnap.id };
		});
}

/**
 * Subscribe to budgets for real-time updates
 */
export function subscribeToBudgets(
	userId: string,
	callback: (budgets: Budget[]) => void,
	constraints: QueryConstraint[] = []
): Unsubscribe {
	const budgetsRef = collection(db, 'budgets');
	const q = query(
		budgetsRef,
		where('userId', '==', userId),
		...constraints
	);
	
	return onSnapshot(q, (querySnapshot) => {
		const budgets = querySnapshot.docs.map((docSnap) => {
			const data = convertFirestoreDoc(docSnap.data()) as Budget;
			return { ...data, id: data.id || docSnap.id };
		});
		callback(budgets);
	});
}

/**
 * Update a budget
 */
export async function updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
	const budgetRef = doc(db, 'budgets', id);
	
	const updateData: any = {
		...updates,
		updatedAt: serverTimestamp()
	};
	
	// Convert dates if provided
	if (updates.startDate) {
		updateData.startDate = updates.startDate instanceof Date 
			? Timestamp.fromDate(updates.startDate) 
			: Timestamp.fromDate(new Date(updates.startDate));
	}
	if (updates.endDate) {
		updateData.endDate = updates.endDate instanceof Date 
			? Timestamp.fromDate(updates.endDate) 
			: Timestamp.fromDate(new Date(updates.endDate));
	}
	
	await updateDoc(budgetRef, updateData);
}

/**
 * Delete a budget
 */
export async function deleteBudget(id: string): Promise<void> {
	const budgetRef = doc(db, 'budgets', id);
	await deleteDoc(budgetRef);
}

// ============================================
// USER PROFILES
// ============================================

export interface UserProfile {
	id: string;
	email: string;
	displayName?: string;
	currency?: string;
	dateFormat?: string;
	theme?: string;
	language?: string;
	createdAt: Date;
	lastLoginAt?: Date;
}

/**
 * Create or update user profile
 */
export async function setUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
	const profileRef = doc(db, 'users', userId);
	
	const profileData: any = {
		id: userId,
		...profile,
		updatedAt: serverTimestamp()
	};
	
	// Set createdAt only if creating new profile
	const existingDoc = await getDoc(profileRef);
	if (!existingDoc.exists()) {
		profileData.createdAt = serverTimestamp();
	}
	
	await setDoc(profileRef, profileData, { merge: true });
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
	const profileRef = doc(db, 'users', userId);
	const profileSnap = await getDoc(profileRef);
	
	if (!profileSnap.exists()) {
		return null;
	}
	
	return convertFirestoreDoc(profileSnap.data()) as UserProfile;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
function convertFirestoreDoc(data: DocumentData): any {
	if (!data || typeof data !== 'object') {
		return data;
	}
	
	const converted: any = { ...data };
	
	// Convert Timestamp fields to Date
	Object.keys(converted).forEach((key) => {
		const value = converted[key];
		if (value && typeof value === 'object' && 'toDate' in value) {
			// Firestore Timestamp
			converted[key] = (value as Timestamp).toDate();
		} else if (value && typeof value === 'object' && !Array.isArray(value)) {
			// Recursively convert nested objects
			converted[key] = convertFirestoreDoc(value);
		}
	});
	
	return converted;
}
