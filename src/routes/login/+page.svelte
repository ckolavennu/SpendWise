<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		loginWithEmail,
		loginWithGoogle,
		logoutUser,
		registerWithEmail
	} from '$lib/services/auth';
	import { currentUser } from '$lib/stores/auth';

	let email = $state('');
	let password = $state('');
	let message = $state('');
	let loading = $state(false);

	async function handleRegister() {
		loading = true;
		message = '';

		try {
			await registerWithEmail(email, password);
			message = 'Account created successfully.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Registration failed.';
		} finally {
			loading = false;
		}
	}

	async function handleLogin() {
		loading = true;
		message = '';

		try {
			await loginWithEmail(email, password);
			message = 'Logged in successfully.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Login failed.';
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

<main class="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>SpendWise Login</Card.Title>
			<Card.Description>
				Log in with email/password or continue using your Google account.
			</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-5">
			{#if $currentUser}
				<div class="rounded-lg border p-4">
					<p class="text-sm text-muted-foreground">Logged in as</p>
					<p class="font-medium">{$currentUser.email}</p>

					{#if $currentUser.displayName}
						<p class="mt-1 text-sm text-muted-foreground">
							{$currentUser.displayName}
						</p>
					{/if}
				</div>

				<Button class="w-full" variant="secondary" onclick={handleLogout} disabled={loading}>
					{loading ? 'Logging out...' : 'Logout'}
				</Button>
			{:else}
				<Button class="w-full" variant="outline" onclick={handleGoogleLogin} disabled={loading}>
					{loading ? 'Opening Google...' : 'Continue with Google'}
				</Button>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<span class="w-full border-t"></span>
					</div>

					<div class="relative flex justify-center text-xs uppercase">
						<span class="bg-background px-2 text-muted-foreground">or continue with email</span>
					</div>
				</div>

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
						placeholder="Minimum 6 characters"
					/>
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<Button disabled={loading} onclick={handleLogin}>
						{loading ? 'Please wait...' : 'Login'}
					</Button>

					<Button disabled={loading} variant="secondary" onclick={handleRegister}>
						Register
					</Button>
				</div>
			{/if}

			{#if message}
				<p class="text-sm text-muted-foreground">{message}</p>
			{/if}
		</Card.Content>
	</Card.Root>
</main>