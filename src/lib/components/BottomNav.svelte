<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  
  const navItems = [
    { title: 'Dashboard', url: '/', icon: 'home' },
    { title: 'Expenses', url: '/expenses', icon: 'list' },
    { title: 'Add', url: '/add', icon: 'plus' },
    { title: 'Reports', url: '/reports', icon: 'chart' },
    { title: 'Profile', url: '/profile', icon: 'settings' }
  ];
  
  let currentPath = $derived($page.url.pathname);
  
  /** @param {string} url */
  function isActive(url) {
    if (url === '/') return currentPath === base + '/' || currentPath === base;
    return currentPath.startsWith(base + url);
  }
</script>

<nav class="bottom-nav">
  {#each navItems as item}
    <a 
      href={`${base}${item.url}`} 
      class="nav-item" 
      class:active={isActive(item.url)}
      aria-label={item.title}
    >
      <span class="nav-icon">
        {#if item.icon === 'home'}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        {:else if item.icon === 'list'}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        {:else if item.icon === 'plus'}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        {:else if item.icon === 'chart'}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        {:else if item.icon === 'settings'}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        {/if}
      </span>
      <span class="nav-label">{item.title}</span>
    </a>
  {/each}
</nav>

<style>
  .bottom-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--em-surface);
    border-top: 1px solid var(--em-border);
    padding: 0.5rem 0;
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0));
    z-index: 100;
  }
  
  @media (max-width: 768px) {
    .bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
  }
  
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    color: var(--em-text-muted);
    text-decoration: none;
    transition: color var(--em-transition-fast);
    min-width: 60px;
  }
  
  .nav-item:hover,
  .nav-item.active {
    color: var(--em-primary);
  }
  
  .nav-item.active .nav-icon {
    transform: scale(1.1);
  }
  
  /* Special styling for Add button */
  .nav-item:nth-child(3) {
    position: relative;
    top: -0.5rem;
  }
  
  .nav-item:nth-child(3) .nav-icon {
    background-color: var(--em-primary);
    color: white;
    border-radius: 50%;
    padding: 0.75rem;
    box-shadow: var(--em-shadow-md);
  }
  
  .nav-item:nth-child(3):hover .nav-icon,
  .nav-item:nth-child(3).active .nav-icon {
    background-color: var(--em-primary-hover);
    transform: scale(1.05);
  }
  
  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--em-transition-fast);
  }
  
  .nav-icon svg {
    width: 24px;
    height: 24px;
  }
  
  .nav-label {
    font-size: 0.625rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  
  .nav-item:nth-child(3) .nav-label {
    margin-top: 0.25rem;
  }
</style>
