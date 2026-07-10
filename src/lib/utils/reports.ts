import type { Transaction } from '$lib/types/finance';

export interface MonthlyReportItem {
	month: string;
	income: number;
	expenses: number;
	net: number;
}

export interface ReportSummary {
	totalIncome: number;
	totalExpenses: number;
	netAmount: number;
	topExpenseCategory: string;
	topExpenseCategoryAmount: number;
	highestExpenseCategory: string;
	highestExpenseAmount: number;
	averageDailyExpense: number;
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-MY', {
		style: 'currency',
		currency: 'MYR'
	}).format(value);
}

function getMonthKey(date: string): string {
	return date.slice(0, 7);
}

function formatMonthLabel(monthKey: string): string {
	const [yearValue, monthValue] = monthKey.split('-');

	const year = Number(yearValue);
	const month = Number(monthValue);

	if (!yearValue || !monthValue || Number.isNaN(year) || Number.isNaN(month)) {
		return monthKey;
	}

	const date = new Date(year, month - 1);

	return new Intl.DateTimeFormat('en-MY', {
		month: 'short',
		year: 'numeric'
	}).format(date);
}

export function calculateMonthlyReport(transactions: Transaction[]): MonthlyReportItem[] {
	const monthlyMap = new Map<string, MonthlyReportItem>();

	for (const transaction of transactions) {
		const monthKey = getMonthKey(transaction.transactionDate);

		if (!monthlyMap.has(monthKey)) {
			monthlyMap.set(monthKey, {
				month: formatMonthLabel(monthKey),
				income: 0,
				expenses: 0,
				net: 0
			});
		}

		const item = monthlyMap.get(monthKey);

		if (!item) continue;

		if (transaction.type === 'income') {
			item.income += transaction.amount;
		} else {
			item.expenses += transaction.amount;
		}

		item.net = item.income - item.expenses;
	}

	return Array.from(monthlyMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, value]) => value);
}

export function calculateReportSummary(transactions: Transaction[]): ReportSummary {
	const totalIncome = transactions
		.filter((transaction) => transaction.type === 'income')
		.reduce((sum, transaction) => sum + transaction.amount, 0);

	const expenseTransactions = transactions.filter((transaction) => transaction.type === 'expense');

	const totalExpenses = expenseTransactions.reduce(
		(sum, transaction) => sum + transaction.amount,
		0
	);

	const categoryTotals = new Map<string, number>();

	for (const transaction of expenseTransactions) {
		const currentTotal = categoryTotals.get(transaction.category) ?? 0;
		categoryTotals.set(transaction.category, currentTotal + transaction.amount);
	}

	const topCategory = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1])[0];

	const highestExpense = expenseTransactions.sort((a, b) => b.amount - a.amount)[0];

	const currentMonthKey = new Date().toISOString().slice(0, 7);

	const currentMonthExpenses = expenseTransactions.filter((transaction) =>
		transaction.transactionDate.startsWith(currentMonthKey)
	);

	const daysPassedThisMonth = new Date().getDate();

	const currentMonthExpenseTotal = currentMonthExpenses.reduce(
		(sum, transaction) => sum + transaction.amount,
		0
	);

	return {
		totalIncome,
		totalExpenses,
		netAmount: totalIncome - totalExpenses,
		topExpenseCategory: topCategory?.[0] ?? 'None',
		topExpenseCategoryAmount: topCategory?.[1] ?? 0,
		highestExpenseCategory: highestExpense?.category ?? 'None',
		highestExpenseAmount: highestExpense?.amount ?? 0,
		averageDailyExpense:
			daysPassedThisMonth > 0 ? currentMonthExpenseTotal / daysPassedThisMonth : 0
	};
}