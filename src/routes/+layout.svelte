<script lang="ts">
	import AppShell from '$lib/components/app/app-shell.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<AppShell>
	{@render children()}
</AppShell>