import type { Transaction } from '$lib/types/finance';

export interface CategoryBreakdownItem {
	category: string;
	total: number;
}

export function calculateExpenseCategoryBreakdown(
	transactions: Transaction[]
): CategoryBreakdownItem[] {
	const totals = new Map<string, number>();

	for (const transaction of transactions) {
		if (transaction.type !== 'expense') continue;

		const currentTotal = totals.get(transaction.category) ?? 0;
		totals.set(transaction.category, currentTotal + transaction.amount);
	}

	return Array.from(totals.entries())
		.map(([category, total]) => ({
			category,
			total
		}))
		.sort((a, b) => b.total - a.total);
}
