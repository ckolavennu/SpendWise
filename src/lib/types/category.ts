import type { TransactionType } from '$lib/types/finance';

export type CategoryType = TransactionType | 'both';

export interface Category {
	id: string;
	name: string;
	type: CategoryType;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCategoryInput {
	name: string;
	type: CategoryType;
}

const DEFAULT_TIMESTAMP = 'default';

export const DEFAULT_CATEGORIES: Category[] = [
	{
		id: 'default-food',
		name: 'Food',
		type: 'expense',
		createdAt: DEFAULT_TIMESTAMP,
		updatedAt: DEFAULT_TIMESTAMP
	},
	{
		id: 'default-transport',
		name: 'Transport',
		type: 'expense',
		createdAt: DEFAULT_TIMESTAMP,
		updatedAt: DEFAULT_TIMESTAMP
	},
	{
		id: 'default-shopping',
		name: 'Shopping',
		type: 'expense',
		createdAt: DEFAULT_TIMESTAMP,
		updatedAt: DEFAULT_TIMESTAMP
	},
	{
		id: 'default-entertainment',
		name: 'Entertainment',
		type: 'expense',
		createdAt: DEFAULT_TIMESTAMP,
		updatedAt: DEFAULT_TIMESTAMP
	},
	{
		id: 'default-subscriptions',
		name: 'Subscriptions',
		type: 'expense',
		createdAt: DEFAULT_TIMESTAMP,
		updatedAt: DEFAULT_TIMESTAMP
	},
	{
		id: 'default-salary',
		name: 'Salary',
		type: 'income',
		createdAt: DEFAULT_TIMESTAMP,
		updatedAt: DEFAULT_TIMESTAMP
	},
	{
		id: 'default-allowance',
		name: 'Allowance',
		type: 'income',
		createdAt: DEFAULT_TIMESTAMP,
		updatedAt: DEFAULT_TIMESTAMP
	},
	{
		id: 'default-other',
		name: 'Other',
		type: 'both',
		createdAt: DEFAULT_TIMESTAMP,
		updatedAt: DEFAULT_TIMESTAMP
	}
];

function normalizeCategoryName(name: string): string {
	return name.trim().toLowerCase();
}

export function isCategoryAvailableForTransaction(
	category: Category,
	transactionType: TransactionType
): boolean {
	return category.type === 'both' || category.type === transactionType;
}

export function getMergedCategories(customCategories: Category[]): Category[] {
	const categoryMap = new Map<string, Category>();

	for (const category of DEFAULT_CATEGORIES) {
		categoryMap.set(normalizeCategoryName(category.name), category);
	}

	for (const category of customCategories) {
		const key = normalizeCategoryName(category.name);

		if (!key || categoryMap.has(key)) {
			continue;
		}

		categoryMap.set(key, category);
	}

	return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getAvailableCategories(
	customCategories: Category[],
	transactionType: TransactionType
): Category[] {
	return getMergedCategories(customCategories).filter((category) =>
		isCategoryAvailableForTransaction(category, transactionType)
	);
}