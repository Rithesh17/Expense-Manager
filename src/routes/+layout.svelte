<script lang="ts">
	import { NavigationBar } from 'statue-ssg';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import '$lib/index.css';
	import { BottomNav, UserMenu, AppFooter } from '$lib/components';
	import { initializeStores } from '$lib/stores/app';
	import { shouldLoadDemoData, loadDemoData } from '$lib/stores/seed-data';

	let { data, children } = $props();

	let searchConfig = $derived(data.searchConfig);
	let navbarConfig = $derived(data.navbarConfig);
	let currentPath = $derived($page.url.pathname);

	// Initialize stores and load demo data if needed
	onMount(() => {
		// Load demo data for first-time users
		if (shouldLoadDemoData()) {
			loadDemoData();
		}
		// Initialize all stores from localStorage
		initializeStores();
	});

	// Close mobile menu on route change
	$effect(() => {
		// Watch for route changes
		$page.url.pathname;
		
		// Try to close any open mobile menu by clicking outside
		// This is a workaround for statue-ssg NavigationBar
		const mobileMenuButton = document.querySelector('nav button[aria-label*="menu"], nav button[aria-expanded="true"]');
		if (mobileMenuButton && (mobileMenuButton as HTMLButtonElement).getAttribute('aria-expanded') === 'true') {
			(mobileMenuButton as HTMLButtonElement).click();
		}
	});

	// Enable View Transitions API for smooth page transitions
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<div class="navbar-wrapper">
	<NavigationBar
		navbarItems={data.globalDirectories}
		showSearch={false}
		siteTitle={navbarConfig?.siteTitle ?? null}
		logo={navbarConfig?.logo ?? null}
		hiddenFromNav={navbarConfig?.hiddenFromNav ?? []}
		{...(navbarConfig?.defaultNavItems && { defaultNavItems: navbarConfig.defaultNavItems })}
	/>
	<div class="user-menu-wrapper">
		<UserMenu />
	</div>
</div>

<main class="app-main">
	{@render children()}
</main>

<AppFooter />
<BottomNav />

<style>
	.navbar-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		display: flex;
		align-items: center;
	}

	.navbar-wrapper :global(nav) {
		flex: 1;
	}

	.user-menu-wrapper {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
	}

	@media (max-width: 768px) {
		.user-menu-wrapper {
			display: none;
		}
	}

	:global(body) {
		background-color: var(--em-bg-primary);
		font-family:
			'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
			'Helvetica Neue', sans-serif;
		margin: 0;
		padding: 0;
		color: var(--em-text-primary);
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app-main {
		min-height: calc(100vh - 200px);
		padding-top: 80px; /* Space below navbar */
		padding-bottom: 5rem; /* Space for bottom nav on mobile */
	}

	@media (min-width: 769px) {
		.app-main {
			padding-bottom: 0;
		}
	}

	/* View Transitions */
	:global(::view-transition-old(root)),
	:global(::view-transition-new(root)) {
		animation: 200ms ease-out both vt-fade;
	}

	:global(::view-transition-old(root)) {
		animation-direction: reverse;
	}

	@keyframes vt-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Navbar stays static during transition */
	:global(::view-transition-old(navbar)),
	:global(::view-transition-new(navbar)) {
		animation: none;
	}


	:global(::view-transition-group(*)) {
		animation-duration: 250ms;
		animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	}
</style>
