<script lang="ts">
	import { resolve } from '$app/paths';
	import MonthlyIncomeExpenseChart from '$lib/components/charts/monthly-income-expense-chart.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
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

	const currentMonthReport = $derived(
		monthlyReport.length > 0 ? monthlyReport[monthlyReport.length - 1] : null
	);

	const expenseToIncomeRatio = $derived(
		summary.totalIncome > 0 ? Math.min((summary.totalExpenses / summary.totalIncome) * 100, 100) : 0
	);

	const savingsRate = $derived(
		summary.totalIncome > 0 ? (summary.netAmount / summary.totalIncome) * 100 : 0
	);

	function getNetAmountClass(value: number): string {
		return value >= 0 ? 'text-emerald-400' : 'text-red-400';
	}

	function getSavingsRateLabel(value: number): string {
		if (value >= 30) {
			return 'Excellent';
		}

		if (value >= 10) {
			return 'Stable';
		}

		if (value >= 0) {
			return 'Low';
		}

		return 'Overspending';
	}

	function getSavingsRateBadgeClass(value: number): string {
		if (value >= 30) {
			return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
		}

		if (value >= 10) {
			return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
		}

		if (value >= 0) {
			return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
		}

		return 'border-red-500/30 bg-red-500/10 text-red-300';
	}
</script>

<svelte:head>
	<title>Reports | SpendWise</title>
</svelte:head>

<main class="min-h-screen px-4 py-8 text-foreground sm:px-6 lg:px-8">
	<section class="mx-auto max-w-7xl space-y-8">
		<div
			class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/10 via-card/70 to-emerald-500/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"
		>
			<div class="absolute right-[-4rem] top-[-4rem] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"></div>
			<div class="absolute bottom-[-5rem] left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"></div>

			<div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div class="space-y-4">
					<div class="flex flex-wrap items-center gap-3">
						<Badge class="border border-blue-500/30 bg-blue-500/10 text-blue-300">
							Analytics Hub
						</Badge>

						<Badge variant="secondary">
							{transactions.length} transactions analyzed
						</Badge>
					</div>

					<div>
						<h1 class="text-4xl font-black tracking-tight sm:text-5xl">
							Financial reports that tell the story.
						</h1>

						<p class="mt-3 max-w-2xl text-muted-foreground">
							Understand your income, expenses, spending categories, monthly patterns, and overall
							cash flow.
						</p>
					</div>
				</div>

				<div class="flex flex-wrap gap-3">
					<a href={resolve('/transactions')}>
						<Button>Add Transaction</Button>
					</a>

					<a href={resolve('/')}>
						<Button variant="secondary">Dashboard</Button>
					</a>
				</div>
			</div>
		</div>

		{#if !$currentUser}
			<Card.Root class="border-white/10 bg-card/80 shadow-xl backdrop-blur">
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
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Total Income</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-3xl font-black text-emerald-400">
							{formatCurrency(summary.totalIncome)}
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
							{formatCurrency(summary.totalExpenses)}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">All expenses recorded</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Net Cash Flow</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class={`text-3xl font-black ${getNetAmountClass(summary.netAmount)}`}>
							{formatCurrency(summary.netAmount)}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">Income minus expenses</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Daily Average</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-3xl font-black">
							{formatCurrency(summary.averageDailyExpense)}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">This month’s daily expense</p>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="grid gap-6 xl:grid-cols-[1fr_420px]">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<Card.Title>Monthly Income vs Expenses</Card.Title>
								<Card.Description>
									Compare income and expenses across recorded months.
								</Card.Description>
							</div>

							<Badge variant="secondary">
								{monthlyReport.length} months
							</Badge>
						</div>
					</Card.Header>

					<Card.Content>
						{#if monthlyReport.length === 0}
							<div class="rounded-2xl border border-dashed border-white/10 p-10 text-center">
								<p class="font-semibold">No report data yet</p>
								<p class="mt-2 text-sm text-muted-foreground">
									Add transactions to generate reports and charts.
								</p>

								<div class="mt-5">
									<a href={resolve('/transactions')}>
										<Button>Add Transaction</Button>
									</a>
								</div>
							</div>
						{:else}
							<MonthlyIncomeExpenseChart data={monthlyReport} />
						{/if}
					</Card.Content>
				</Card.Root>

				<div class="space-y-6">
					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title>Financial Health</Card.Title>
							<Card.Description>Cash flow and savings performance</Card.Description>
						</Card.Header>

						<Card.Content class="space-y-5">
							<div>
								<div class="flex items-center justify-between gap-3">
									<p class="text-sm text-muted-foreground">Expense to income ratio</p>
									<p class="text-sm font-semibold">{expenseToIncomeRatio.toFixed(0)}%</p>
								</div>

								<div class="mt-3 h-3 overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-cyan-400"
										style={`width: ${expenseToIncomeRatio}%`}
									></div>
								</div>
							</div>

							<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
								<div class="flex items-center justify-between gap-3">
									<div>
										<p class="text-sm text-muted-foreground">Savings rate</p>
										<p class={`mt-2 text-2xl font-black ${getNetAmountClass(savingsRate)}`}>
											{savingsRate.toFixed(0)}%
										</p>
									</div>

									<span
										class={`rounded-full border px-3 py-1 text-xs font-semibold ${getSavingsRateBadgeClass(
											savingsRate
										)}`}
									>
										{getSavingsRateLabel(savingsRate)}
									</span>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title>Current Month</Card.Title>
							<Card.Description>Latest month in your report</Card.Description>
						</Card.Header>

						<Card.Content>
							{#if currentMonthReport}
								<div class="space-y-3">
									<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
										<p class="text-sm text-muted-foreground">{currentMonthReport.month}</p>
										<p class={`mt-2 text-2xl font-black ${getNetAmountClass(currentMonthReport.net)}`}>
											{formatCurrency(currentMonthReport.net)}
										</p>
									</div>

									<div class="grid grid-cols-2 gap-3">
										<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
											<p class="text-xs text-muted-foreground">Income</p>
											<p class="mt-2 font-bold text-emerald-400">
												{formatCurrency(currentMonthReport.income)}
											</p>
										</div>

										<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
											<p class="text-xs text-muted-foreground">Expenses</p>
											<p class="mt-2 font-bold text-red-400">
												{formatCurrency(currentMonthReport.expenses)}
											</p>
										</div>
									</div>
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">No monthly data yet.</p>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
			</div>

			<div class="grid gap-6 lg:grid-cols-3">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title>Top Spending Category</Card.Title>
						<Card.Description>Your highest expense category overall</Card.Description>
					</Card.Header>

					<Card.Content>
						<p class="text-3xl font-black">{summary.topExpenseCategory}</p>
						<p class="mt-3 text-lg font-semibold text-red-400">
							{formatCurrency(summary.topExpenseCategoryAmount)}
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title>Highest Expense</Card.Title>
						<Card.Description>Your largest single expense record</Card.Description>
					</Card.Header>

					<Card.Content>
						<p class="text-3xl font-black">{summary.highestExpenseCategory}</p>
						<p class="mt-3 text-lg font-semibold text-red-400">
							{formatCurrency(summary.highestExpenseAmount)}
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title>Recorded Transactions</Card.Title>
						<Card.Description>Total records in your account</Card.Description>
					</Card.Header>

					<Card.Content>
						<p class="text-5xl font-black">{transactions.length}</p>
						<p class="mt-3 text-sm text-muted-foreground">
							Used to calculate your reports and trends.
						</p>
					</Card.Content>
				</Card.Root>
			</div>
		{/if}
	</section>
</main>