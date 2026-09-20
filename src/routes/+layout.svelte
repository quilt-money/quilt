<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { NuqsAdapter } from 'nuqs-svelte/adapters/svelte-kit';
	import '../app.css';

	let { children } = $props();

	type Crumb = { label: string; href?: string };

	const breadcrumbs = $derived.by((): Crumb[] => {
		const path = page.url.pathname;

		if (path === '/accounts') {
			return [{ label: 'Accounts' }];
		}
		if (path.startsWith('/accounts/')) {
			const name = (page.data as { account?: { name: string } }).account?.name ?? 'Account';
			return [{ label: 'Accounts', href: '/accounts' }, { label: name }];
		}
		if (path === '/dashboard') return [{ label: 'Dashboard' }];
		if (path === '/portfolio') return [{ label: 'Portfolio' }];
		if (path === '/securities') return [{ label: 'Securities' }];
		if (path.startsWith('/securities/')) {
			const symbol =
				(page.data as { security?: { symbol: string } }).security?.symbol ?? 'Security';
			return [{ label: 'Securities', href: '/securities' }, { label: symbol }];
		}
		return [];
	});
</script>

<NuqsAdapter>
	<Sidebar.Provider>
		<AppSidebar />
		<Sidebar.Inset>
			<header
				class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4"
			>
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						{#each breadcrumbs as crumb, i (crumb.label)}
							{#if i > 0}
								<Breadcrumb.Separator />
							{/if}
							<Breadcrumb.Item>
								{#if crumb.href}
									<Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
								{:else}
									<Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
								{/if}
							</Breadcrumb.Item>
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</header>
			{@render children()}
		</Sidebar.Inset>
	</Sidebar.Provider>
</NuqsAdapter>
