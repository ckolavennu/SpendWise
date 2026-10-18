import type { Category } from '../types/category';
import { getAvailableCategories } from '../types/category';
import type { CreateTransactionInput } from '../types/finance';

export function localDate(date = new Date()): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Also used by the persistence boundary: TypeScript types do not validate runtime input.
export function validateTransaction(
	input: CreateTransactionInput,
	customCategories: Category[]
): CreateTransactionInput {
	if (input.type !== 'income' && input.type !== 'expense') {
		throw new Error('Choose income or expense.');
	}
	if (
		typeof input.amount !== 'number' ||
		!Number.isFinite(input.amount) ||
		input.amount <= 0 ||
		input.amount > Number.MAX_SAFE_INTEGER / 100 ||
		!/^\d+(\.\d{1,2})?$/.test(String(input.amount))
	) {
		throw new Error('Enter a positive amount with at most two decimal places.');
	}
	const category = getAvailableCategories(customCategories, input.type).find(
		(item) => item.name === input.category
	);
	if (!category) throw new Error('Choose an available category for this transaction type.');
	if (!['cash', 'card', 'bank_transfer', 'e_wallet', 'other'].includes(input.paymentMethod)) {
		throw new Error('Choose a valid payment method.');
	}
	if (
		typeof input.transactionDate !== 'string' ||
		!/^\d{4}-\d{2}-\d{2}$/.test(input.transactionDate) ||
		input.transactionDate < '0001-01-01' ||
		!Number.isFinite(Date.parse(`${input.transactionDate}T00:00:00Z`)) ||
		new Date(`${input.transactionDate}T00:00:00Z`).toISOString().slice(0, 10) !==
			input.transactionDate
	) {
		throw new Error('Enter a valid date in YYYY-MM-DD format.');
	}
	if (typeof input.note !== 'string') throw new Error('Note must be text.');
	return {
		type: input.type,
		amount: Math.round(input.amount * 100) / 100,
		category: category.name,
		paymentMethod: input.paymentMethod,
		note: input.note.trim(),
		transactionDate: input.transactionDate
	};
}
