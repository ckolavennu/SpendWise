import type { Transaction } from '$lib/types/finance';

export type BudgetHealthStatus = 'Healthy' | 'Warning' | 'Overspending';

export interface DashboardMetrics {
	totalIncome: number;
	totalExpenses: number;
	balance: number;
	monthlyExpenses: number;
	monthlyIncome: number;
	budgetHealth: BudgetHealthStatus;
}

export function getCurrentMonthKey(): string {
	return new Date().toISOString().slice(0, 7);
}

export function getMonthlyTransactions(transactions: Transaction[]): Transaction[] {
	const currentMonth = getCurrentMonthKey();

	return transactions.filter((transaction) => {
		return transaction.transactionDate.startsWith(currentMonth);
	});
}

export function calculateDashboardMetrics(
	transactions: Transaction[],
	monthlyBudget = 1200
): DashboardMetrics {
	const totalIncome = transactions
		.filter((transaction) => transaction.type === 'income')
		.reduce((sum, transaction) => sum + transaction.amount, 0);

	const totalExpenses = transactions
		.filter((transaction) => transaction.type === 'expense')
		.reduce((sum, transaction) => sum + transaction.amount, 0);

	const monthlyTransactions = getMonthlyTransactions(transactions);

	const monthlyIncome = monthlyTransactions
		.filter((transaction) => transaction.type === 'income')
		.reduce((sum, transaction) => sum + transaction.amount, 0);

	const monthlyExpenses = monthlyTransactions
		.filter((transaction) => transaction.type === 'expense')
		.reduce((sum, transaction) => sum + transaction.amount, 0);

	let budgetHealth: BudgetHealthStatus = 'Healthy';

	if (monthlyExpenses >= monthlyBudget) {
		budgetHealth = 'Overspending';
	} else if (monthlyExpenses >= monthlyBudget * 0.75) {
		budgetHealth = 'Warning';
	}

	return {
		totalIncome,
		totalExpenses,
		balance: totalIncome - totalExpenses,
		monthlyExpenses,
		monthlyIncome,
		budgetHealth
	};
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-MY', {
		style: 'currency',
		currency: 'MYR'
	}).format(value);
}