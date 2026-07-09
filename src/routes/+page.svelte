<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		calculateDashboardMetrics,
		formatCurrency
	} from '$lib/utils/dashboard';
	import { subscribeToTransactions } from '$lib/services/transactions';
	import { currentUser } from '$lib/stores/auth';
	import type { Transaction } from '$lib/types/finance';

	let transactions = $state<Transaction[]>([]);
	const monthlyBudget = 1200;

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

	const metrics = $derived(calculateDashboardMetrics(transactions, monthlyBudget));
	const recentTransactions = $derived(transactions.slice(0, 5));

	function getBudgetHealthVariant(status: string) {
		if (status === 'Healthy') return 'default';
		if (status === 'Warning') return 'secondary';
		return 'destructive';
	}
</script>

<svelte:head>
	<title>SpendWise Dashboard</title>
	<meta
		name="description"
		content="SpendWise is a budgeting and expense tracking app built with SvelteKit and Firebase."
	/>
</svelte:head>

<main class="min-h-screen bg-background px-6 py-10 text-foreground">
	<section class="mx-auto max-w-6xl space-y-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<div class="flex flex-wrap items-center gap-3">
					<h1 class="text-4xl font-bold tracking-tight">SpendWise</h1>
					<Badge variant="secondary">Firebase Connected</Badge>
				</div>

				<p class="mt-3 max-w-2xl text-muted-foreground">
					Track your income, expenses, monthly spending, and budget health.
				</p>
			</div>

			<div class="flex gap-3">
				<a href={resolve('/transactions')}>
					<Button>Add Transaction</Button>
				</a>

				<a href={resolve('/login')}>
					<Button variant="secondary">Account</Button>
				</a>
			</div>
		</div>

		<Separator />

		{#if !$currentUser}
			<Card.Root>
				<Card.Header>
					<Card.Title>Welcome to SpendWise</Card.Title>
					<Card.Description>
						Log in or create an account to start tracking your expenses.
					</Card.Description>
				</Card.Header>

				<Card.Content>
					<a href={resolve('/login')}>
						<Button>Go to Login</Button>
					</a>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>Total Income</Card.Title>
						<Card.Description>All income recorded</Card.Description>
					</Card.Header>
					<Card.Content>
						<p class="text-3xl font-bold text-emerald-500">
							{formatCurrency(metrics.totalIncome)}
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Total Expenses</Card.Title>
						<Card.Description>All expenses recorded</Card.Description>
					</Card.Header>
					<Card.Content>
						<p class="text-3xl font-bold text-red-500">
							{formatCurrency(metrics.totalExpenses)}
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Balance</Card.Title>
						<Card.Description>Income minus expenses</Card.Description>
					</Card.Header>
					<Card.Content>
						<p
							class={metrics.balance >= 0
								? 'text-3xl font-bold text-emerald-500'
								: 'text-3xl font-bold text-red-500'}
						>
							{formatCurrency(metrics.balance)}
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Budget Health</Card.Title>
						<Card.Description>Based on monthly budget</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="flex flex-col gap-2">
							<Badge variant={getBudgetHealthVariant(metrics.budgetHealth)}>
								{metrics.budgetHealth}
							</Badge>

							<p class="text-sm text-muted-foreground">
								Monthly spend: {formatCurrency(metrics.monthlyExpenses)} /
								{formatCurrency(monthlyBudget)}
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="grid gap-6 lg:grid-cols-[1fr_420px]">
				<Card.Root>
					<Card.Header>
						<Card.Title>Monthly Overview</Card.Title>
						<Card.Description>Your income and expenses for the current month.</Card.Description>
					</Card.Header>

					<Card.Content>
						<div class="grid gap-4 md:grid-cols-2">
							<div class="rounded-lg border p-4">
								<p class="text-sm text-muted-foreground">Monthly Income</p>
								<p class="mt-2 text-2xl font-semibold text-emerald-500">
									{formatCurrency(metrics.monthlyIncome)}
								</p>
							</div>

							<div class="rounded-lg border p-4">
								<p class="text-sm text-muted-foreground">Monthly Expenses</p>
								<p class="mt-2 text-2xl font-semibold text-red-500">
									{formatCurrency(metrics.monthlyExpenses)}
								</p>
							</div>
						</div>

						<div class="mt-6">
							<div class="mb-2 flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Budget used</span>
								<span>
									{Math.min(Math.round((metrics.monthlyExpenses / monthlyBudget) * 100), 100)}%
								</span>
							</div>

							<div class="h-3 overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-primary"
									style={`width: ${Math.min((metrics.monthlyExpenses / monthlyBudget) * 100, 100)}%`}
								></div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Recent Transactions</Card.Title>
						<Card.Description>Your latest 5 records</Card.Description>
					</Card.Header>

					<Card.Content>
						{#if recentTransactions.length === 0}
							<p class="text-sm text-muted-foreground">No transactions yet.</p>
						{:else}
							<div class="space-y-3">
								{#each recentTransactions as transaction (transaction.id)}
									<div class="flex items-center justify-between rounded-lg border p-3">
										<div>
											<p class="font-medium">{transaction.category}</p>
											<p class="text-xs text-muted-foreground">
												{transaction.transactionDate}
												{#if transaction.note}
													· {transaction.note}
												{/if}
											</p>
										</div>

										<p
											class={transaction.type === 'income'
												? 'font-semibold text-emerald-500'
												: 'font-semibold text-red-500'}
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