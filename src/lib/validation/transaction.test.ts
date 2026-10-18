import { describe, expect, it } from 'vitest';
import { localDate, validateTransaction } from './transaction';
import type { CreateTransactionInput } from '../types/finance';

export const valid: CreateTransactionInput = {
	type: 'expense',
	amount: 12.34,
	category: 'Food',
	paymentMethod: 'cash',
	note: ' lunch ',
	transactionDate: '2024-02-29'
};

describe('transaction validation', () => {
	it('normalizes a complete input and strips unrecognized fields', () => {
		expect(validateTransaction({ ...valid, id: 'injected' } as CreateTransactionInput, [])).toEqual(
			{ ...valid, note: 'lunch' }
		);
	});
	it.each([0, -1, NaN, Infinity, 1.001, 0.000000001, Number.MAX_SAFE_INTEGER, '12', null])(
		'rejects invalid amount %s',
		(amount) => {
			expect(() => validateTransaction({ ...valid, amount } as CreateTransactionInput, [])).toThrow(
				/amount/
			);
		}
	);
	it.each([
		'',
		'2025-02-29',
		'2024-02-30',
		'2026-13-01',
		'2026-1-01',
		'0000-01-01',
		'2026-10-18T00:00:00Z'
	])('rejects invalid date %s', (transactionDate) => {
		expect(() => validateTransaction({ ...valid, transactionDate }, [])).toThrow(/date/);
	});
	it('rejects unknown and type-incompatible categories', () => {
		for (const category of ['', 'Salary', 'Missing'])
			expect(() => validateTransaction({ ...valid, category }, [])).toThrow(/category/);
	});
	it('accepts compatible custom categories and both types', () => {
		const category = {
			id: 'custom',
			name: 'Rent',
			type: 'both' as const,
			createdAt: '',
			updatedAt: ''
		};
		expect(validateTransaction({ ...valid, category: 'Rent' }, [category]).category).toBe('Rent');
		expect(
			validateTransaction({ ...valid, type: 'income', category: 'Rent' }, [category]).type
		).toBe('income');
	});
	it('rejects invalid payment methods and types at runtime', () => {
		expect(() =>
			validateTransaction(
				{ ...valid, paymentMethod: 'crypto' } as unknown as CreateTransactionInput,
				[]
			)
		).toThrow(/payment/);
		expect(() =>
			validateTransaction({ ...valid, type: 'transfer' } as unknown as CreateTransactionInput, [])
		).toThrow(/income or expense/);
	});
	it('uses local calendar dates rather than UTC dates', () => {
		const date = new Date(2026, 9, 18, 0, 1);
		expect(localDate(date)).toBe('2026-10-18');
	});
});
