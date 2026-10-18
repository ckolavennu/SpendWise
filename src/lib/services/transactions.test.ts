import { beforeEach, expect, it, vi } from 'vitest';
import { createTransaction, updateTransaction, subscribeToTransactions } from './transactions';
import { addDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import type { CreateTransactionInput } from '../types/finance';

vi.mock('$lib/firebase/client', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
	addDoc: vi.fn(),
	updateDoc: vi.fn(),
	deleteDoc: vi.fn(),
	getDocs: vi.fn(),
	onSnapshot: vi.fn(),
	collection: (...parts: unknown[]) => parts.slice(1).join('/'),
	doc: (...parts: unknown[]) => parts.slice(1).join('/'),
	orderBy: vi.fn(),
	query: (path: unknown) => path
}));
const valid: CreateTransactionInput = {
	type: 'expense',
	amount: 10.25,
	category: 'Food',
	paymentMethod: 'cash',
	note: '',
	transactionDate: '2026-10-18'
};
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);
});
it('creates a validated document under the authenticated user path', async () => {
	await createTransaction('user-1', valid);
	expect(addDoc).toHaveBeenCalledWith('users/user-1/transactions', {
		...valid,
		createdAt: expect.any(String),
		updatedAt: expect.any(String)
	});
});
it('validates full edits and preserves createdAt', async () => {
	await updateTransaction('user-1', 'tx-1', valid);
	expect(updateDoc).toHaveBeenCalledWith('users/user-1/transactions/tx-1', {
		...valid,
		updatedAt: expect.any(String)
	});
	await expect(
		updateTransaction('user-1', 'tx-1', { ...valid, amount: Infinity })
	).rejects.toThrow();
	expect(updateDoc).toHaveBeenCalledTimes(1);
});
it('never writes invalid entries or unavailable custom categories', async () => {
	await expect(createTransaction('user-1', { ...valid, category: 'Deleted' })).rejects.toThrow(
		/category/
	);
	await expect(
		createTransaction('user-1', { ...valid, transactionDate: '2026-02-30' })
	).rejects.toThrow(/date/);
	await expect(createTransaction('', valid)).rejects.toThrow(/log in/);
	expect(addDoc).not.toHaveBeenCalled();
});
it('propagates write failures to the form', async () => {
	vi.mocked(addDoc).mockRejectedValueOnce(new Error('permission-denied'));
	await expect(createTransaction('user-1', valid)).rejects.toThrow('permission-denied');
});
it('subscribes to the same user path and forwards listener errors', () => {
	const callback = vi.fn();
	const onError = vi.fn();
	subscribeToTransactions('user-1', callback, onError);
	expect(onSnapshot).toHaveBeenCalledWith(
		'users/user-1/transactions',
		expect.any(Function),
		onError
	);
});
