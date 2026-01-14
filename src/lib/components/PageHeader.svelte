<script>
  import { base } from '$app/paths';
  /** @type {{ title: string, subtitle?: string, showBackButton?: boolean }} */
  let { title, subtitle = '', showBackButton = false } = $props();
</script>

<header class="page-header">
  <div class="header-content">
    {#if showBackButton}
      <a href={`${base}/`} class="back-button" aria-label="Go back">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </a>
    {/if}
    <div class="header-text">
      <h1 class="title">{title}</h1>
      {#if subtitle}
        <p class="subtitle">{subtitle}</p>
      {/if}
    </div>
  </div>
</header>

<style>
  .page-header {
    padding: 1.5rem 0 1rem;
    margin-bottom: 1.5rem;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .back-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background-color: var(--em-surface);
    border-radius: var(--em-radius-md);
    color: var(--em-text-secondary);
    transition: all var(--em-transition-fast);
  }
  
  .back-button:hover {
    background-color: var(--em-surface-hover);
    color: var(--em-text-primary);
  }
  
  .header-text {
    flex: 1;
  }
  
  .title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--em-text-primary);
    margin: 0;
    line-height: 1.2;
  }
  
  .subtitle {
    font-size: 0.875rem;
    color: var(--em-text-secondary);
    margin: 0.25rem 0 0;
  }
  
  @media (max-width: 768px) {
    .title {
      font-size: 1.5rem;
    }
  }
</style>
