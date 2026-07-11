<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		createCategory,
		deleteCategory,
		subscribeToCategories
	} from '$lib/services/categories';
	import { currentUser } from '$lib/stores/auth';
	import type { Category, CategoryType } from '$lib/types/category';
	import { DEFAULT_CATEGORIES, getMergedCategories } from '$lib/types/category';

	let customCategories = $state<Category[]>([]);
	let name = $state('');
	let categoryType = $state<CategoryType>('expense');
	let message = $state('');
	let saving = $state(false);

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

	const mergedCategories = $derived(getMergedCategories(customCategories));
	const expenseCategories = $derived(
		mergedCategories.filter((category) => category.type === 'expense' || category.type === 'both')
	);
	const incomeCategories = $derived(
		mergedCategories.filter((category) => category.type === 'income' || category.type === 'both')
	);

	function normalizeName(value: string): string {
		return value.trim().toLowerCase();
	}

	function getTypeLabel(type: CategoryType): string {
		if (type === 'both') {
			return 'Income & Expense';
		}

		return type === 'income' ? 'Income' : 'Expense';
	}

	function getTypeBadgeClass(type: CategoryType): string {
		if (type === 'income') {
			return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
		}

		if (type === 'expense') {
			return 'border-red-500/30 bg-red-500/10 text-red-300';
		}

		return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
	}

	async function handleCreateCategory(event: SubmitEvent) {
		event.preventDefault();

		if (!$currentUser) {
			message = 'Please log in first.';
			return;
		}

		const trimmedName = name.trim();

		if (!trimmedName) {
			message = 'Please enter a category name.';
			return;
		}

		const alreadyExists = mergedCategories.some(
			(category) => normalizeName(category.name) === normalizeName(trimmedName)
		);

		if (alreadyExists) {
			message = 'This category already exists.';
			return;
		}

		saving = true;
		message = '';

		try {
			await createCategory($currentUser.uid, {
				name: trimmedName,
				type: categoryType
			});

			name = '';
			categoryType = 'expense';
			message = 'Category created successfully.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Failed to create category.';
		} finally {
			saving = false;
		}
	}

	async function handleDeleteCategory(categoryId: string) {
		if (!$currentUser) return;

		const confirmed = window.confirm(
			'Delete this category? Existing transactions will keep the category name.'
		);

		if (!confirmed) return;

		try {
			await deleteCategory($currentUser.uid, categoryId);
			message = 'Category deleted.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Failed to delete category.';
		}
	}
</script>

<svelte:head>
	<title>Categories | SpendWise</title>
</svelte:head>

