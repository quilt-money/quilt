<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import NavIcon from '$lib/components/NavIcon.svelte';

	type Route = Parameters<typeof resolve>[0];
	type IconName = 'dashboard' | 'holdings' | 'accounts' | 'securities';

	let { children } = $props();

	const navItems: { href: Route; label: string; icon: IconName }[] = [
		{ href: '/', label: 'Dashboard', icon: 'dashboard' },
		{ href: '/holdings', label: 'Holdings', icon: 'holdings' },
		{ href: '/accounts', label: 'Accounts', icon: 'accounts' },
		{ href: '/securities', label: 'Securities', icon: 'securities' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app">
	<nav class="sidebar" aria-label="Main navigation">
		<div class="logo">
			<span class="logo-mark" aria-hidden="true">PT</span>
			<span class="logo-name">Portfolio</span>
		</div>

		<ul role="list">
			{#each navItems as item (item)}
				{@const active = page.url.pathname === resolve(item.href)}
				<li>
					<a href={resolve(item.href)} class:active aria-current={active ? 'page' : undefined}>
						<NavIcon name={item.icon} />
						<span>{item.label}</span>
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
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family: 'Nunito', system-ui, sans-serif;
		background: #f5f4ff;
	}

	.app {
		display: flex;
		min-height: 100vh;
	}

	/* ── Sidebar ─────────────────────────────────────────── */

	.sidebar {
		width: 252px;
		flex-shrink: 0;
		background: #1e1b4b;
		border-radius: 0 28px 28px 0;
		display: flex;
		flex-direction: column;
		padding: 1.75rem 1rem;
		position: sticky;
		top: 0;
		height: 100vh;
		box-shadow: 6px 0 32px rgba(30, 27, 75, 0.18);
	}

	/* ── Logo ─────────────────────────────────────────────── */

	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 0.25rem 1.5rem;
		margin-bottom: 0.75rem;
		border-bottom: 1px solid rgba(165, 180, 252, 0.15);
	}

	.logo-mark {
		width: 38px;
		height: 38px;
		border-radius: 12px;
		background: #f59e0b;
		color: #1e1b4b;
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.logo-name {
		font-size: 1.1rem;
		font-weight: 700;
		color: #fff;
		letter-spacing: -0.01em;
	}

	/* ── Nav list ─────────────────────────────────────────── */

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	a {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.65rem 0.875rem;
		border-radius: 14px;
		color: #a5b4fc;
		text-decoration: none;
		font-size: 0.92rem;
		font-weight: 600;
		transition:
			background 0.13s ease,
			color 0.13s ease,
			box-shadow 0.13s ease;
	}

	a:hover:not(.active) {
		background: rgba(165, 180, 252, 0.1);
		color: #c7d2fe;
	}

	a:focus-visible {
		outline: 2px solid #f59e0b;
		outline-offset: 2px;
	}

	a.active {
		background: #f59e0b;
		color: #1e1b4b;
		box-shadow: 0 3px 14px rgba(245, 158, 11, 0.4);
	}

	/* ── Main content ─────────────────────────────────────── */

	main {
		flex: 1;
		padding: 2.5rem 3rem;
		min-width: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		a {
			transition: none;
		}
	}
</style>
