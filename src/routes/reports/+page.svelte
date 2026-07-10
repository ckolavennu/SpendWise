<script lang="ts">
	import { resolve } from '$app/paths';
	import MonthlyIncomeExpenseChart from '$lib/components/charts/monthly-income-expense-chart.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { subscribeToTransactions } from '$lib/services/transactions';
	import { currentUser } from '$lib/stores/auth';
	import type { Transaction } from '$lib/types/finance';
	import {
		calculateMonthlyReport,
		calculateReportSummary,
		formatCurrency
	} from '$lib/utils/reports';

	let transactions = $state<Transaction[]>([]);

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

	const monthlyReport = $derived(calculateMonthlyReport(transactions));
	const summary = $derived(calculateReportSummary(transactions));
</script>

<svelte:head>
	<title>Reports | SpendWise</title>
</svelte:head>

<main class="min-h-screen bg-background px-6 py-10 text-foreground">
	<section class="mx-auto max-w-6xl space-y-8">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Reports</h1>
				<p class="mt-2 text-muted-foreground">
					Analyze your income, expenses, categories, and spending patterns.
				</p>
			</div>

			<a href={resolve('/transactions')}>
				<Button>Add Transaction</Button>
			</a>
		</div>

		{#if !$currentUser}
			<Card.Root>
				<Card.Header>
					<Card.Title>Please log in first</Card.Title>
					<Card.Description>You need an account before viewing reports.</Card.Description>
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
							{formatCurrency(summary.totalIncome)}
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
							{formatCurrency(summary.totalExpenses)}
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Net Amount</Card.Title>
						<Card.Description>Income minus expenses</Card.Description>
					</Card.Header>
					<Card.Content>
						<p
							class={summary.netAmount >= 0
								? 'text-3xl font-bold text-emerald-500'
								: 'text-3xl font-bold text-red-500'}
						>
							{formatCurrency(summary.netAmount)}
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Daily Average</Card.Title>
						<Card.Description>This month’s average expense</Card.Description>
					</Card.Header>
					<Card.Content>
						<p class="text-3xl font-bold">
							{formatCurrency(summary.averageDailyExpense)}
						</p>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="grid gap-6 lg:grid-cols-[1fr_380px]">
				<Card.Root>
					<Card.Header>
						<Card.Title>Monthly Income vs Expenses</Card.Title>
						<Card.Description>
							Compare income and expenses across recorded months.
						</Card.Description>
					</Card.Header>

					<Card.Content>
						{#if monthlyReport.length === 0}
							<div class="rounded-xl border border-dashed p-8 text-center">
								<p class="font-medium">No report data yet</p>
								<p class="mt-1 text-sm text-muted-foreground">
									Add transactions to generate reports.
								</p>
							</div>
						{:else}
							<MonthlyIncomeExpenseChart data={monthlyReport} />
						{/if}
					</Card.Content>
				</Card.Root>

				<div class="space-y-6">
					<Card.Root>
						<Card.Header>
							<Card.Title>Top Spending Category</Card.Title>
							<Card.Description>Your highest expense category overall</Card.Description>
						</Card.Header>

						<Card.Content>
							<p class="text-2xl font-bold">{summary.topExpenseCategory}</p>
							<p class="mt-2 text-muted-foreground">
								{formatCurrency(summary.topExpenseCategoryAmount)}
							</p>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>Highest Expense</Card.Title>
							<Card.Description>Your largest single expense record</Card.Description>
						</Card.Header>

						<Card.Content>
							<p class="text-2xl font-bold">{summary.highestExpenseCategory}</p>
							<p class="mt-2 text-muted-foreground">
								{formatCurrency(summary.highestExpenseAmount)}
							</p>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>Recorded Transactions</Card.Title>
							<Card.Description>Total records in your account</Card.Description>
						</Card.Header>

						<Card.Content>
							<p class="text-3xl font-bold">{transactions.length}</p>
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		{/if}
	</section>
</main>