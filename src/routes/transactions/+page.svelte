<script lang="ts">
	import { resolve } from '$app/paths';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		createTransaction,
		deleteTransaction,
		subscribeToTransactions
	} from '$lib/services/transactions';
	import { currentUser } from '$lib/stores/auth';
	import type { PaymentMethod, Transaction, TransactionType } from '$lib/types/finance';

	let type = $state<TransactionType>('expense');
	let amount = $state('');
	let category = $state('Food');
	let paymentMethod = $state<PaymentMethod>('e_wallet');
	let note = $state('');
	let transactionDate = $state(new Date().toISOString().slice(0, 10));

	let transactions = $state<Transaction[]>([]);
	let message = $state('');
	let saving = $state(false);

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

	function formatCurrency(value: number) {
		return new Intl.NumberFormat('en-MY', {
			style: 'currency',
			currency: 'MYR'
		}).format(value);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!$currentUser) {
			message = 'Please log in first.';
			return;
		}

		if (!amount || Number(amount) <= 0) {
			message = 'Please enter a valid amount.';
			return;
		}

		saving = true;
		message = '';

		try {
			await createTransaction($currentUser.uid, {
				type,
				amount: Number(amount),
				category,
				paymentMethod,
				note,
				transactionDate
			});

			amount = '';
			note = '';
			category = 'Food';
			paymentMethod = 'e_wallet';
			type = 'expense';
			transactionDate = new Date().toISOString().slice(0, 10);

			message = 'Transaction saved.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Failed to save transaction.';
		} finally {
			saving = false;
		}
	}

	async function handleDelete(transactionId: string) {
		if (!$currentUser) return;

		await deleteTransaction($currentUser.uid, transactionId);
	}
</script>

<svelte:head>
	<title>Transactions | SpendWise</title>
</svelte:head>

<main class="min-h-screen bg-background px-6 py-10 text-foreground">
	<section class="mx-auto max-w-6xl space-y-8">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Transactions</h1>
				<p class="text-muted-foreground">Add income and expenses to your Firestore database.</p>
			</div>

			<a href={resolve('/login')} class="text-sm text-muted-foreground underline">Login page</a>
		</div>

		{#if !$currentUser}
			<Card.Root>
				<Card.Header>
					<Card.Title>Please log in first</Card.Title>
					<Card.Description>You need an account before adding transactions.</Card.Description>
				</Card.Header>

				<Card.Content>
					<a href={resolve('/login')}>
						<Button>Go to Login</Button>
					</a>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-6 lg:grid-cols-[420px_1fr]">
				<Card.Root>
					<Card.Header>
						<Card.Title>Add Transaction</Card.Title>
						<Card.Description>Save a new expense or income record.</Card.Description>
					</Card.Header>

					<Card.Content>
						<form class="space-y-4" onsubmit={handleSubmit}>
							<div class="space-y-2">
								<Label for="type">Type</Label>
								<select
									id="type"
									bind:value={type}
									class="w-full rounded-md border bg-background px-3 py-2 text-sm"
								>
									<option value="expense">Expense</option>
									<option value="income">Income</option>
								</select>
							</div>

							<div class="space-y-2">
								<Label for="amount">Amount</Label>
								<Input id="amount" type="number" step="0.01" min="0" bind:value={amount} />
							</div>

							<div class="space-y-2">
								<Label for="category">Category</Label>
								<select
									id="category"
									bind:value={category}
									class="w-full rounded-md border bg-background px-3 py-2 text-sm"
								>
									<option>Food</option>
									<option>Transport</option>
									<option>Shopping</option>
									<option>Entertainment</option>
									<option>Subscriptions</option>
									<option>Salary</option>
									<option>Allowance</option>
									<option>Other</option>
								</select>
							</div>

							<div class="space-y-2">
								<Label for="paymentMethod">Payment Method</Label>
								<select
									id="paymentMethod"
									bind:value={paymentMethod}
									class="w-full rounded-md border bg-background px-3 py-2 text-sm"
								>
									<option value="cash">Cash</option>
									<option value="card">Card</option>
									<option value="bank_transfer">Bank Transfer</option>
									<option value="e_wallet">E-Wallet</option>
									<option value="other">Other</option>
								</select>
							</div>

							<div class="space-y-2">
								<Label for="transactionDate">Date</Label>
								<Input id="transactionDate" type="date" bind:value={transactionDate} />
							</div>

							<div class="space-y-2">
								<Label for="note">Note</Label>
								<Input id="note" bind:value={note} placeholder="Example: Lunch, Grab, rent..." />
							</div>

							<Button class="w-full" type="submit" disabled={saving}>
								{saving ? 'Saving...' : 'Save Transaction'}
							</Button>

							{#if message}
								<p class="text-sm text-muted-foreground">{message}</p>
							{/if}
						</form>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Transaction List</Card.Title>
						<Card.Description>
							Logged in as {$currentUser.email}
						</Card.Description>
					</Card.Header>

					<Card.Content>
						{#if transactions.length === 0}
							<p class="text-sm text-muted-foreground">No transactions yet.</p>
						{:else}
							<div class="space-y-3">
								{#each transactions as transaction (transaction.id)}
									<div class="flex items-center justify-between rounded-lg border p-4">
										<div>
											<p class="font-medium">
												{transaction.category}
												<span class="text-sm text-muted-foreground">
													· {transaction.type}
												</span>
											</p>

											<p class="text-sm text-muted-foreground">
												{transaction.transactionDate} · {transaction.paymentMethod}
												{#if transaction.note}
													· {transaction.note}
												{/if}
											</p>
										</div>

										<div class="flex items-center gap-3">
											<p
												class={transaction.type === 'income'
													? 'font-semibold text-emerald-500'
													: 'font-semibold text-red-500'}
											>
												{transaction.type === 'income' ? '+' : '-'}
												{formatCurrency(transaction.amount)}
											</p>

											<Button
												variant="secondary"
												size="sm"
												onclick={() => handleDelete(transaction.id)}
											>
												Delete
											</Button>
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
