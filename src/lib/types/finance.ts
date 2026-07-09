export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
	| 'cash'
	| 'card'
	| 'bank_transfer'
	| 'e_wallet'
	| 'other';

export type BudgetHealthStatus = 'healthy' | 'warning' | 'overspending';

export interface Category {
	id: string;
	name: string;
	type: TransactionType;
	color?: string;
	icon?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Transaction {
	id: string;
	type: TransactionType;
	amount: number;
	categoryId: string;
	paymentMethod: PaymentMethod;
	note?: string;
	transactionDate: string;
	createdAt: string;
	updatedAt: string;
}

export interface MonthlyBudget {
	id: string;
	month: number;
	year: number;
	totalBudget: number;
	createdAt: string;
	updatedAt: string;
}

export interface CategoryBudget {
	id: string;
	categoryId: string;
	month: number;
	year: number;
	limitAmount: number;
	createdAt: string;
	updatedAt: string;
}