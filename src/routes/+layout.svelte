<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	type Route = Parameters<typeof resolve>[0];

	let { children } = $props();

	const navItems: { href: Route; label: string }[] = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/holdings', label: 'Holdings' },
		{ href: '/accounts', label: 'Accounts' },
		{ href: '/securities', label: 'Securities' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<nav class="sidebar">
		<div class="logo">Portfolio Tracker</div>
		<ul>
			{#each navItems as item (item)}
				<li>
					<a href={resolve(item.href)} class:active={page.url.pathname === resolve(item.href)}>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 220px;
		flex-shrink: 0;
		background: #1a1a2e;
		color: #e0e0e0;
		display: flex;
		flex-direction: column;
		padding: 1.5rem 0;
	}

	.logo {
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		padding: 0 1.25rem 1.5rem;
		border-bottom: 1px solid #2a2a4a;
	}

	ul {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
	}

	a {
		display: block;
		padding: 0.6rem 1.25rem;
		color: #a0a0c0;
		text-decoration: none;
		font-size: 0.9rem;
		border-left: 3px solid transparent;
		transition:
			color 0.15s,
			background 0.15s;
	}

	a:hover {
		color: #fff;
		background: #2a2a4a;
	}

	a.active {
		color: #fff;
		border-left-color: #6c63ff;
		background: #2a2a4a;
	}

	main {
		flex: 1;
		padding: 2rem;
		background: #f5f5f5;
	}
</style>
