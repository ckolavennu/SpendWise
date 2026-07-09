export type AppRoute = '/' | '/login' | '/transactions';

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
	}
];