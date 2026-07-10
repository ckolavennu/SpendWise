<script lang="ts">
    import { goto } from '$app/navigation';
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

	function normalizeName(value: string): string {
		return value.trim().toLowerCase();
	}

	function getTypeLabel(type: CategoryType): string {
		if (type === 'both') {
			return 'Income & Expense';
		}

		return type === 'income' ? 'Income' : 'Expense';
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

<main class="min-h-screen bg-background px-6 py-10 text-foreground">
	<section class="mx-auto max-w-6xl space-y-8">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Categories</h1>
				<p class="mt-2 text-muted-foreground">
					Create custom income and expense categories for better tracking.
				</p>
			</div>

			<Button variant="secondary" onclick={() => goto(resolve('/transactions'))}>Back to Transactions</Button>
		</div>

		{#if !$currentUser}
			<Card.Root>
				<Card.Header>
					<Card.Title>Please log in first</Card.Title>
					<Card.Description>You need an account before managing categories.</Card.Description>
				</Card.Header>

				<Card.Content>
					<Button onclick={() => goto(resolve('/login'))}>Go to Login</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-6 lg:grid-cols-[420px_1fr]">
				<Card.Root>
					<Card.Header>
						<Card.Title>Create Category</Card.Title>
						<Card.Description>Add your own custom category.</Card.Description>
					</Card.Header>

					<Card.Content>
						<form class="space-y-4" onsubmit={handleCreateCategory}>
							<div class="space-y-2">
								<Label for="categoryName">Category Name</Label>
								<Input
									id="categoryName"
									bind:value={name}
									placeholder="Example: Groceries, Rent, Freelance"
								/>
							</div>

							<div class="space-y-2">
								<Label for="categoryType">Category Type</Label>
								<select
									id="categoryType"
									bind:value={categoryType}
									class="w-full rounded-md border bg-background px-3 py-2 text-sm"
								>
									<option value="expense">Expense</option>
									<option value="income">Income</option>
									<option value="both">Income & Expense</option>
								</select>
							</div>

							<Button class="w-full" type="submit" disabled={saving}>
								{saving ? 'Saving...' : 'Create Category'}
							</Button>

							{#if message}
								<p class="text-sm text-muted-foreground">{message}</p>
							{/if}
						</form>
					</Card.Content>
				</Card.Root>

				<div class="space-y-6">
					<Card.Root>
						<Card.Header>
							<Card.Title>Custom Categories</Card.Title>
							<Card.Description>
								You have {customCategories.length} custom categories.
							</Card.Description>
						</Card.Header>

						<Card.Content>
							{#if customCategories.length === 0}
								<div class="rounded-xl border border-dashed p-8 text-center">
									<p class="font-medium">No custom categories yet</p>
									<p class="mt-1 text-sm text-muted-foreground">
										Create categories like Rent, Groceries, Grab, Coffee, or Freelance Income.
									</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each customCategories as category (category.id)}
										<div
											class="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
										>
											<div>
												<p class="font-semibold">{category.name}</p>
												<p class="mt-1 text-sm text-muted-foreground">
													{getTypeLabel(category.type)}
												</p>
											</div>

											<div class="flex items-center gap-3">
												<Badge variant="secondary">{getTypeLabel(category.type)}</Badge>

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

					<Card.Root>
						<Card.Header>
							<Card.Title>Default Categories</Card.Title>
							<Card.Description>These are always available in SpendWise.</Card.Description>
						</Card.Header>

						<Card.Content>
							<div class="grid gap-3 sm:grid-cols-2">
								{#each DEFAULT_CATEGORIES as category (category.id)}
									<div class="rounded-xl border bg-muted/30 p-4">
										<div class="flex items-center justify-between gap-3">
											<p class="font-medium">{category.name}</p>
											<Badge variant="secondary">{getTypeLabel(category.type)}</Badge>
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