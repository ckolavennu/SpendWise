import type { Category } from '$lib/types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
	{
		id: 'food',
		name: 'Food',
		type: 'expense',
		color: '#f97316',
		icon: 'utensils',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'transport',
		name: 'Transport',
		type: 'expense',
		color: '#3b82f6',
		icon: 'bus',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'shopping',
		name: 'Shopping',
		type: 'expense',
		color: '#ec4899',
		icon: 'shopping-bag',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'entertainment',
		name: 'Entertainment',
		type: 'expense',
		color: '#8b5cf6',
		icon: 'gamepad',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'subscriptions',
		name: 'Subscriptions',
		type: 'expense',
		color: '#14b8a6',
		icon: 'repeat',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'salary',
		name: 'Salary',
		type: 'income',
		color: '#22c55e',
		icon: 'wallet',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'allowance',
		name: 'Allowance',
		type: 'income',
		color: '#84cc16',
		icon: 'coins',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];
