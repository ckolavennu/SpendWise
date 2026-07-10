<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		loginWithEmail,
		loginWithGoogle,
		logoutUser,
		registerWithEmail
	} from '$lib/services/auth';
	import { currentUser } from '$lib/stores/auth';

	type AuthMode = 'login' | 'register';

	let mode = $state<AuthMode>('login');
	let email = $state('');
	let password = $state('');
	let message = $state('');
	let loading = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		loading = true;
		message = '';

		try {
			if (mode === 'login') {
				await loginWithEmail(email, password);
				message = 'Logged in successfully.';
			} else {
				await registerWithEmail(email, password);
				message = 'Account created successfully.';
			}
		} catch (error) {
			message =
				error instanceof Error
					? error.message
					: mode === 'login'
						? 'Login failed.'
						: 'Registration failed.';
		} finally {
			loading = false;
		}
	}

	async function handleGoogleLogin() {
		loading = true;
		message = '';

		try {
			await loginWithGoogle();
			message = 'Logged in with Google successfully.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Google login failed.';
		} finally {
			loading = false;
		}
	}

	async function handleLogout() {
		loading = true;
		message = '';

		try {
			await logoutUser();
			message = 'Logged out successfully.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Logout failed.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login | SpendWise</title>
</svelte:head>

<main class="min-h-[calc(100vh-4rem)] bg-background px-6 py-10 text-foreground">
	<section class="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
		<div
			class="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-muted/40 p-8 shadow-sm"
		>
			<div class="space-y-6">
				<Badge variant="secondary">Smart budget tracking</Badge>

				<div class="space-y-3">
					<h1 class="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
						Manage your money with clarity using <span class="text-primary">SpendWise</span>
					</h1>

					<p class="max-w-xl text-base leading-7 text-muted-foreground">
						Track expenses, monitor budgets, and understand your spending habits in one clean
						dashboard.
					</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-xl border bg-background/70 p-4 backdrop-blur">
						<p class="text-sm font-semibold">Track transactions</p>
						<p class="mt-1 text-sm text-muted-foreground">
							Log income and expenses quickly from anywhere.
						</p>
					</div>

					<div class="rounded-xl border bg-background/70 p-4 backdrop-blur">
						<p class="text-sm font-semibold">Monitor budgets</p>
						<p class="mt-1 text-sm text-muted-foreground">
							Set monthly limits and stay ahead of overspending.
						</p>
					</div>

					<div class="rounded-xl border bg-background/70 p-4 backdrop-blur">
						<p class="text-sm font-semibold">View insights</p>
						<p class="mt-1 text-sm text-muted-foreground">
							See category breakdowns and recent spending trends.
						</p>
					</div>

					<div class="rounded-xl border bg-background/70 p-4 backdrop-blur">
						<p class="text-sm font-semibold">Access anywhere</p>
						<p class="mt-1 text-sm text-muted-foreground">
							Use your account across web and mobile in the future.
						</p>
					</div>
				</div>

				<div class="rounded-xl border bg-background/70 p-5 backdrop-blur">
					<p class="text-sm text-muted-foreground">Why users love it</p>
					<p class="mt-2 text-lg font-semibold">
						“Simple enough for daily use, powerful enough for real budgeting.”
					</p>
				</div>
			</div>
		</div>

		<div class="mx-auto w-full max-w-md">
			<Card.Root class="border shadow-sm">
				<Card.Header class="space-y-4">
					<div class="space-y-2">
						<Card.Title class="text-2xl">Welcome to SpendWise</Card.Title>
						<Card.Description>
							{mode === 'login'
								? 'Sign in to continue managing your budget.'
								: 'Create your account and start tracking your spending.'}
						</Card.Description>
					</div>

					<div class="grid grid-cols-2 rounded-lg bg-muted p-1">
						<button
							type="button"
							class={mode === 'login'
								? 'rounded-md bg-background px-3 py-2 text-sm font-medium shadow-sm'
								: 'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground'}
							onclick={() => {
								mode = 'login';
								message = '';
							}}
						>
							Login
						</button>

						<button
							type="button"
							class={mode === 'register'
								? 'rounded-md bg-background px-3 py-2 text-sm font-medium shadow-sm'
								: 'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground'}
							onclick={() => {
								mode = 'register';
								message = '';
							}}
						>
							Register
						</button>
					</div>
				</Card.Header>

				<Card.Content class="space-y-5">
					{#if $currentUser}
						<div class="space-y-4">
							<div class="rounded-xl border bg-muted/40 p-4">
								<p class="text-sm text-muted-foreground">Logged in as</p>
								<p class="mt-1 font-medium">{$currentUser.email}</p>

								{#if $currentUser.displayName}
									<p class="mt-1 text-sm text-muted-foreground">
										{$currentUser.displayName}
									</p>
								{/if}
							</div>

							<div class="grid gap-3 sm:grid-cols-2">
								<a href={resolve('/')}>
									<Button class="w-full">Go to Dashboard</Button>
								</a>

								<Button
									class="w-full"
									variant="secondary"
									onclick={handleLogout}
									disabled={loading}
								>
									{loading ? 'Logging out...' : 'Logout'}
								</Button>
							</div>

							{#if message}
								<p class="text-sm text-muted-foreground">{message}</p>
							{/if}
						</div>
					{:else}
						<Button
							class="w-full"
							variant="outline"
							onclick={handleGoogleLogin}
							disabled={loading}
						>
							<span class="mr-2 inline-flex">
								<svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
									<path
										fill="#EA4335"
										d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.5 14.5 2.7 12 2.7 6.9 2.7 2.8 6.9 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.1-1.5H12z"
									/>
									<path
										fill="#34A853"
										d="M3.6 7.4l3.2 2.3C7.7 7.7 9.7 6 12 6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.5 14.5 2.7 12 2.7c-3.5 0-6.6 2-8.4 4.7z"
									/>
									<path
										fill="#FBBC05"
										d="M12 21.3c2.4 0 4.5-.8 6-2.2l-2.8-2.3c-.8.6-1.8 1-3.2 1-3.8 0-5.2-2.6-5.4-3.8l-3.2 2.5c1.8 3.6 5.1 4.8 8.6 4.8z"
									/>
									<path
										fill="#4285F4"
										d="M20.8 12.3c0-.6-.1-1.1-.1-1.5H12v3.9h5.4c-.3 1.1-1.1 2-2.2 2.7l2.8 2.3c1.6-1.5 2.8-3.8 2.8-7.4z"
									/>
								</svg>
							</span>
							{loading ? 'Opening Google...' : 'Continue with Google'}
						</Button>

						<div class="relative">
							<Separator />
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="bg-card px-3 text-xs uppercase tracking-wide text-muted-foreground">
									or continue with email
								</span>
							</div>
						</div>

						<form class="space-y-4" onsubmit={handleSubmit}>
							<div class="space-y-2">
								<Label for="email">Email</Label>
								<Input id="email" type="email" bind:value={email} placeholder="you@example.com" />
							</div>

							<div class="space-y-2">
								<Label for="password">Password</Label>
								<Input
									id="password"
									type="password"
									bind:value={password}
									placeholder={mode === 'login' ? 'Enter your password' : 'Minimum 6 characters'}
								/>
							</div>

							<Button class="w-full" type="submit" disabled={loading}>
								{#if loading}
									Please wait...
								{:else if mode === 'login'}
									Login
								{:else}
									Create Account
								{/if}
							</Button>
						</form>

						<p class="text-center text-sm text-muted-foreground">
							{#if mode === 'login'}
								Don’t have an account?
								<button
									type="button"
									class="font-medium text-primary hover:underline"
									onclick={() => {
										mode = 'register';
										message = '';
									}}
								>
									Register
								</button>
							{:else}
								Already have an account?
								<button
									type="button"
									class="font-medium text-primary hover:underline"
									onclick={() => {
										mode = 'login';
										message = '';
									}}
								>
									Login
								</button>
							{/if}
						</p>

						{#if message}
							<div class="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
								{message}
							</div>
						{/if}
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</section>
</main>