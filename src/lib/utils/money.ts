export function formatCurrency(amount: number, currency = 'MYR'): string {
	return new Intl.NumberFormat('en-MY', {
		style: 'currency',
		currency
	}).format(amount);
}

export function calculateRemainingBudget(totalBudget: number, totalSpent: number): number {
	return totalBudget - totalSpent;
}

export function calculateSpentPercentage(totalBudget: number, totalSpent: number): number {
	if (totalBudget <= 0) return 0;

	return Math.round((totalSpent / totalBudget) * 100);
}
