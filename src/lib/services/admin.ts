import { db } from '$lib/firebase/client';
import type { PaymentMethod, Transaction, TransactionType } from '$lib/types/finance';
import type { UserProfile, UserRole } from '$lib/types/user';
import { collectionGroup, onSnapshot, type Unsubscribe } from 'firebase/firestore';

export interface AdminTransaction extends Transaction {
	userId: string;
}

function requireDb() {
	if (!db) {
		throw new Error('Firestore is only available in the browser.');
	}

	return db;
}

function isUserRole(value: unknown): value is UserRole {
	return value === 'user' || value === 'superadmin';
}

function isTransactionType(value: unknown): value is TransactionType {
	return value === 'income' || value === 'expense';
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
	return (
		value === 'cash' ||
		value === 'card' ||
		value === 'bank_transfer' ||
		value === 'e_wallet' ||
		value === 'other'
	);
}

export function subscribeToAllUserProfiles(
	callback: (users: UserProfile[]) => void
): Unsubscribe {
	return onSnapshot(collectionGroup(requireDb(), 'profile'), (snapshot) => {
		const users = snapshot.docs.map((document) => {
			const data = document.data();
			const userId = document.ref.parent.parent?.id ?? String(data.uid ?? document.id);

			return {
				uid: String(data.uid ?? userId),
				email: String(data.email ?? ''),
				displayName: String(data.displayName ?? ''),
				role: isUserRole(data.role) ? data.role : 'user',
				createdAt: String(data.createdAt ?? ''),
				updatedAt: String(data.updatedAt ?? '')
			} satisfies UserProfile;
		});

		callback(users.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
	});
}

export function subscribeToAllTransactions(
	callback: (transactions: AdminTransaction[]) => void
): Unsubscribe {
	return onSnapshot(collectionGroup(requireDb(), 'transactions'), (snapshot) => {
		const transactions = snapshot.docs.map((document) => {
			const data = document.data();
			const userId = document.ref.parent.parent?.id ?? '';

			return {
				id: document.id,
				userId,
				type: isTransactionType(data.type) ? data.type : 'expense',
				amount: Number(data.amount ?? 0),
				category: String(data.category ?? ''),
				paymentMethod: isPaymentMethod(data.paymentMethod) ? data.paymentMethod : 'other',
				note: String(data.note ?? ''),
				transactionDate: String(data.transactionDate ?? ''),
				createdAt: String(data.createdAt ?? ''),
				updatedAt: String(data.updatedAt ?? '')
			} satisfies AdminTransaction;
		});

		callback(transactions.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)));
	});
}