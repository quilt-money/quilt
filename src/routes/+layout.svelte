<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import '../app.css';

	const routeNames: Record<string, string> = {
		'/dashboard': 'Dashboard',
		'/holdings': 'Holdings',
		'/accounts': 'Accounts',
		'/securities': 'Securities',
	};

	const currentPage = $derived(routeNames[page.url.pathname] ?? '');
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
			<Sidebar.Trigger class="-ms-1" />
			<Separator orientation="vertical" class="me-2 h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Page>{currentPage}</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>
	</Sidebar.Inset>
</Sidebar.Provider>
