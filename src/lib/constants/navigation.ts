export type AppRoute = '/' | '/transactions' | '/budget' | '/reports' | '/categories';

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
	},
	{
		label: 'Reports',
		href: '/reports'
	},
	{
		label: 'Categories',
		href: '/categories'
	}
];