<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
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

	function formatDate(dateValue: string) {
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

	function formatPaymentMethod(value: PaymentMethod) {
		return value.replace(/_/g, ' ');
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

<main class="min-h-screen px-4 py-8 text-foreground sm:px-6 lg:px-8">
	<section class="mx-auto max-w-7xl space-y-8">
		<div
			class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-card/70 to-emerald-500/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"
		>
			<div class="absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"></div>

			<div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div class="space-y-3">
					<Badge class="border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
						Transaction Control
					</Badge>

					<div>
						<h1 class="text-4xl font-black tracking-tight sm:text-5xl">Transactions</h1>
						<p class="mt-3 max-w-2xl text-muted-foreground">
							Add, edit, filter, and manage every income or expense record from one clean
							workspace.
						</p>
					</div>
				</div>

				<div class="flex flex-wrap gap-3">
					<a
						href={resolve('/categories')}
						class="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
					>
						Manage Categories
					</a>

					<a
						href={resolve('/')}
						class="inline-flex h-9 items-center justify-center rounded-md border border-white/10 bg-background/50 px-4 text-sm font-medium transition hover:bg-muted"
					>
						Dashboard
					</a>
				</div>
			</div>
		</div>

		{#if !$currentUser}
			<Card.Root class="border-white/10 bg-card/80 shadow-xl backdrop-blur">
				<Card.Header>
					<Card.Title>Please log in first</Card.Title>
					<Card.Description>You need an account before adding transactions.</Card.Description>
				</Card.Header>

				<Card.Content>
					<a
						href={resolve('/login')}
						class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
					>
						Go to Login
					</a>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-3">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Filtered Income</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-3xl font-black text-emerald-400">{formatCurrency(totalIncome)}</p>
						<p class="mt-2 text-sm text-muted-foreground">Income in current view</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Filtered Expenses</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-3xl font-black text-red-400">{formatCurrency(totalExpenses)}</p>
						<p class="mt-2 text-sm text-muted-foreground">Expenses in current view</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Net Amount</Card.Title>
					</Card.Header>
					<Card.Content>
						<p
							class={netAmount >= 0
								? 'text-3xl font-black text-emerald-400'
								: 'text-3xl font-black text-red-400'}
						>
							{formatCurrency(netAmount)}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">Income minus expenses</p>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="grid gap-6 xl:grid-cols-[430px_1fr]">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<div class="flex items-center justify-between gap-4">
							<div>
								<Card.Title>
									{editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
								</Card.Title>
								<Card.Description>
									{editingTransactionId
										? 'Update the selected record.'
										: 'Save a new income or expense.'}
								</Card.Description>
							</div>

							{#if editingTransactionId}
								<Badge class="border border-amber-500/30 bg-amber-500/10 text-amber-300">
									Editing
								</Badge>
							{/if}
						</div>
					</Card.Header>

					<Card.Content>
						<form class="space-y-4" onsubmit={handleSubmit}>
							<div class="grid grid-cols-2 gap-3">
								<button
									type="button"
									class={type === 'expense'
										? 'rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-left'
										: 'rounded-2xl border border-white/10 bg-background/40 p-4 text-left hover:bg-muted/50'}
									onclick={() => {
										type = 'expense';
									}}
								>
									<p class="text-sm font-semibold">Expense</p>
									<p class="mt-1 text-xs text-muted-foreground">Money going out</p>
								</button>

								<button
									type="button"
									class={type === 'income'
										? 'rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left'
										: 'rounded-2xl border border-white/10 bg-background/40 p-4 text-left hover:bg-muted/50'}
									onclick={() => {
										type = 'income';
									}}
								>
									<p class="text-sm font-semibold">Income</p>
									<p class="mt-1 text-xs text-muted-foreground">Money coming in</p>
								</button>
							</div>

							<div class="space-y-2">
								<Label for="amount">Amount</Label>
								<Input
									id="amount"
									type="number"
									step="0.01"
									min="0"
									bind:value={amount}
									placeholder="0.00"
								/>
							</div>

							<div class="space-y-2">
								<Label for="category">Category</Label>
								<select
									id="category"
									bind:value={category}
									class="w-full rounded-md border border-white/10 bg-background/60 px-3 py-2 text-sm"
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
									class="w-full rounded-md border border-white/10 bg-background/60 px-3 py-2 text-sm"
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
								<div class="rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
									{message}
								</div>
							{/if}
						</form>
					</Card.Content>
				</Card.Root>

				<div class="space-y-6">
					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title>Filters</Card.Title>
							<Card.Description>Search and narrow down your records.</Card.Description>
						</Card.Header>

						<Card.Content>
							<div class="grid gap-4 lg:grid-cols-[1fr_160px_180px_auto] lg:items-end">
								<div class="space-y-2">
									<Label for="search">Search</Label>
									<Input
										id="search"
										bind:value={searchQuery}
										placeholder="Search category, note, method, date..."
									/>
								</div>

								<div class="space-y-2">
									<Label for="typeFilter">Type</Label>
									<select
										id="typeFilter"
										bind:value={typeFilter}
										class="w-full rounded-md border border-white/10 bg-background/60 px-3 py-2 text-sm"
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
										class="w-full rounded-md border border-white/10 bg-background/60 px-3 py-2 text-sm"
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

					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<Card.Title>Transaction List</Card.Title>
									<Card.Description>
										Showing {filteredTransactions.length} of {transactions.length} records.
									</Card.Description>
								</div>

								<Badge variant="secondary">
									{filteredTransactions.length} shown
								</Badge>
							</div>
						</Card.Header>

						<Card.Content>
							{#if filteredTransactions.length === 0}
								<div class="rounded-2xl border border-dashed border-white/10 p-10 text-center">
									<p class="font-semibold">No transactions found</p>
									<p class="mt-2 text-sm text-muted-foreground">
										Try clearing filters or adding a new transaction.
									</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each filteredTransactions as transaction (transaction.id)}
										<div
											class={editingTransactionId === transaction.id
												? 'rounded-2xl border border-primary/50 bg-primary/10 p-4 shadow-lg'
												: 'rounded-2xl border border-white/10 bg-background/50 p-4 transition hover:bg-muted/30'}
										>
											<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
												<div class="space-y-2">
													<div class="flex flex-wrap items-center gap-2">
														<p class="text-lg font-bold">{transaction.category}</p>

														<span
															class={transaction.type === 'income'
																? 'rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400'
																: 'rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400'}
														>
															{transaction.type}
														</span>
													</div>

													<p class="text-sm text-muted-foreground">
														{formatDate(transaction.transactionDate)} · {formatPaymentMethod(
															transaction.paymentMethod
														)}
														{#if transaction.note}
															· {transaction.note}
														{/if}
													</p>
												</div>

												<div class="flex flex-wrap items-center gap-3 lg:justify-end">
													<p
														class={transaction.type === 'income'
															? 'text-xl font-black text-emerald-400'
															: 'text-xl font-black text-red-400'}
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