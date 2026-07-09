<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	const monthlyBudget = 1200;
	const totalSpent = 350;
	const remainingBudget = monthlyBudget - totalSpent;

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-MY', {
			style: 'currency',
			currency: 'MYR'
		}).format(amount);
	}
</script>

<svelte:head>
	<title>SpendWise</title>
	<meta
		name="description"
		content="A budgeting and expense tracking app built with SvelteKit, Tauri, and SQLite."
	/>
</svelte:head>

<main class="min-h-screen bg-background px-6 py-10 text-foreground">
	<section class="mx-auto max-w-6xl space-y-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<div class="flex items-center gap-3">
					<h1 class="text-4xl font-bold tracking-tight">SpendWise</h1>
					<Badge variant="secondary">Local-first</Badge>
				</div>

				<p class="mt-3 max-w-2xl text-muted-foreground">
					A budgeting and expense tracking app for desktop and Android.
				</p>
			</div>

			<Button>Add Transaction</Button>
		</div>

		<Separator />

		<div class="grid gap-4 md:grid-cols-3">
			<Card.Root>
				<Card.Header>
					<Card.Title>Monthly Budget</Card.Title>
					<Card.Description>Your planned spending limit</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-3xl font-bold">{formatCurrency(monthlyBudget)}</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Total Spent</Card.Title>
					<Card.Description>Expenses recorded this month</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Remaining</Card.Title>
					<Card.Description>Available balance for the month</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-3xl font-bold text-emerald-500">
						{formatCurrency(remainingBudget)}
					</p>
				</Card.Content>
			</Card.Root>
		</div>

		<Card.Root>
			<Card.Header>
				<Card.Title>Milestone Progress</Card.Title>
				<Card.Description>Project Initialization & Core Architecture</Card.Description>
			</Card.Header>

			<Card.Content>
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li>✅ Issue 1.1: SvelteKit + TypeScript initialized</li>
					<li>✅ Issue 1.2: shadcn-svelte UI framework configured</li>
					<li>⬜ Issue 1.3: Tauri 2 desktop/mobile setup</li>
					<li>⬜ Issue 1.4: Tauri SQL plugin + SQLite setup</li>
				</ul>
			</Card.Content>
		</Card.Root>
	</section>
</main>