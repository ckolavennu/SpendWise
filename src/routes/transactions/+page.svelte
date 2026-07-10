<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { subscribeToCategories } from '$lib/services/categories';
	import {
		createTransaction,
		deleteTransaction,
		subscribeToTransactions,
		updateTransaction
	} from '$lib/services/transactions';
	import { currentUser } from '$lib/stores/auth';
	import type { Category } from '$lib/types/category';
	import { getAvailableCategories, getMergedCategories } from '$lib/types/category';
	import type { PaymentMethod, Transaction, TransactionType } from '$lib/types/finance';

	const paymentMethods: { value: PaymentMethod; label: string }[] = [
		{ value: 'cash', label: 'Cash' },
		{ value: 'card', label: 'Card' },
		{ value: 'bank_transfer', label: 'Bank Transfer' },
		{ value: 'e_wallet', label: 'E-Wallet' },
		{ value: 'other', label: 'Other' }
	];

	let type = $state<TransactionType>('expense');
	let amount = $state('');
	let category = $state('Food');
	let paymentMethod = $state<PaymentMethod>('e_wallet');
	let note = $state('');
	let transactionDate = $state(new Date().toISOString().slice(0, 10));

	let transactions = $state<Transaction[]>([]);
	let customCategories = $state<Category[]>([]);
	let message = $state('');
	let saving = $state(false);
	let editingTransactionId = $state<string | null>(null);

	let searchQuery = $state('');
	let typeFilter = $state<'all' | TransactionType>('all');
	let categoryFilter = $state('all');

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
			customCategories = [];
			return;
		}

		const unsubscribe = subscribeToCategories(userId, (items) => {
			customCategories = items;
		});

		return () => {
			unsubscribe();
		};
	});

	const categoryOptions = $derived(getAvailableCategories(customCategories, type));
	const filterCategoryOptions = $derived(getMergedCategories(customCategories));

	$effect(() => {
		const categoryStillAvailable = categoryOptions.some((option) => option.name === category);

		if (!categoryStillAvailable) {
			category = categoryOptions[0]?.name ?? 'Other';
		}
	});

	const filteredTransactions = $derived(
		transactions.filter((transaction) => {
			const searchText =
				`${transaction.category} ${transaction.note} ${transaction.paymentMethod} ${transaction.transactionDate}`.toLowerCase();
			const matchesSearch = searchText.includes(searchQuery.toLowerCase().trim());
			const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
			const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;

			return matchesSearch && matchesType && matchesCategory;
		})
	);

	const totalIncome = $derived(
		filteredTransactions
			.filter((transaction) => transaction.type === 'income')
			.reduce((sum, transaction) => sum + transaction.amount, 0)
	);

	const totalExpenses = $derived(
		filteredTransactions
			.filter((transaction) => transaction.type === 'expense')
			.reduce((sum, transaction) => sum + transaction.amount, 0)
	);

	const netAmount = $derived(totalIncome - totalExpenses);

	function formatCurrency(value: number) {
		return new Intl.NumberFormat('en-MY', {
			style: 'currency',
			currency: 'MYR'
		}).format(value);
	}

	function resetForm() {
		type = 'expense';
		amount = '';
		category = categoryOptions[0]?.name ?? 'Food';
		paymentMethod = 'e_wallet';
		note = '';
		transactionDate = new Date().toISOString().slice(0, 10);
		editingTransactionId = null;
		message = '';
	}

	function startEdit(transaction: Transaction) {
		editingTransactionId = transaction.id;
		type = transaction.type;
		amount = String(transaction.amount);
		category = transaction.category;
		paymentMethod = transaction.paymentMethod;
		note = transaction.note;
		transactionDate = transaction.transactionDate;
		message = 'Editing transaction.';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!$currentUser) {
			message = 'Please log in first.';
			return;
		}

		const amountValue = Number(amount);

		if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
			message = 'Please enter a valid amount.';
			return;
		}

		saving = true;
		message = '';

		try {
			const transactionInput = {
				type,
				amount: amountValue,
				category,
				paymentMethod,
				note,
				transactionDate
			};

			if (editingTransactionId) {
				await updateTransaction($currentUser.uid, editingTransactionId, transactionInput);
				message = 'Transaction updated.';
			} else {
				await createTransaction($currentUser.uid, transactionInput);
				message = 'Transaction saved.';
			}

			resetForm();
		} catch (error) {
			message = error instanceof Error ? error.message : 'Failed to save transaction.';
		} finally {
			saving = false;
		}
	}

	async function handleDelete(transactionId: string) {
		if (!$currentUser) return;

		const confirmed = window.confirm('Delete this transaction? This cannot be undone.');

		if (!confirmed) return;

		await deleteTransaction($currentUser.uid, transactionId);

		if (editingTransactionId === transactionId) {
			resetForm();
		}
	}

	function clearFilters() {
		searchQuery = '';
		typeFilter = 'all';
		categoryFilter = 'all';
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
				<p class="text-muted-foreground">Add, edit, filter, and manage your financial records.</p>
			</div>

			<div class="flex flex-wrap gap-3">
				<Button variant="secondary" onclick={() => goto(resolve('/categories'))}>Manage Categories</Button>
				<Button variant="secondary" onclick={() => goto(resolve('/'))}>Back to Dashboard</Button>			</div>
		</div>

		{#if !$currentUser}
			<Card.Root>
				<Card.Header>
					<Card.Title>Please log in first</Card.Title>
					<Card.Description>You need an account before adding transactions.</Card.Description>
				</Card.Header>

				<Card.Content>
					<Button onclick={() => goto(resolve('/login'))}>Go to Login</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-3">
				<Card.Root>
					<Card.Header>
						<Card.Title>Filtered Income</Card.Title>
						<Card.Description>Income in current view</Card.Description>
					</Card.Header>
					<Card.Content>
						<p class="text-3xl font-bold text-emerald-500">{formatCurrency(totalIncome)}</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Filtered Expenses</Card.Title>
						<Card.Description>Expenses in current view</Card.Description>
					</Card.Header>
					<Card.Content>
						<p class="text-3xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Net Amount</Card.Title>
						<Card.Description>Income minus expenses</Card.Description>
					</Card.Header>
					<Card.Content>
						<p
							class={netAmount >= 0
								? 'text-3xl font-bold text-emerald-500'
								: 'text-3xl font-bold text-red-500'}
						>
							{formatCurrency(netAmount)}
						</p>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="grid gap-6 lg:grid-cols-[420px_1fr]">
				<Card.Root>
					<Card.Header>
						<Card.Title>
							{editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
						</Card.Title>
						<Card.Description>
							{editingTransactionId
								? 'Update the selected transaction record.'
								: 'Save a new income or expense record.'}
						</Card.Description>
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
									{#each categoryOptions as categoryOption (categoryOption.id)}
										<option value={categoryOption.name}>{categoryOption.name}</option>
									{/each}
								</select>
							</div>

							<div class="space-y-2">
								<Label for="paymentMethod">Payment Method</Label>
								<select
									id="paymentMethod"
									bind:value={paymentMethod}
									class="w-full rounded-md border bg-background px-3 py-2 text-sm"
								>
									{#each paymentMethods as method (method.value)}
										<option value={method.value}>{method.label}</option>
									{/each}
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

							<div class="grid gap-3 sm:grid-cols-2">
								<Button class="w-full" type="submit" disabled={saving}>
									{#if saving}
										Saving...
									{:else if editingTransactionId}
										Update
									{:else}
										Save
									{/if}
								</Button>

								<Button class="w-full" type="button" variant="secondary" onclick={resetForm}>
									Clear
								</Button>
							</div>

							{#if message}
								<p class="text-sm text-muted-foreground">{message}</p>
							{/if}
						</form>
					</Card.Content>
				</Card.Root>

				<div class="space-y-6">
					<Card.Root>
						<Card.Header>
							<Card.Title>Filters</Card.Title>
							<Card.Description>Search and narrow down your records.</Card.Description>
						</Card.Header>

						<Card.Content>
							<div class="grid gap-4 md:grid-cols-[1fr_160px_180px_auto] md:items-end">
								<div class="space-y-2">
									<Label for="search">Search</Label>
									<Input
										id="search"
										bind:value={searchQuery}
										placeholder="Search category, note, date..."
									/>
								</div>

								<div class="space-y-2">
									<Label for="typeFilter">Type</Label>
									<select
										id="typeFilter"
										bind:value={typeFilter}
										class="w-full rounded-md border bg-background px-3 py-2 text-sm"
									>
										<option value="all">All</option>
										<option value="income">Income</option>
										<option value="expense">Expense</option>
									</select>
								</div>

								<div class="space-y-2">
									<Label for="categoryFilter">Category</Label>
									<select
										id="categoryFilter"
										bind:value={categoryFilter}
										class="w-full rounded-md border bg-background px-3 py-2 text-sm"
									>
										<option value="all">All</option>
										{#each filterCategoryOptions as categoryOption (categoryOption.id)}
											<option value={categoryOption.name}>{categoryOption.name}</option>
										{/each}
									</select>
								</div>

								<Button type="button" variant="secondary" onclick={clearFilters}>
									Clear
								</Button>
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>Transaction List</Card.Title>
							<Card.Description>
								Showing {filteredTransactions.length} of {transactions.length} records.
							</Card.Description>
						</Card.Header>

						<Card.Content>
							{#if filteredTransactions.length === 0}
								<div class="rounded-xl border border-dashed p-8 text-center">
									<p class="font-medium">No transactions found</p>
									<p class="mt-1 text-sm text-muted-foreground">
										Try clearing your filters or adding a new transaction.
									</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each filteredTransactions as transaction (transaction.id)}
										<div
											class={editingTransactionId === transaction.id
												? 'rounded-xl border border-primary bg-muted/40 p-4'
												: 'rounded-xl border bg-card p-4'}
										>
											<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
												<div class="space-y-1">
													<div class="flex flex-wrap items-center gap-2">
														<p class="font-semibold">{transaction.category}</p>

														<span
															class={transaction.type === 'income'
																? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500'
																: 'rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500'}
														>
															{transaction.type}
														</span>
													</div>

													<p class="text-sm text-muted-foreground">
														{transaction.transactionDate} · {transaction.paymentMethod}
														{#if transaction.note}
															· {transaction.note}
														{/if}
													</p>
												</div>

												<div class="flex flex-wrap items-center gap-3 md:justify-end">
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
														onclick={() => startEdit(transaction)}
													>
														Edit
													</Button>

													<Button
														variant="destructive"
														size="sm"
														onclick={() => handleDelete(transaction.id)}
													>
														Delete
													</Button>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		{/if}
	</section>
</main>