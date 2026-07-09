<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { saveBudgetSettings, subscribeToBudgetSettings } from '$lib/services/budget';
	import { currentUser } from '$lib/stores/auth';

	let monthlyBudget = $state('1200');
	let currency = $state('MYR');
	let message = $state('');
	let saving = $state(false);

	$effect(() => {
		const userId = $currentUser?.uid;

		if (!userId) {
			monthlyBudget = '1200';
			currency = 'MYR';
			return;
		}

		const unsubscribe = subscribeToBudgetSettings(userId, (settings) => {
			monthlyBudget = String(settings.monthlyBudget);
			currency = settings.currency;
		});

		return () => {
			unsubscribe();
		};
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!$currentUser) {
			message = 'Please log in first.';
			return;
		}

		const budgetValue = Number(monthlyBudget);

		if (!monthlyBudget || Number.isNaN(budgetValue) || budgetValue <= 0) {
			message = 'Please enter a valid monthly budget.';
			return;
		}

		saving = true;
		message = '';

		try {
			await saveBudgetSettings($currentUser.uid, budgetValue, currency);
			message = 'Budget settings saved.';
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

<main class="min-h-screen bg-background px-6 py-10 text-foreground">
	<section class="mx-auto max-w-3xl space-y-8">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Budget Settings</h1>
			<p class="mt-2 text-muted-foreground">
				Set your monthly spending limit. This will be used for your dashboard budget health.
			</p>
		</div>

		{#if !$currentUser}
			<Card.Root>
				<Card.Header>
					<Card.Title>Please log in first</Card.Title>
					<Card.Description>You need an account before setting a monthly budget.</Card.Description>
				</Card.Header>

				<Card.Content>
					<a href={resolve('/login')}>
						<Button>Go to Login</Button>
					</a>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root>
				<Card.Header>
					<Card.Title>Monthly Budget</Card.Title>
					<Card.Description>
						This budget will be stored under your Firebase user account.
					</Card.Description>
				</Card.Header>

				<Card.Content>
					<form class="space-y-5" onsubmit={handleSubmit}>
						<div class="space-y-2">
							<Label for="monthlyBudget">Monthly Budget</Label>
							<Input
								id="monthlyBudget"
								type="number"
								min="0"
								step="0.01"
								bind:value={monthlyBudget}
								placeholder="Example: 1200"
							/>
						</div>

						<div class="space-y-2">
							<Label for="currency">Currency</Label>
							<select
								id="currency"
								bind:value={currency}
								class="w-full rounded-md border bg-background px-3 py-2 text-sm"
							>
								<option value="MYR">MYR</option>
								<option value="USD">USD</option>
								<option value="INR">INR</option>
							</select>
						</div>

						<Button type="submit" disabled={saving}>
							{saving ? 'Saving...' : 'Save Budget'}
						</Button>

						{#if message}
							<p class="text-sm text-muted-foreground">{message}</p>
						{/if}
					</form>
				</Card.Content>
			</Card.Root>
		{/if}
	</section>
</main>