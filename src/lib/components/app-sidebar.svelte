<script lang="ts" module>
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import PiggyBankIcon from '@lucide/svelte/icons/piggy-bank';
	import WalletIcon from '@lucide/svelte/icons/wallet';
	import LandmarkIcon from '@lucide/svelte/icons/landmark';
	import ChartPieIcon from '@lucide/svelte/icons/chart-pie';

	const navItems = [
		{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
		{ title: 'Portfolio', url: '/portfolio', icon: PiggyBankIcon },
		{ title: 'Reports', url: '/reports', icon: ChartPieIcon }
	] as const;

	const dataNavItems = [
		{ title: 'Accounts', url: '/accounts', icon: WalletIcon },
		{ title: 'Securities', url: '/securities', icon: LandmarkIcon }
	] as const;
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { resolve } from '$app/paths';
	import type { ComponentProps } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const sidebar = useSidebar();

	let dataGroupOpen = $state(true);
	const dataGroupExpanded = $derived(sidebar.state === 'collapsed' ? true : dataGroupOpen);
</script>

<Sidebar.Root bind:ref collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<h1 class="px-2 py-1 text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
			Ignus
		</h1>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each navItems as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton class="text-base">
								{#snippet child({ props })}
									<a href={resolve(item.url)} {...props}>
										<item.icon />
										{item.title}
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Collapsible.Root
			open={dataGroupExpanded}
			onOpenChange={(v) => (dataGroupOpen = v)}
			class="group/collapsible"
		>
			<Sidebar.Group>
				<Collapsible.Trigger>
					{#snippet child({ props })}
						<Sidebar.GroupLabel
							{...props}
							class="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm font-semibold tracking-wide uppercase group-data-[collapsible=icon]:pointer-events-none"
						>
							Data
							<ChevronDownIcon
								class="ml-auto transition-transform group-data-[state=closed]/collapsible:-rotate-90"
							/>
						</Sidebar.GroupLabel>
					{/snippet}
				</Collapsible.Trigger>
				<Collapsible.Content>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							{#each dataNavItems as item (item.title)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton class="text-base">
										{#snippet child({ props })}
											<a href={resolve(item.url)} {...props}>
												<item.icon />
												{item.title}
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Collapsible.Content>
			</Sidebar.Group>
		</Collapsible.Root>
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
