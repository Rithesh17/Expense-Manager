<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { currentUser, authActions, isAuthenticated, authLoading } from '$lib/stores';
  
  let isOpen = $state(false);
  let menuRef = $state<HTMLElement | null>(null);
  
  function toggleMenu() {
    isOpen = !isOpen;
  }
  
  function closeMenu() {
    isOpen = false;
  }
  
  // Close menu when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (menuRef && !menuRef.contains(event.target as Node)) {
      closeMenu();
    }
  }
  
  // Close menu on route change
  $effect(() => {
    $page.url.pathname;
    closeMenu();
  });

  async function handleLogout() {
    closeMenu();
    try {
      await authActions.logout();
      goto(`${base}/login`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="user-menu" bind:this={menuRef}>
  <button class="user-button" onclick={toggleMenu} aria-label="User menu" aria-expanded={isOpen}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  </button>
  
  {#if isOpen}
    <div class="dropdown">
      {#if $isAuthenticated && $currentUser}
        <div class="dropdown-header">
          <span class="user-name">{$currentUser.displayName || 'User'}</span>
          <span class="user-email">{$currentUser.email}</span>
        </div>
        <div class="dropdown-divider"></div>
        <a href={`${base}/profile`} class="dropdown-item" onclick={closeMenu}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Profile
        </a>
        <a href={`${base}/about`} class="dropdown-item" onclick={closeMenu}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          About
        </a>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item logout-item" onclick={handleLogout} disabled={$authLoading}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {$authLoading ? 'Signing out...' : 'Sign Out'}
        </button>
      {:else}
        <div class="dropdown-header">
          <span class="user-name">Guest</span>
          <span class="user-email">Not signed in</span>
        </div>
        <div class="dropdown-divider"></div>
        <a href={`${base}/login`} class="dropdown-item" onclick={closeMenu}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
          Sign In
        </a>
        <a href={`${base}/register`} class="dropdown-item" onclick={closeMenu}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Create Account
        </a>
        <a href={`${base}/about`} class="dropdown-item" onclick={closeMenu}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          About
        </a>
      {/if}
      <div class="dropdown-divider"></div>
      <div class="dropdown-footer">
        <span class="version">v1.0.0 • Phase 9</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .user-menu {
    position: relative;
  }
  
  .user-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background-color: var(--em-bg-tertiary, #334155);
    border: 1px solid var(--em-border, #475569);
    border-radius: 50%;
    color: var(--em-text-secondary, #94A3B8);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .user-button:hover {
    background-color: var(--em-bg-hover, #475569);
    color: var(--em-text-primary, #F8FAFC);
    border-color: var(--em-primary, #3B82F6);
  }
  
  .dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 200px;
    background-color: var(--em-surface, #1E293B);
    border: 1px solid var(--em-border, #475569);
    border-radius: var(--em-radius-lg, 0.75rem);
    box-shadow: var(--em-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.3));
    z-index: 100;
    overflow: hidden;
    animation: slideDown 0.15s ease;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .dropdown-header {
    padding: 1rem;
    background-color: var(--em-bg-tertiary, #334155);
  }
  
  .user-name {
    display: block;
    font-weight: 600;
    color: var(--em-text-primary, #F8FAFC);
    margin-bottom: 0.125rem;
  }
  
  .user-email {
    display: block;
    font-size: 0.75rem;
    color: var(--em-text-muted, #64748B);
  }
  
  .dropdown-divider {
    height: 1px;
    background-color: var(--em-border, #475569);
  }
  
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: var(--em-text-secondary, #94A3B8);
    text-decoration: none;
    font-size: 0.875rem;
    transition: all 0.15s ease;
  }
  
  .dropdown-item:hover {
    background-color: var(--em-bg-hover, #475569);
    color: var(--em-text-primary, #F8FAFC);
  }

  .dropdown-item.logout-item {
    width: 100%;
    text-align: left;
    border: none;
    background: none;
    cursor: pointer;
  }

  .dropdown-item.logout-item:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .dropdown-footer {
    padding: 0.75rem 1rem;
    background-color: var(--em-bg-tertiary, #334155);
  }
  
  .version {
    font-size: 0.75rem;
    color: var(--em-text-muted, #64748B);
  }
</style>
