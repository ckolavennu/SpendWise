export type AppRoute = '/' | '/transactions' | '/budget';

export interface NavigationItem {
	label: string;
	href: AppRoute;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
	{
		label: 'Dashboard',
		href: '/'
	},
	{
		label: 'Transactions',
		href: '/transactions'
	},
	{
		label: 'Budget',
		href: '/budget'
	}
];