<main class="min-h-screen px-4 py-8 text-foreground sm:px-6 lg:px-8">
	<section class="mx-auto max-w-7xl space-y-8">
		<div
			class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/10 via-card/70 to-emerald-500/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"
		>
			<div class="absolute right-[-4rem] top-[-4rem] h-72 w-72 rounded-full bg-purple-400/10 blur-3xl"></div>
			<div class="absolute bottom-[-5rem] left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"></div>

			<div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div class="space-y-4">
					<div class="flex flex-wrap items-center gap-3">
						<Badge class="border border-purple-500/30 bg-purple-500/10 text-purple-300">
							Category Studio
						</Badge>

						<Badge variant="secondary">
							{mergedCategories.length} total categories
						</Badge>
					</div>

					<div>
						<h1 class="text-4xl font-black tracking-tight sm:text-5xl">
							Organize spending your way.
						</h1>

						<p class="mt-3 max-w-2xl text-muted-foreground">
							Create custom income and expense categories so your transactions match how you
							actually spend.
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
					<Card.Description>You need an account before managing categories.</Card.Description>
				</Card.Header>

				<Card.Content>
					<a href={resolve('/login')}>
						<Button>Go to Login</Button>
					</a>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-3">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Custom Categories</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black">{customCategories.length}</p>
						<p class="mt-2 text-sm text-muted-foreground">Created by you</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Expense Categories</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black text-red-400">{expenseCategories.length}</p>
						<p class="mt-2 text-sm text-muted-foreground">Available for expenses</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title class="text-sm text-muted-foreground">Income Categories</Card.Title>
					</Card.Header>

					<Card.Content>
						<p class="text-4xl font-black text-emerald-400">{incomeCategories.length}</p>
						<p class="mt-2 text-sm text-muted-foreground">Available for income</p>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="grid gap-6 xl:grid-cols-[430px_1fr]">
				<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
					<Card.Header>
						<Card.Title>Create Category</Card.Title>
						<Card.Description>Add a new custom category to your account.</Card.Description>
					</Card.Header>

					<Card.Content>
						<form class="space-y-4" onsubmit={handleCreateCategory}>
							<div class="space-y-2">
								<Label for="categoryName">Category Name</Label>
								<Input
									id="categoryName"
									bind:value={name}
									placeholder="Example: Rent, Groceries, Freelance"
								/>
							</div>

							<div class="space-y-2">
								<Label for="categoryType">Category Type</Label>
								<select
									id="categoryType"
									bind:value={categoryType}
									class="w-full rounded-md border border-white/10 bg-background/60 px-3 py-2 text-sm"
								>
									<option value="expense">Expense</option>
									<option value="income">Income</option>
									<option value="both">Income & Expense</option>
								</select>
							</div>

							<div class="grid grid-cols-3 gap-2">
								<button
									type="button"
									class={categoryType === 'expense'
										? 'rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-300'
										: 'rounded-2xl border border-white/10 bg-background/40 p-3 text-sm text-muted-foreground hover:bg-muted/50'}
									onclick={() => {
										categoryType = 'expense';
									}}
								>
									Expense
								</button>

								<button
									type="button"
									class={categoryType === 'income'
										? 'rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300'
										: 'rounded-2xl border border-white/10 bg-background/40 p-3 text-sm text-muted-foreground hover:bg-muted/50'}
									onclick={() => {
										categoryType = 'income';
									}}
								>
									Income
								</button>

								<button
									type="button"
									class={categoryType === 'both'
										? 'rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm font-semibold text-cyan-300'
										: 'rounded-2xl border border-white/10 bg-background/40 p-3 text-sm text-muted-foreground hover:bg-muted/50'}
									onclick={() => {
										categoryType = 'both';
									}}
								>
									Both
								</button>
							</div>

							<Button class="w-full" type="submit" disabled={saving}>
								{saving ? 'Saving...' : 'Create Category'}
							</Button>

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
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<Card.Title>Custom Categories</Card.Title>
									<Card.Description>
										Manage the categories you created yourself.
									</Card.Description>
								</div>

								<Badge variant="secondary">{customCategories.length} custom</Badge>
							</div>
						</Card.Header>

						<Card.Content>
							{#if customCategories.length === 0}
								<div class="rounded-2xl border border-dashed border-white/10 p-10 text-center">
									<p class="font-semibold">No custom categories yet</p>
									<p class="mt-2 text-sm text-muted-foreground">
										Create categories like Rent, Coffee, Grab, University, or Freelance Income.
									</p>
								</div>
							{:else}
								<div class="grid gap-3 md:grid-cols-2">
									{#each customCategories as category (category.id)}
										<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-lg font-bold">{category.name}</p>

													<span
														class={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getTypeBadgeClass(
															category.type
														)}`}
													>
														{getTypeLabel(category.type)}
													</span>
												</div>

												<Button
													variant="destructive"
													size="sm"
													onclick={() => handleDeleteCategory(category.id)}
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

					<Card.Root class="border-white/10 bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
						<Card.Header>
							<Card.Title>Default Categories</Card.Title>
							<Card.Description>These categories are always available in SpendWise.</Card.Description>
						</Card.Header>

						<Card.Content>
							<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{#each DEFAULT_CATEGORIES as category (category.id)}
									<div class="rounded-2xl border border-white/10 bg-background/50 p-4">
										<div class="flex items-start justify-between gap-3">
											<div>
												<p class="font-bold">{category.name}</p>

												<span
													class={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getTypeBadgeClass(
														category.type
													)}`}
												>
													{getTypeLabel(category.type)}
												</span>
											</div>

											<Badge variant="secondary">Default</Badge>
										</div>
									</div>
								{/each}
							</div>
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		{/if}
	</section>
</main>