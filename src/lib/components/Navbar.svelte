<script lang="ts">
	import { page } from '$app/stores';
	import UserMenu from './UserMenu.svelte';

	interface NavItem {
		title: string;
		url: string;
	}

	let {
		siteTitle = 'Expense Manager',
		logo = null as string | null,
		navItems = [] as NavItem[]
	} = $props();

	let isMenuOpen = $state(false);
	let navRef = $state<HTMLElement | null>(null);

	let currentPath = $derived($page.url.pathname);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	// Close menu on route change
	$effect(() => {
		$page.url.pathname;
		closeMenu();
	});

	// Close menu when clicking outside the navbar
	function handleGlobalClick(event: MouseEvent) {
		if (isMenuOpen && navRef && !navRef.contains(event.target as Node)) {
			closeMenu();
		}
	}

	// Close menu on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isMenuOpen) {
			closeMenu();
		}
	}

	function isActive(url: string): boolean {
		if (url === '/') return currentPath === '/';
		return currentPath.startsWith(url);
	}

	// Default nav items if none provided
	let defaultNavItems: NavItem[] = [
		{ title: 'Dashboard', url: '/' },
		{ title: 'Expenses', url: '/expenses' },
		{ title: 'Budgets', url: '/budgets' },
		{ title: 'Categories', url: '/categories' },
		{ title: 'Reports', url: '/reports' }
	];

	let displayItems = $derived(navItems.length > 0 ? navItems : defaultNavItems);
</script>

<svelte:window onclick={handleGlobalClick} onkeydown={handleKeydown} />

<nav class="navbar" bind:this={navRef}>
	<div class="navbar-container">
		<!-- Logo / Site Title -->
		<a href="/" class="navbar-brand">
			{#if logo}
				<img src={logo} alt={siteTitle} class="navbar-logo" />
			{:else}
				<span class="navbar-title">💰 {siteTitle}</span>
			{/if}
		</a>

		<!-- Desktop Navigation -->
		<div class="navbar-nav desktop-nav">
			{#each displayItems as item}
				<a 
					href={item.url} 
					class="nav-link"
					class:active={isActive(item.url)}
				>
					{item.title}
				</a>
			{/each}
		</div>

		<!-- Right side: User menu + Mobile toggle -->
		<div class="navbar-actions">
			<div class="user-menu-wrapper">
				<UserMenu />
			</div>

			<!-- Mobile Menu Toggle -->
			<button 
				class="mobile-menu-toggle"
				onclick={toggleMenu}
				aria-label="Toggle menu"
				aria-expanded={isMenuOpen}
			>
				{#if isMenuOpen}
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Navigation Dropdown -->
	{#if isMenuOpen}
		<div class="mobile-nav">
			{#each displayItems as item}
				<a 
					href={item.url} 
					class="mobile-nav-link"
					class:active={isActive(item.url)}
					onclick={closeMenu}
				>
					{item.title}
				</a>
			{/each}
			<div class="mobile-nav-divider"></div>
			<a href="/settings" class="mobile-nav-link" onclick={closeMenu}>
				⚙️ Settings
			</a>
			<a href="/about" class="mobile-nav-link" onclick={closeMenu}>
				ℹ️ About
			</a>
		</div>
	{/if}
</nav>

<style>
	.navbar {
		background-color: var(--em-surface);
		border-bottom: 1px solid var(--em-border);
		position: relative;
	}

	.navbar-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
		padding: 0 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* Brand / Logo */
	.navbar-brand {
		display: flex;
		align-items: center;
		text-decoration: none;
		flex-shrink: 0;
	}

	.navbar-logo {
		height: 32px;
		width: auto;
	}

	.navbar-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--em-text-primary);
	}

	/* Desktop Navigation */
	.desktop-nav {
		display: none;
		align-items: center;
		gap: 0.5rem;
	}

	@media (min-width: 769px) {
		.desktop-nav {
			display: flex;
		}
	}

	.nav-link {
		padding: 0.5rem 1rem;
		color: var(--em-text-secondary);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9375rem;
		border-radius: var(--em-radius-md);
		transition: all var(--em-transition-fast);
	}

	.nav-link:hover {
		color: var(--em-text-primary);
		background-color: var(--em-bg-hover);
	}

	.nav-link.active {
		color: var(--em-primary);
		background-color: var(--em-primary-bg, rgba(59, 130, 246, 0.1));
	}

	/* Right side actions */
	.navbar-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-menu-wrapper {
		display: none;
	}

	@media (min-width: 769px) {
		.user-menu-wrapper {
			display: block;
		}
	}

	/* Mobile Menu Toggle */
	.mobile-menu-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: transparent;
		border: none;
		color: var(--em-text-secondary);
		cursor: pointer;
		border-radius: var(--em-radius-md);
		transition: all var(--em-transition-fast);
	}

	.mobile-menu-toggle:hover {
		background-color: var(--em-bg-hover);
		color: var(--em-text-primary);
	}

	@media (min-width: 769px) {
		.mobile-menu-toggle {
			display: none;
		}
	}

	/* Mobile Navigation Dropdown */
	.mobile-nav {
		display: flex;
		flex-direction: column;
		background-color: var(--em-surface);
		border-top: 1px solid var(--em-border);
		padding: 0.5rem 0;
		animation: slideDown 0.2s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (min-width: 769px) {
		.mobile-nav {
			display: none;
		}
	}

	.mobile-nav-link {
		display: block;
		padding: 0.875rem 1.5rem;
		color: var(--em-text-secondary);
		text-decoration: none;
		font-weight: 500;
		transition: all var(--em-transition-fast);
	}

	.mobile-nav-link:hover {
		background-color: var(--em-bg-hover);
		color: var(--em-text-primary);
	}

	.mobile-nav-link.active {
		color: var(--em-primary);
		background-color: var(--em-primary-bg, rgba(59, 130, 246, 0.1));
	}

	.mobile-nav-divider {
		height: 1px;
		background-color: var(--em-border);
		margin: 0.5rem 1.5rem;
	}
</style>
