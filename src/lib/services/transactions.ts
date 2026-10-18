import { validateTransaction } from '$lib/validation/transaction';
import type { Category } from '$lib/types/category';
import { db } from '$lib/firebase/client';
import type { CreateTransactionInput, Transaction } from '$lib/types/finance';
import {
	addDoc,
	collection,
	deleteDoc,
	getDocs,
	doc,
	onSnapshot,
	orderBy,
	query,
	updateDoc,
	type Unsubscribe
} from 'firebase/firestore';

function requireDb() {
	if (!db) {
		throw new Error('Firestore is only available in the browser.');
	}

	return db;
}

function getTransactionsCollection(userId: string) {
	if (!userId.trim()) throw new Error('Please log in first.');
	return collection(requireDb(), 'users', userId, 'transactions');
}

async function validatedInput(userId: string, input: CreateTransactionInput) {
	// Re-read categories so stale UI state cannot authorize a deleted or incompatible category.
	if (!userId.trim()) throw new Error('Please log in first.');
	const snapshot = await getDocs(collection(requireDb(), 'users', userId, 'categories'));
	const categories = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Category);
	return validateTransaction(input, categories);
}

export async function createTransaction(
	userId: string,
	input: CreateTransactionInput
): Promise<void> {
	const validated = await validatedInput(userId, input);
	const now = new Date().toISOString();

	await addDoc(getTransactionsCollection(userId), {
		...validated,
		createdAt: now,
		updatedAt: now
	});
}

export function subscribeToTransactions(
	userId: string,
	callback: (transactions: Transaction[]) => void,
	onError?: (error: Error) => void
): Unsubscribe {
	const transactionsQuery = query(
		getTransactionsCollection(userId),
		orderBy('transactionDate', 'desc')
	);

	return onSnapshot(
		transactionsQuery,
		(snapshot) => {
			const transactions = snapshot.docs.map((document) => {
				const data = document.data();

				return {
					id: document.id,
					type: data.type,
					amount: data.amount,
					category: data.category,
					paymentMethod: data.paymentMethod,
					note: data.note,
					transactionDate: data.transactionDate,
					createdAt: data.createdAt,
					updatedAt: data.updatedAt
				} satisfies Transaction;
			});

			callback(transactions);
		},
		onError
	);
}

export async function updateTransaction(
	userId: string,
	transactionId: string,
	input: CreateTransactionInput
): Promise<void> {
	const validated = await validatedInput(userId, input);
	await updateDoc(doc(requireDb(), 'users', userId, 'transactions', transactionId), {
		...validated,
		updatedAt: new Date().toISOString()
	});
}

export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
	await deleteDoc(doc(requireDb(), 'users', userId, 'transactions', transactionId));
}
