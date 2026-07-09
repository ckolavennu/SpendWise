import { db } from '$lib/firebase/client';
import type { CreateTransactionInput, Transaction } from '$lib/types/finance';
import {
	addDoc,
	collection,
	deleteDoc,
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
	return collection(requireDb(), 'users', userId, 'transactions');
}

export async function createTransaction(
	userId: string,
	input: CreateTransactionInput
): Promise<void> {
	const now = new Date().toISOString();

	await addDoc(getTransactionsCollection(userId), {
		...input,
		amount: Number(input.amount),
		createdAt: now,
		updatedAt: now
	});
}

export function subscribeToTransactions(
	userId: string,
	callback: (transactions: Transaction[]) => void
): Unsubscribe {
	const transactionsQuery = query(
		getTransactionsCollection(userId),
		orderBy('transactionDate', 'desc')
	);

	return onSnapshot(transactionsQuery, (snapshot) => {
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
	});
}

export async function updateTransaction(
	userId: string,
	transactionId: string,
	input: Partial<CreateTransactionInput>
): Promise<void> {
	await updateDoc(doc(requireDb(), 'users', userId, 'transactions', transactionId), {
		...input,
		updatedAt: new Date().toISOString()
	});
}

export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
	await deleteDoc(doc(requireDb(), 'users', userId, 'transactions', transactionId));
}