<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { loginWithEmail, logoutUser, registerWithEmail } from '$lib/services/auth';
	import { currentUser } from '$lib/stores/auth';

	let email = '';
	let password = '';
	let message = '';
	let loading = false;

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

	async function handleLogout() {
		await logoutUser();
		message = 'Logged out successfully.';
	}
</script>

<svelte:head>
	<title>Login | SpendWise</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>SpendWise Login</Card.Title>
			<Card.Description>Create an account or log in using Firebase Auth.</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-4">
			{#if $currentUser}
				<div class="rounded-lg border p-4">
					<p class="text-sm text-muted-foreground">Logged in as</p>
					<p class="font-medium">{$currentUser.email}</p>
				</div>

				<Button class="w-full" variant="secondary" onclick={handleLogout}>Logout</Button>
			{:else}
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" bind:value={email} placeholder="you@example.com" />
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input id="password" type="password" bind:value={password} placeholder="Minimum 6 characters" />
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<Button disabled={loading} onclick={handleLogin}>Login</Button>
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