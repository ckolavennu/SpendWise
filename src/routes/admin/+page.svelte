<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		subscribeToAllTransactions,
		subscribeToAllUserProfiles,
		updateUserRole,
		type AdminTransaction
	} from '$lib/services/admin';
	import { currentUser } from '$lib/stores/auth';
	import { isSuperAdmin, userProfileLoading } from '$lib/stores/profile';
	import type { UserProfile, UserRole } from '$lib/types/user';

	interface UserMetric {
		user: UserProfile;
		transactionCount: number;
		income: number;
		expenses: number;
		net: number;
		lastActivity: string;
	}

	interface CategoryMetric {
		category: string;
		amount: number;
		transactionCount: number;
	}

	let users = $state<UserProfile[]>([]);
	let transactions = $state<AdminTransaction[]>([]);
	let roleUpdatingUserId = $state<string | null>(null);
	let message = $state('');

	$effect(() => {
		if (!$currentUser || !$isSuperAdmin) {
			users = [];
			transactions = [];
			return;
		}

		const unsubscribeUsers = subscribeToAllUserProfiles((items) => {
			users = items;
		});

		const unsubscribeTransactions = subscribeToAllTransactions((items) => {
			transactions = items;
		});

		return () => {
			unsubscribeUsers();
			unsubscribeTransactions();
		};
	});

	const totalUsers = $derived(users.length);
	const standardUsers = $derived(users.filter((user) => user.role === 'user').length);
	const totalSuperAdmins = $derived(users.filter((user) => user.role === 'superadmin').length);

	const activeUsers = $derived(
		users.filter((user) => transactions.some((transaction) => transaction.userId === user.uid)).length
	);

	const totalIncome = $derived(
		transactions
			.filter((transaction) => transaction.type === 'income')
			.reduce((sum, transaction) => sum + transaction.amount, 0)
	);

	const totalExpenses = $derived(
		transactions
			.filter((transaction) => transaction.type === 'expense')
			.reduce((sum, transaction) => sum + transaction.amount, 0)
	);

	const netAmount = $derived(totalIncome - totalExpenses);

	const averageTransactionsPerUser = $derived(
		totalUsers > 0 ? transactions.length / totalUsers : 0
	);

	const activeUserRate = $derived(totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0);

	const recentUsers = $derived(users.slice(0, 5));
	const recentTransactions = $derived(transactions.slice(0, 8));

	const userMetrics = $derived(calculateUserMetrics(users, transactions));
	const topExpenseCategories = $derived(calculateTopExpenseCategories(transactions));

	function calculateUserMetrics(
		profiles: UserProfile[],
		allTransactions: AdminTransaction[]
	): UserMetric[] {
		return profiles
			.map((user) => {
				const userTransactions = allTransactions.filter(
					(transaction) => transaction.userId === user.uid
				);

				const income = userTransactions
					.filter((transaction) => transaction.type === 'income')
					.reduce((sum, transaction) => sum + transaction.amount, 0);

				const expenses = userTransactions
					.filter((transaction) => transaction.type === 'expense')
					.reduce((sum, transaction) => sum + transaction.amount, 0);

				const latestTransaction = userTransactions
					.slice()
					.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

				return {
					user,
					transactionCount: userTransactions.length,
					income,
					expenses,
					net: income - expenses,
					lastActivity: latestTransaction?.createdAt || user.updatedAt || user.createdAt
				};
			})
			.sort((a, b) => b.transactionCount - a.transactionCount);
	}

	function calculateTopExpenseCategories(items: AdminTransaction[]): CategoryMetric[] {
		const categoryMap = new Map<string, CategoryMetric>();

		for (const transaction of items) {
			if (transaction.type !== 'expense') continue;

			const categoryName = transaction.category || 'Uncategorized';
			const current = categoryMap.get(categoryName) ?? {
				category: categoryName,
				amount: 0,
				transactionCount: 0
			};

			categoryMap.set(categoryName, {
				category: categoryName,
				amount: current.amount + transaction.amount,
				transactionCount: current.transactionCount + 1
			});
		}

		return Array.from(categoryMap.values())
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 5);
	}

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-MY', {
			style: 'currency',
			currency: 'MYR'
		}).format(value);
	}

	function formatNumber(value: number): string {
		return new Intl.NumberFormat('en-MY', {
			maximumFractionDigits: 1
		}).format(value);
	}

	function formatDateTime(dateValue: string): string {
		if (!dateValue) {
			return 'No activity';
		}

		const date = new Date(dateValue);

		if (Number.isNaN(date.getTime())) {
			return dateValue;
		}

		return new Intl.DateTimeFormat('en-MY', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function formatTransactionDate(dateValue: string): string {
		const date = new Date(`${dateValue}T00:00:00`);

		if (Number.isNaN(date.getTime())) {
			return dateValue || 'Unknown date';
		}

		return new Intl.DateTimeFormat('en-MY', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(date);
	}

	function getUserEmail(userId: string): string {
		return users.find((user) => user.uid === userId)?.email ?? userId;
	}

	function parseUserRole(value: string): UserRole {
		return value === 'superadmin' ? 'superadmin' : 'user';
	}

	async function handleRoleChange(userId: string, role: UserRole) {
		if (!$currentUser || !$isSuperAdmin) return;

		if (userId === $currentUser.uid && role !== 'superadmin') {
			message = 'You cannot remove your own superadmin role from this dashboard.';
			return;
		}

		roleUpdatingUserId = userId;
		message = '';

		try {
			await updateUserRole(userId, role);
			message = 'User role updated successfully.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Failed to update user role.';
		} finally {
			roleUpdatingUserId = null;
		}
	}
</script>

<svelte:head>
	<title>Superadmin | SpendWise</title>
</svelte:head>

<main class="min-h-screen px-4 py-8 text-foreground sm:px-6 lg:px-8">
	<section class="mx-auto max-w-7xl space-y-8">
		<div
			class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-500/10 via-card/70 to-emerald-500/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"
		>
			<div class="absolute right-[-4rem] top-[-4rem] h-72 w-72 rounded-full bg-amber-400/10 blur-3xl"></div>
			<div class="absolute bottom-[-5rem] left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"></div>

			<div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div class="space-y-4">
					<div class="flex flex-wrap items-center gap-3">
						<Badge class="border border-amber-500/30 bg-amber-500/10 text-amber-300">
							Superadmin Console
						</Badge>

						<Badge variant="secondary">Platform metrics and users</Badge>
					</div>

					<div>
						<h1 class="text-4xl font-black tracking-tight sm:text-5xl">
							SpendWise platform overview.
						</h1>

						<p class="mt-3 max-w-2xl text-muted-foreground">
							Monitor users, activity, platform-wide transaction records, and role access from one
							admin dashboard.
						</p>
					</div>
				</div>

				<div class="flex flex-wrap gap-3">
					<a href={resolve('/')}>
						<Button variant="secondary">Dashboard</Button>
					</a>

					<a href={resolve('/transactions')}>
						<Button>Transactions</Button>
					</a>
				</div>
			</div>
		</div>

		{#if !$currentUser}
			<Card.Root class="border-white/10 bg-card/80 shadow-xl backdrop-blur">
				<Card.Header>
					<Card.Title>Please log in first</Card.Title>
					<Card.Description>You need to sign in before accessing this page.</Card.Description>
				</Card.Header>

				<Card.Content>
					<a href={resolve('/login')}>
						<Button>Go to Login</Button>
					</a>
				</Card.Content>
			</Card.Root>
		{:else if $userProfileLoading}
			<Card.Root class="border-white/10 bg-card/80 shadow-xl backdrop-blur">
				<Card.Header>
					<Card.Title>Checking access...</Card.Title>
					<Card.Description>Please wait while we verify your role.</Card.Description>
				</Card.Header>
			</Card.Root>
		{:else if !$isSuperAdmin}
			<Card.Root class="border-red-500/20 bg-red-500/10 shadow-xl backdrop-blur">
				<Card.Header>
					<Card.Title>Access restricted</Card.Title>
					<Card.Description>
						This dashboard is only available to superadmin users.
					</Card.Description>
				</Card.Header>

				<Card.Content>
					<a href={resolve('/')}>
						<Button variant="secondary">Back to Dashboard</Button>
					</a>
				</Card.Content>
			</Card.Root>
		{:else}
			{#if message}
				<div class="rounded-2xl border border-white/10 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-xl backdrop-blur">
					{message}
				</div>
			{/if}

			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Total Users</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black">{totalUsers}</p>
						<p class="mt-2 text-sm text-muted-foreground">{standardUsers} standard users</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Active Users</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black text-emerald-400">{activeUsers}</p>
						<p class="mt-2 text-sm text-muted-foreground">
							{activeUserRate.toFixed(0)}% with transactions
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Superadmins</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black text-amber-300">{totalSuperAdmins}</p>
						<p class="mt-2 text-sm text-muted-foreground">Privileged accounts</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Transactions</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black">{transactions.length}</p>
						<p class="mt-2 text-sm text-muted-foreground">
							{formatNumber(averageTransactionsPerUser)} avg/user
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Platform Net</Card.Title>
					</Card.Header>

					<Card.Content>
						<p
							class={netAmount >= 0
								? 'text-2xl font-black text-emerald-400'
								: 'text-2xl font-black text-red-400'}
						>
							{formatCurrency(netAmount)}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">Income minus expenses</p>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="grid gap-6 xl:grid-cols-[1fr_430px]">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title>User Metrics</Card.Title>
						<Card.Description>
							User-level activity, financial totals, and role access.
						</Card.Description>
					</Card.Header>

					<Card.Content>
						{#if userMetrics.length === 0}
							<div class="rounded-2xl border border-dashed border-white/10 p-10 text-center">
								<p class="font-semibold">No users found</p>
							</div>
						{:else}
							<div class="overflow-x-auto">
								<table class="w-full min-w-[920px] text-left text-sm">
									<thead class="text-muted-foreground">
										<tr class="border-b border-white/10">
											<th class="px-4 py-3 font-medium">User</th>
											<th class="px-4 py-3 font-medium">Role</th>
											<th class="px-4 py-3 font-medium">Transactions</th>
											<th class="px-4 py-3 font-medium">Income</th>
											<th class="px-4 py-3 font-medium">Expenses</th>
											<th class="px-4 py-3 font-medium">Net</th>
											<th class="px-4 py-3 font-medium">Last Activity</th>
										</tr>
									</thead>

									<tbody>
										{#each userMetrics as item (item.user.uid)}
											<tr class="border-b border-white/10">
												<td class="px-4 py-4">
													<p class="font-medium">{item.user.email || 'No email'}</p>
													<p class="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
														{item.user.displayName || item.user.uid}
													</p>
												</td>

												<td class="px-4 py-4">
													<select
														value={item.user.role}
														disabled={roleUpdatingUserId === item.user.uid}
														class="rounded-md border border-white/10 bg-background/60 px-3 py-2 text-xs"
														onchange={(event) =>
															handleRoleChange(
																item.user.uid,
																parseUserRole(event.currentTarget.value)
															)}
													>
														<option value="user">user</option>
														<option value="superadmin">superadmin</option>
													</select>
												</td>

												<td class="px-4 py-4 font-semibold">{item.transactionCount}</td>

												<td class="px-4 py-4 font-semibold text-emerald-400">
													{formatCurrency(item.income)}
												</td>

												<td class="px-4 py-4 font-semibold text-red-400">
													{formatCurrency(item.expenses)}
												</td>

												<td
													class={item.net >= 0
														? 'px-4 py-4 font-semibold text-emerald-400'
														: 'px-4 py-4 font-semibold text-red-400'}
												>
													{formatCurrency(item.net)}
												</td>

												<td class="px-4 py-4 text-muted-foreground">
													{formatDateTime(item.lastActivity)}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<div class="space-y-6">
					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title>Financial Totals</Card.Title>
							<Card.Description>Platform-wide recorded amounts</Card.Description>
						</Card.Header>

						<Card.Content class="space-y-4">
							<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
								<p class="text-sm text-muted-foreground">Total Income</p>
								<p class="mt-2 text-2xl font-black text-emerald-400">
									{formatCurrency(totalIncome)}
								</p>
							</div>

							<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
								<p class="text-sm text-muted-foreground">Total Expenses</p>
								<p class="mt-2 text-2xl font-black text-red-400">
									{formatCurrency(totalExpenses)}
								</p>
							</div>

							<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
								<p class="text-sm text-muted-foreground">Net Amount</p>
								<p
									class={netAmount >= 0
										? 'mt-2 text-2xl font-black text-emerald-400'
										: 'mt-2 text-2xl font-black text-red-400'}
								>
									{formatCurrency(netAmount)}
								</p>
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title>Top Expense Categories</Card.Title>
							<Card.Description>Highest categories across all users</Card.Description>
						</Card.Header>

						<Card.Content>
							{#if topExpenseCategories.length === 0}
								<p class="text-sm text-muted-foreground">No expense categories yet.</p>
							{:else}
								<div class="space-y-3">
									{#each topExpenseCategories as category (category.category)}
										<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
											<div class="flex items-center justify-between gap-3">
												<div>
													<p class="font-bold">{category.category}</p>
													<p class="mt-1 text-xs text-muted-foreground">
														{category.transactionCount} transactions
													</p>
												</div>

												<p class="font-black text-red-400">
													{formatCurrency(category.amount)}
												</p>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
			</div>

			<div class="grid gap-6 xl:grid-cols-[1fr_430px]">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<Card.Title>Recent Platform Transactions</Card.Title>
								<Card.Description>Latest transactions from all users.</Card.Description>
							</div>

							<Badge variant="secondary">{recentTransactions.length} shown</Badge>
						</div>
					</Card.Header>

					<Card.Content>
						{#if recentTransactions.length === 0}
							<div class="rounded-2xl border border-dashed border-white/10 p-10 text-center">
								<p class="font-semibold">No transactions yet</p>
								<p class="mt-2 text-sm text-muted-foreground">
									Platform transactions will appear here.
								</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each recentTransactions as transaction (transaction.id)}
									<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
										<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
											<div>
												<div class="flex flex-wrap items-center gap-2">
													<p class="font-bold">{transaction.category}</p>

													<span
														class={transaction.type === 'income'
															? 'rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400'
															: 'rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400'}
													>
														{transaction.type}
													</span>
												</div>

												<p class="mt-1 text-sm text-muted-foreground">
													{formatTransactionDate(transaction.transactionDate)} ·
													{getUserEmail(transaction.userId)}
												</p>
											</div>

											<p
												class={transaction.type === 'income'
													? 'text-xl font-black text-emerald-400'
													: 'text-xl font-black text-red-400'}
											>
												{transaction.type === 'income' ? '+' : '-'}
												{formatCurrency(transaction.amount)}
											</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title>Recent Users</Card.Title>
						<Card.Description>Newest user profiles created</Card.Description>
					</Card.Header>

					<Card.Content>
						{#if recentUsers.length === 0}
							<p class="text-sm text-muted-foreground">No users yet.</p>
						{:else}
							<div class="space-y-3">
								{#each recentUsers as user (user.uid)}
									<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
										<div class="flex items-start justify-between gap-3">
											<div>
												<p class="font-bold">{user.email || 'No email'}</p>
												<p class="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">
													{user.uid}
												</p>
											</div>

											<span
												class={user.role === 'superadmin'
													? 'rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300'
													: 'rounded-full border border-white/10 bg-background/50 px-3 py-1 text-xs font-semibold text-muted-foreground'}
											>
												{user.role}
											</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		{/if}
	</section>
</main>