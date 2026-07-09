<script lang="ts">
	import { formatCurrency } from '$lib/utils/money';

	const monthlyBudget = 1200;
	const totalSpent = 350;
	const remainingBudget = monthlyBudget - totalSpent;
</script>

<svelte:head>
	<title>SpendWise</title>
	<meta
		name="description"
		content="A budgeting and expense tracking app built with SvelteKit, Tauri, and SQLite."
	/>
</svelte:head>

<main class="min-h-screen bg-slate-950 px-6 py-10 text-white">
	<section class="mx-auto max-w-5xl space-y-8">
		<div>
			<p class="text-sm font-medium uppercase tracking-wide text-emerald-400">SpendWise</p>
			<h1 class="mt-2 text-4xl font-bold tracking-tight">Budget smarter. Spend clearer.</h1>
			<p class="mt-3 max-w-2xl text-slate-300">
				A local-first budgeting and expense tracking app for desktop and Android.
			</p>
		</div>

		<div class="grid gap-4 md:grid-cols-3">
			<div class="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
				<p class="text-sm text-slate-400">Monthly Budget</p>
				<p class="mt-2 text-3xl font-semibold">{formatCurrency(monthlyBudget)}</p>
			</div>

			<div class="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
				<p class="text-sm text-slate-400">Total Spent</p>
				<p class="mt-2 text-3xl font-semibold">{formatCurrency(totalSpent)}</p>
			</div>

			<div class="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
				<p class="text-sm text-slate-400">Remaining</p>
				<p class="mt-2 text-3xl font-semibold text-emerald-400">
					{formatCurrency(remainingBudget)}
				</p>
			</div>
		</div>

		<div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
			<h2 class="text-xl font-semibold">Current build status</h2>

			<ul class="mt-4 space-y-2 text-slate-300">
				<li>✅ SvelteKit initialized</li>
				<li>✅ TypeScript enabled</li>
				<li>✅ Tailwind CSS configured</li>
				<li>✅ Core project folders created</li>
				<li>✅ Finance types added</li>
			</ul>
		</div>
	</section>
</main>