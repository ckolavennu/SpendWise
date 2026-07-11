<script lang="ts">
	import { resolve } from '$app/paths';
	import AdminDashboard from './admin/+page.svelte';
	import CategoryBreakdownChart from '$lib/components/charts/category-breakdown-chart.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { subscribeToBudgetSettings } from '$lib/services/budget';
	import { subscribeToTransactions } from '$lib/services/transactions';
	import { currentUser } from '$lib/stores/auth';
	import { isSuperAdmin, userProfileLoading } from '$lib/stores/profile';
	import type { Transaction } from '$lib/types/finance';
	import { calculateExpenseCategoryBreakdown } from '$lib/utils/category-breakdown';
	import { calculateDashboardMetrics, formatCurrency } from '$lib/utils/dashboard';

	let transactions = $state<Transaction[]>([]);
	let monthlyBudget = $state(1200);

	$effect(() => {
		const userId = $currentUser?.uid;

		if (!userId) {
			transactions = [];
			return;
		}

		const unsubscribe = subscribeToTransactions(userId, (items) => {
			transactions = items;
		});

		return () => {
			unsubscribe();
		};
	});

	$effect(() => {
		const userId = $currentUser?.uid;

		if (!userId) {
			monthlyBudget = 1200;
			return;
		}

		const unsubscribe = subscribeToBudgetSettings(userId, (settings) => {
			monthlyBudget = settings.monthlyBudget;
		});

		return () => {
			unsubscribe();
		};
	});

	const metrics = $derived(calculateDashboardMetrics(transactions, monthlyBudget));
	const categoryBreakdown = $derived(calculateExpenseCategoryBreakdown(transactions));
	const recentTransactions = $derived(transactions.slice(0, 5));

	const budgetUsedPercentage = $derived(
		monthlyBudget > 0 ? Math.min((metrics.monthlyExpenses / monthlyBudget) * 100, 100) : 0
	);

	const remainingBudget = $derived(monthlyBudget - metrics.monthlyExpenses);

	function formatDate(dateValue: string): string {
		const date = new Date(`${dateValue}T00:00:00`);

		if (Number.isNaN(date.getTime())) {
			return dateValue;
		}

		return new Intl.DateTimeFormat('en-MY', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(date);
	}

	function getBudgetStatusClass(status: string): string {
		if (status === 'Healthy') {
			return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
		}

		if (status === 'Warning') {
			return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
		}

		return 'border-red-500/30 bg-red-500/10 text-red-400';
	}

	function getProgressColor(status: string): string {
		if (status === 'Healthy') {
			return 'bg-emerald-400';
		}

		if (status === 'Warning') {
			return 'bg-amber-400';
		}

		return 'bg-red-400';
	}
</script>

<svelte:head>
	<title>Dashboard | SpendWise</title>
</svelte:head>

{#if $currentUser && $userProfileLoading}
	<main class="min-h-screen px-4 py-8 text-foreground sm:px-6 lg:px-8">
		<section class="mx-auto max-w-7xl">
			<Card.Root class="border-white/10 bg-card/80 shadow-xl backdrop-blur">
				<Card.Header>
					<Card.Title>Loading dashboard...</Card.Title>
					<Card.Description>Checking your account access.</Card.Description>
				</Card.Header>
			</Card.Root>
		</section>
	</main>
{:else if $currentUser && $isSuperAdmin}
	<AdminDashboard />
{:else}
	<main class="min-h-screen px-4 py-8 text-foreground sm:px-6 lg:px-8">
		<section class="mx-auto max-w-7xl space-y-8">
			<div
				class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-card/70 to-cyan-500/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"
			>
				<div class="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"></div>
				<div class="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl"></div>

				<div class="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
					<div class="space-y-5">
						<div class="flex flex-wrap items-center gap-3">
							<Badge class="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
								Firebase Connected
							</Badge>

							<Badge variant="secondary">
								{transactions.length} records tracked
							</Badge>
						</div>

						<div class="space-y-3">
							<h1 class="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
								Your money, clearer than ever.
							</h1>

							<p class="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
								Track income, control spending, monitor budgets, and understand exactly where your
								money goes.
							</p>
						</div>

						<div class="flex flex-wrap gap-3">
							<a href={resolve('/transactions')}>
								<Button>Add Transaction</Button>
							</a>

							<a href={resolve('/reports')}>
								<Button variant="secondary">View Reports</Button>
							</a>

							<a href={resolve('/budget')}>
								<Button variant="outline">Manage Budget</Button>
							</a>
						</div>
					</div>

					<div class="rounded-[1.5rem] border border-white/10 bg-background/60 p-5 shadow-xl backdrop-blur">
						<p class="text-sm text-muted-foreground">Current Balance</p>

						<p
							class={metrics.balance >= 0
								? 'mt-3 text-4xl font-black tracking-tight text-emerald-400'
								: 'mt-3 text-4xl font-black tracking-tight text-red-400'}
						>
							{formatCurrency(metrics.balance)}
						</p>

						<div class="mt-6 grid grid-cols-2 gap-3">
							<div class="rounded-2xl border border-white/10 bg-card/70 p-4">
								<p class="text-xs text-muted-foreground">Income</p>
								<p class="mt-2 text-lg font-bold text-emerald-400">
									{formatCurrency(metrics.totalIncome)}
								</p>
							</div>

							<div class="rounded-2xl border border-white/10 bg-card/70 p-4">
								<p class="text-xs text-muted-foreground">Expenses</p>
								<p class="mt-2 text-lg font-bold text-red-400">
									{formatCurrency(metrics.totalExpenses)}
								</p>
							</div>
						</div>

						<div class="mt-5 rounded-2xl border border-white/10 bg-card/70 p-4">
							<div class="flex items-center justify-between gap-3">
								<p class="text-xs text-muted-foreground">Monthly budget used</p>
								<p class="text-xs font-semibold">{budgetUsedPercentage.toFixed(0)}%</p>
							</div>

							<div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
								<div
									class={`h-full rounded-full ${getProgressColor(metrics.budgetHealth)}`}
									style={`width: ${budgetUsedPercentage}%`}
								></div>
							</div>

							<p class="mt-3 text-xs text-muted-foreground">
								{formatCurrency(metrics.monthlyExpenses)} spent from {formatCurrency(monthlyBudget)}
							</p>
						</div>
					</div>
				</div>
			</div>

			{#if !$currentUser}
				<Card.Root class="border-white/10 bg-card/80 shadow-xl backdrop-blur">
					<Card.Header>
						<Card.Title>Sign in to start tracking</Card.Title>
						<Card.Description>
							Create an account or log in to save transactions and budgets.
						</Card.Description>
					</Card.Header>

					<Card.Content>
						<a href={resolve('/login')}>
							<Button>Go to Login</Button>
						</a>
					</Card.Content>
				</Card.Root>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title class="text-sm text-muted-foreground">Total Income</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-3xl font-black text-emerald-400">
								{formatCurrency(metrics.totalIncome)}
							</p>
							<p class="mt-2 text-sm text-muted-foreground">All income recorded</p>
						</Card.Content>
					</Card.Root>

					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title class="text-sm text-muted-foreground">Total Expenses</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-3xl font-black text-red-400">
								{formatCurrency(metrics.totalExpenses)}
							</p>
							<p class="mt-2 text-sm text-muted-foreground">All expenses recorded</p>
						</Card.Content>
					</Card.Root>

					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title class="text-sm text-muted-foreground">Monthly Spending</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-3xl font-black">
								{formatCurrency(metrics.monthlyExpenses)}
							</p>
							<p class="mt-2 text-sm text-muted-foreground">Current month expenses</p>
						</Card.Content>
					</Card.Root>

					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title class="text-sm text-muted-foreground">Budget Health</Card.Title>
						</Card.Header>
						<Card.Content>
							<div
								class={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getBudgetStatusClass(
									metrics.budgetHealth
								)}`}
							>
								{metrics.budgetHealth}
							</div>

							<p class="mt-3 text-sm text-muted-foreground">
								{formatCurrency(remainingBudget)} remaining
							</p>
						</Card.Content>
					</Card.Root>
				</div>

				<div class="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<Card.Title>Monthly Overview</Card.Title>
									<Card.Description>
										Your current month income, expenses, and budget usage.
									</Card.Description>
								</div>

								<a href={resolve('/budget')}>
									<Button variant="secondary" size="sm">Edit Budget</Button>
								</a>
							</div>
						</Card.Header>

						<Card.Content class="space-y-6">
							<div class="grid gap-4 sm:grid-cols-3">
								<div class="rounded-2xl border border-white/10 bg-background/50 p-5">
									<p class="text-sm text-muted-foreground">Monthly Income</p>
									<p class="mt-3 text-2xl font-black text-emerald-400">
										{formatCurrency(metrics.monthlyIncome)}
									</p>
								</div>

								<div class="rounded-2xl border border-white/10 bg-background/50 p-5">
									<p class="text-sm text-muted-foreground">Monthly Expenses</p>
									<p class="mt-3 text-2xl font-black text-red-400">
										{formatCurrency(metrics.monthlyExpenses)}
									</p>
								</div>

								<div class="rounded-2xl border border-white/10 bg-background/50 p-5">
									<p class="text-sm text-muted-foreground">Budget Left</p>
									<p
										class={remainingBudget >= 0
											? 'mt-3 text-2xl font-black text-emerald-400'
											: 'mt-3 text-2xl font-black text-red-400'}
									>
										{formatCurrency(remainingBudget)}
									</p>
								</div>
							</div>

							<div>
								<div class="mb-2 flex items-center justify-between text-sm">
									<p class="text-muted-foreground">Budget progress</p>
									<p class="font-semibold">{budgetUsedPercentage.toFixed(0)}%</p>
								</div>

								<div class="h-3 overflow-hidden rounded-full bg-muted">
									<div
										class={`h-full rounded-full ${getProgressColor(metrics.budgetHealth)}`}
										style={`width: ${budgetUsedPercentage}%`}
									></div>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title>Expense Breakdown</Card.Title>
							<Card.Description>Spending by category across all expenses.</Card.Description>
						</Card.Header>

						<Card.Content>
							{#if categoryBreakdown.length === 0}
								<div class="rounded-2xl border border-dashed border-white/10 p-8 text-center">
									<p class="font-semibold">No expense data yet</p>
									<p class="mt-2 text-sm text-muted-foreground">
										Add expenses to see your category breakdown.
									</p>
								</div>
							{:else}
								<CategoryBreakdownChart data={categoryBreakdown} />
							{/if}
						</Card.Content>
					</Card.Root>
				</div>

				<div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title>Quick Actions</Card.Title>
							<Card.Description>Common actions for managing your money.</Card.Description>
						</Card.Header>

						<Card.Content class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
							<a href={resolve('/transactions')}>
								<Button class="w-full justify-start" variant="secondary">
									Add or edit transactions
								</Button>
							</a>

							<a href={resolve('/categories')}>
								<Button class="w-full justify-start" variant="secondary">
									Manage categories
								</Button>
							</a>

							<a href={resolve('/reports')}>
								<Button class="w-full justify-start" variant="secondary">
									Open analytics reports
								</Button>
							</a>

							<a href={resolve('/budget')}>
								<Button class="w-full justify-start" variant="secondary">
									Update monthly budget
								</Button>
							</a>
						</Card.Content>
					</Card.Root>

					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<Card.Title>Recent Transactions</Card.Title>
									<Card.Description>Your latest 5 records.</Card.Description>
								</div>

								<a href={resolve('/transactions')}>
									<Button variant="secondary" size="sm">View All</Button>
								</a>
							</div>
						</Card.Header>

						<Card.Content>
							{#if recentTransactions.length === 0}
								<div class="rounded-2xl border border-dashed border-white/10 p-8 text-center">
									<p class="font-semibold">No transactions yet</p>
									<p class="mt-2 text-sm text-muted-foreground">
										Start by adding your first income or expense.
									</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each recentTransactions as transaction (transaction.id)}
										<div
											class="flex flex-col gap-3 rounded-2xl border border-white/10 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
										>
											<div>
												<div class="flex flex-wrap items-center gap-2">
													<p class="font-semibold">{transaction.category}</p>

													<span
														class={transaction.type === 'income'
															? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400'
															: 'rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400'}
													>
														{transaction.type}
													</span>
												</div>

												<p class="mt-1 text-sm text-muted-foreground">
													{formatDate(transaction.transactionDate)}
													{#if transaction.note}
														· {transaction.note}
													{/if}
												</p>
											</div>

											<p
												class={transaction.type === 'income'
													? 'text-lg font-black text-emerald-400'
													: 'text-lg font-black text-red-400'}
											>
												{transaction.type === 'income' ? '+' : '-'}
												{formatCurrency(transaction.amount)}
											</p>
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
{/if}