<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import '$lib/index.css';
	import { Navbar, BottomNav, AppFooter } from '$lib/components';
	import { initializeStores } from '$lib/stores/app';
	import { shouldLoadDemoData, loadDemoData } from '$lib/stores/seed-data';
	import { isAuthenticated, authLoading } from '$lib/stores';

	let { data, children } = $props();

	let navbarConfig = $derived(data.navbarConfig);

	// Protected routes that require authentication (without base path)
	const protectedRoutes = ['/expenses', '/budgets', '/categories', '/reports', '/profile', '/add'];
	// Public routes that don't require authentication
	const publicRoutes = ['/', '/about', '/login', '/register', '/forgot-password'];

	// Check if current route is protected
	function isProtectedRoute(pathname: string): boolean {
		// Remove base path for comparison
		const pathWithoutBase = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
		// Normalize: ensure it starts with /
		const normalized = pathWithoutBase.startsWith('/') ? pathWithoutBase : '/' + pathWithoutBase;
		return protectedRoutes.some(route => normalized === route || normalized.startsWith(route + '/'));
	}

	// Check if current route is public
	function isPublicRoute(pathname: string): boolean {
		// Remove base path for comparison
		const pathWithoutBase = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
		// Normalize: ensure it starts with /
		const normalized = pathWithoutBase.startsWith('/') ? pathWithoutBase : '/' + pathWithoutBase;
		return publicRoutes.some(route => normalized === route || normalized.startsWith(route + '/'));
	}

	// Note: We no longer redirect protected routes - instead, pages show demo previews
	// when not authenticated. This allows users to see what each page offers.

	// Initialize stores and load demo data if needed
	onMount(async () => {
		// Initialize all stores from localStorage first
		await initializeStores();
		
		// Load demo data for non-authenticated users to show previews
		// This data is used for demo previews on protected routes
		if (!$isAuthenticated && shouldLoadDemoData()) {
			loadDemoData();
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
	<Navbar 
		siteTitle={navbarConfig?.siteTitle ?? 'SpendWise'}
		logo={navbarConfig?.logo ?? null}
	/>
</div>

<svelte:head>
	<link rel="icon" type="image/x-icon" href={`${base}/favicon.ico`} />
	<link rel="icon" type="image/svg+xml" href={`${base}/favicon.svg`} />
	<link rel="icon" type="image/png" href={`${base}/favicon.png`} />
	<link rel="apple-touch-icon" href={`${base}/favicon.png`} />
</svelte:head>

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
