<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { NAVIGATION_ITEMS } from '$lib/constants/navigation';
	import { logoutUser } from '$lib/services/auth';
	import { currentUser } from '$lib/stores/auth';

	let { children } = $props();

	async function handleLogout() {
		await logoutUser();
	}

	function isActive(path: string) {
		if (path === '/') {
			return page.url.pathname === '/';
		}

		return page.url.pathname.startsWith(path);
	}
</script>

<div class="min-h-screen bg-background text-foreground">
	<header class="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
			<a href={resolve('/')} class="flex items-center gap-2">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground"
				>
					SW
				</div>

				<div class="leading-tight">
					<p class="font-semibold">SpendWise</p>
					<p class="text-xs text-muted-foreground">Budget tracker</p>
				</div>
			</a>

			<nav class="hidden items-center gap-2 md:flex">
				{#each NAVIGATION_ITEMS as item (item.href)}
					<a
						href={resolve(item.href)}
						class={isActive(item.href)
							? 'rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground'
							: 'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground'}
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="hidden items-center gap-3 md:flex">
				{#if $currentUser}
					<p class="max-w-40 truncate text-sm text-muted-foreground">
						{$currentUser.email}
					</p>

					<Button variant="secondary" size="sm" onclick={handleLogout}>Logout</Button>
				{:else}
					<a href={resolve('/login')}>
						<Button size="sm">Login</Button>
					</a>
				{/if}
			</div>

			<div class="md:hidden">
				{#if $currentUser}
					<Button variant="secondary" size="sm" onclick={handleLogout}>Logout</Button>
				{:else}
					<a href={resolve('/login')}>
						<Button size="sm">Login</Button>
					</a>
				{/if}
			</div>
		</div>
	</header>

	<div class="pb-20 md:pb-0">
		{@render children?.()}
	</div>

	<nav class="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
		<div class="grid h-16 grid-cols-3">
			{#each NAVIGATION_ITEMS as item (item.href)}
				<a
					href={resolve(item.href)}
					class={isActive(item.href)
						? 'flex items-center justify-center text-sm font-semibold text-foreground'
						: 'flex items-center justify-center text-sm font-medium text-muted-foreground'}
				>
					{item.label}
				</a>
			{/each}
		</div>
	</nav>
</div>
