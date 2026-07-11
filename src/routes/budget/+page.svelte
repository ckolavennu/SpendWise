<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { saveBudgetSettings, subscribeToBudgetSettings } from '$lib/services/budget';
	import { subscribeToTransactions } from '$lib/services/transactions';
	import { currentUser } from '$lib/stores/auth';
	import type { Transaction } from '$lib/types/finance';
	import { calculateDashboardMetrics, formatCurrency } from '$lib/utils/dashboard';

	let monthlyBudgetInput = $state('1200');
	let currency = $state('MYR');
	let savedMonthlyBudget = $state(1200);
	let saving = $state(false);
	let message = $state('');
	let transactions = $state<Transaction[]>([]);

	$effect(() => {
		const userId = $currentUser?.uid;

		if (!userId) {
			monthlyBudgetInput = '1200';
			savedMonthlyBudget = 1200;
			currency = 'MYR';
			return;
		}

		const unsubscribe = subscribeToBudgetSettings(userId, (settings) => {
			savedMonthlyBudget = settings.monthlyBudget;
			monthlyBudgetInput = String(settings.monthlyBudget);
			currency = settings.currency;
		});

		return () => {
			unsubscribe();
		};
	});

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

	const previewBudget = $derived(() => {
		const value = Number(monthlyBudgetInput);

		if (Number.isNaN(value) || value <= 0) {
			return savedMonthlyBudget;
		}

		return value;
	});

	const metrics = $derived(calculateDashboardMetrics(transactions, previewBudget()));
	const budgetUsedPercentage = $derived(
		previewBudget() > 0 ? Math.min((metrics.monthlyExpenses / previewBudget()) * 100, 100) : 0
	);
	const remainingBudget = $derived(previewBudget() - metrics.monthlyExpenses);

	function getBudgetStatusClass(status: string): string {
		if (status === 'Healthy') {
			return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
		}

		if (status === 'Warning') {
			return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
		}

		return 'border-red-500/30 bg-red-500/10 text-red-300';
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

	async function handleSaveBudget(event: SubmitEvent) {
		event.preventDefault();

		if (!$currentUser) {
			message = 'Please log in first.';
			return;
		}

		const amount = Number(monthlyBudgetInput);

		if (Number.isNaN(amount) || amount <= 0) {
			message = 'Please enter a valid monthly budget amount.';
			return;
		}

		saving = true;
		message = '';

		try {
			await saveBudgetSettings($currentUser.uid, amount, currency);
			savedMonthlyBudget = amount;
			message = 'Budget settings saved successfully.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Failed to save budget settings.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Budget | SpendWise</title>
</svelte:head>

<main class="min-h-screen px-4 py-8 text-foreground sm:px-6 lg:px-8">
	<section class="mx-auto max-w-7xl space-y-8">
		<div
			class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/10 via-card/70 to-amber-500/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"
		>
			<div class="absolute right-[-4rem] top-[-4rem] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"></div>
			<div class="absolute bottom-[-5rem] left-1/3 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"></div>

			<div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div class="space-y-4">
					<div class="flex flex-wrap items-center gap-3">
						<Badge class="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
							Budget Control
						</Badge>

						<Badge variant="secondary">
							Monthly limit: {formatCurrency(savedMonthlyBudget)}
						</Badge>
					</div>

					<div>
						<h1 class="text-4xl font-black tracking-tight sm:text-5xl">
							Plan your month before your money disappears.
						</h1>

						<p class="mt-3 max-w-2xl text-muted-foreground">
							Set your monthly budget, monitor spending progress, and quickly see whether you are
							still on track.
						</p>
					</div>
				</div>

				<div class="flex flex-wrap gap-3">
					<a href={resolve('/')}>
						<Button variant="secondary">Dashboard</Button>
					</a>

					<a href={resolve('/transactions')}>
						<Button>Add Transaction</Button>
					</a>
				</div>
			</div>
		</div>

		{#if !$currentUser}
			<Card.Root class="border-white/10 bg-card/80 shadow-xl backdrop-blur">
				<Card.Header>
					<Card.Title>Please log in first</Card.Title>
					<Card.Description>You need an account before managing budgets.</Card.Description>
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
						<Card.Title class="text-sm text-muted-foreground">Monthly Budget</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-3xl font-black">{formatCurrency(previewBudget())}</p>
						<p class="mt-2 text-sm text-muted-foreground">Current monthly limit</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Spent This Month</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-3xl font-black text-red-400">
							{formatCurrency(metrics.monthlyExpenses)}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">Current month expenses</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Remaining</Card.Title>
					</Card.Header>

					<Card.Content>
						<p
							class={remainingBudget >= 0
								? 'text-3xl font-black text-emerald-400'
								: 'text-3xl font-black text-red-400'}
						>
							{formatCurrency(remainingBudget)}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">Budget left this month</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Budget Health</Card.Title>
					</Card.Header>

					<Card.Content>
						<span
							class={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getBudgetStatusClass(
								metrics.budgetHealth
							)}`}
						>
							{metrics.budgetHealth}
						</span>

						<p class="mt-3 text-sm text-muted-foreground">
							{budgetUsedPercentage.toFixed(0)}% of budget used
						</p>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="grid gap-6 xl:grid-cols-[430px_1fr]">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title>Budget Settings</Card.Title>
						<Card.Description>Update your monthly spending limit.</Card.Description>
					</Card.Header>

					<Card.Content>
						<form class="space-y-4" onsubmit={handleSaveBudget}>
							<div class="space-y-2">
								<Label for="monthlyBudget">Monthly Budget</Label>
								<Input
									id="monthlyBudget"
									type="number"
									min="1"
									step="0.01"
									bind:value={monthlyBudgetInput}
									placeholder="Example: 1200"
								/>
							</div>

							<div class="space-y-2">
								<Label for="currency">Currency</Label>
								<select
									id="currency"
									bind:value={currency}
									class="w-full rounded-md border border-white/10 bg-background/60 px-3 py-2 text-sm"
								>
									<option value="MYR">MYR - Malaysian Ringgit</option>
								</select>
							</div>

							<Button class="w-full" type="submit" disabled={saving}>
								{saving ? 'Saving...' : 'Save Budget'}
							</Button>

							{#if message}
								<div class="rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
									{message}
								</div>
							{/if}
						</form>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<Card.Title>Monthly Budget Progress</Card.Title>
								<Card.Description>
									Track how much of your budget has been used this month.
								</Card.Description>
							</div>

							<span
								class={`rounded-full border px-3 py-1 text-xs font-semibold ${getBudgetStatusClass(
									metrics.budgetHealth
								)}`}
							>
								{metrics.budgetHealth}
							</span>
						</div>
					</Card.Header>

					<Card.Content class="space-y-6">
						<div class="rounded-[1.5rem] border border-white/10 bg-background/50 p-5">
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="text-sm text-muted-foreground">Budget used</p>
									<p class="mt-2 text-4xl font-black">{budgetUsedPercentage.toFixed(0)}%</p>
								</div>

								<div class="text-right">
									<p class="text-sm text-muted-foreground">Remaining</p>
									<p
										class={remainingBudget >= 0
											? 'mt-2 text-2xl font-black text-emerald-400'
											: 'mt-2 text-2xl font-black text-red-400'}
									>
										{formatCurrency(remainingBudget)}
									</p>
								</div>
							</div>

							<div class="mt-6 h-4 overflow-hidden rounded-full bg-muted">
								<div
									class={`h-full rounded-full ${getProgressColor(metrics.budgetHealth)}`}
									style={`width: ${budgetUsedPercentage}%`}
								></div>
							</div>

							<div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
								<p>{formatCurrency(metrics.monthlyExpenses)} spent</p>
								<p>{formatCurrency(previewBudget())} budget</p>
							</div>
						</div>

						<div class="grid gap-4 md:grid-cols-3">
							<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
								<p class="text-sm text-muted-foreground">Monthly Income</p>
								<p class="mt-2 text-xl font-black text-emerald-400">
									{formatCurrency(metrics.monthlyIncome)}
								</p>
							</div>

							<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
								<p class="text-sm text-muted-foreground">Monthly Expenses</p>
								<p class="mt-2 text-xl font-black text-red-400">
									{formatCurrency(metrics.monthlyExpenses)}
								</p>
							</div>

							<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
								<p class="text-sm text-muted-foreground">Monthly Net</p>
								<p
									class={metrics.monthlyIncome - metrics.monthlyExpenses >= 0
										? 'mt-2 text-xl font-black text-emerald-400'
										: 'mt-2 text-xl font-black text-red-400'}
								>
									{formatCurrency(metrics.monthlyIncome - metrics.monthlyExpenses)}
								</p>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		{/if}
	</section>
</main>