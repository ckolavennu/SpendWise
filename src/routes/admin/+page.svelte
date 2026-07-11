<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		subscribeToAllTransactions,
		subscribeToAllUserProfiles,
		type AdminTransaction
	} from '$lib/services/admin';
	import { currentUser } from '$lib/stores/auth';
	import { isSuperAdmin, userProfileLoading } from '$lib/stores/profile';
	import type { UserProfile } from '$lib/types/user';

	let users = $state<UserProfile[]>([]);
	let transactions = $state<AdminTransaction[]>([]);

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
	const totalSuperAdmins = $derived(users.filter((user) => user.role === 'superadmin').length);

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
	const recentTransactions = $derived(transactions.slice(0, 8));

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-MY', {
			style: 'currency',
			currency: 'MYR'
		}).format(value);
	}

	function formatDate(dateValue: string): string {
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

						<Badge variant="secondary">Platform overview</Badge>
					</div>

					<div>
						<h1 class="text-4xl font-black tracking-tight sm:text-5xl">
							Manage SpendWise from the top.
						</h1>

						<p class="mt-3 max-w-2xl text-muted-foreground">
							View platform users, transaction activity, and overall financial records across the
							system.
						</p>
					</div>
				</div>

				<div class="flex flex-wrap gap-3">
					<a href={resolve('/')}>
						<Button variant="secondary">Dashboard</Button>
					</a>

					<a href={resolve('/reports')}>
						<Button>Reports</Button>
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
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Total Users</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black">{totalUsers}</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Superadmins</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black text-amber-300">{totalSuperAdmins}</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Transactions</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black">{transactions.length}</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Total Income</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-2xl font-black text-emerald-400">{formatCurrency(totalIncome)}</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Total Expenses</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-2xl font-black text-red-400">{formatCurrency(totalExpenses)}</p>
					</Card.Content>
				</Card.Root>
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
													{formatDate(transaction.transactionDate)} · {getUserEmail(transaction.userId)}
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
						<Card.Title>Platform Summary</Card.Title>
						<Card.Description>Overall recorded cash flow</Card.Description>
					</Card.Header>

					<Card.Content class="space-y-4">
						<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
							<p class="text-sm text-muted-foreground">Net Amount</p>
							<p
								class={netAmount >= 0
									? 'mt-2 text-3xl font-black text-emerald-400'
									: 'mt-2 text-3xl font-black text-red-400'}
							>
								{formatCurrency(netAmount)}
							</p>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
								<p class="text-xs text-muted-foreground">Users</p>
								<p class="mt-2 text-xl font-black">{totalUsers}</p>
							</div>

							<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
								<p class="text-xs text-muted-foreground">Records</p>
								<p class="mt-2 text-xl font-black">{transactions.length}</p>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
				<Card.Header>
					<Card.Title>User Directory</Card.Title>
					<Card.Description>All users with SpendWise profiles.</Card.Description>
				</Card.Header>

				<Card.Content>
					{#if users.length === 0}
						<div class="rounded-2xl border border-dashed border-white/10 p-10 text-center">
							<p class="font-semibold">No users found</p>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full min-w-[720px] text-left text-sm">
								<thead class="text-muted-foreground">
									<tr class="border-b border-white/10">
										<th class="px-4 py-3 font-medium">Email</th>
										<th class="px-4 py-3 font-medium">Display Name</th>
										<th class="px-4 py-3 font-medium">Role</th>
										<th class="px-4 py-3 font-medium">UID</th>
									</tr>
								</thead>

								<tbody>
									{#each users as user (user.uid)}
										<tr class="border-b border-white/10">
											<td class="px-4 py-3">{user.email || 'No email'}</td>
											<td class="px-4 py-3 text-muted-foreground">
												{user.displayName || 'No name'}
											</td>
											<td class="px-4 py-3">
												<span
													class={user.role === 'superadmin'
														? 'rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300'
														: 'rounded-full border border-white/10 bg-background/50 px-3 py-1 text-xs font-semibold text-muted-foreground'}
												>
													{user.role}
												</span>
											</td>
											<td class="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
												{user.uid}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}
	</section>
</main>