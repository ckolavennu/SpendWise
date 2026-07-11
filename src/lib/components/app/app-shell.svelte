<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { NAVIGATION_ITEMS, type AppRoute } from '$lib/constants/navigation';
	import { logoutUser } from '$lib/services/auth';
	import { currentUser } from '$lib/stores/auth';
	import { isSuperAdmin } from '$lib/stores/profile';

	let { children } = $props();

	async function handleLogout() {
		await logoutUser();
	}

	async function navigateTo(route: AppRoute | '/login') {
		switch (route) {
			case '/':
				await goto(resolve('/'));
				break;
			case '/transactions':
				await goto(resolve('/transactions'));
				break;
			case '/budget':
				await goto(resolve('/budget'));
				break;
			case '/reports':
				await goto(resolve('/reports'));
				break;
			case '/categories':
				await goto(resolve('/categories'));
				break;
			case '/login':
				await goto(resolve('/login'));
				break;
		}
	}

	function isActive(path: AppRoute) {
		if (path === '/') {
			return page.url.pathname === '/';
		}

		return page.url.pathname.startsWith(path);
	}
</script>

<div class="min-h-screen bg-background text-foreground">
	<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
		<div
			class="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl"
		></div>
		<div
			class="absolute right-[-8rem] top-40 h-[24rem] w-[24rem] rounded-full bg-blue-500/10 blur-3xl"
		></div>
		<div
			class="absolute bottom-[-10rem] left-[-8rem] h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-3xl"
		></div>
	</div>

	<header class="sticky top-0 z-50 border-b border-white/10 bg-background/75 backdrop-blur-xl">
		<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
			<button type="button" class="flex items-center gap-3" onclick={() => navigateTo('/')}>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20"
				>
					SW
				</div>

				<div class="hidden text-left leading-tight sm:block">
					<p class="font-semibold tracking-tight">SpendWise</p>
					<p class="text-xs text-muted-foreground">
						{$isSuperAdmin ? 'Superadmin console' : 'Smart budget tracker'}
					</p>
				</div>
			</button>

			<nav
				class="hidden items-center gap-1 rounded-2xl border border-white/10 bg-card/60 p-1 shadow-sm backdrop-blur md:flex"
			>
				{#each NAVIGATION_ITEMS as item (item.href)}
					<button
						type="button"
						onclick={() => navigateTo(item.href)}
						class={isActive(item.href)
							? 'rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm'
							: 'rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground'}
					>
						{item.label}
					</button>
				{/each}
			</nav>

			<div class="hidden items-center gap-3 md:flex">
				{#if $currentUser}
					{#if $isSuperAdmin}
						<Button variant="secondary" size="sm" onclick={() => navigateTo('/')}>
							Superadmin
						</Button>
					{/if}

					<div class="max-w-48 rounded-full border border-white/10 bg-card/60 px-3 py-1.5">
						<p class="truncate text-xs text-muted-foreground">
							{$currentUser.email}
						</p>
					</div>

					<Button variant="secondary" size="sm" onclick={handleLogout}>Logout</Button>
				{:else}
					<Button size="sm" onclick={() => navigateTo('/login')}>Login</Button>
				{/if}
			</div>

			<div class="md:hidden">
				{#if $currentUser}
					<div class="flex items-center gap-2">
						{#if $isSuperAdmin}
							<Button variant="secondary" size="sm" onclick={() => navigateTo('/')}>
								Admin
							</Button>
						{/if}

						<Button variant="secondary" size="sm" onclick={handleLogout}>Logout</Button>
					</div>
				{:else}
					<Button size="sm" onclick={() => navigateTo('/login')}>Login</Button>
				{/if}
			</div>
		</div>
	</header>

	<div class="pb-24 md:pb-0">
		{@render children?.()}
	</div>

	<nav
		class="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/85 backdrop-blur-xl md:hidden"
	>
		<div class="grid h-16 grid-cols-5">
			{#each NAVIGATION_ITEMS as item (item.href)}
				<button
					type="button"
					onclick={() => navigateTo(item.href)}
					class={isActive(item.href)
						? 'flex items-center justify-center text-xs font-semibold text-primary'
						: 'flex items-center justify-center text-xs font-medium text-muted-foreground'}
				>
					{item.label}
				</button>
			{/each}
		</div>
	</nav>
</div>