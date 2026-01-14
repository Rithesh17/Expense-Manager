<script>
  /** 
   * @type {{
   *   open?: boolean,
   *   title?: string,
   *   size?: 'sm' | 'md' | 'lg',
   *   closable?: boolean,
   *   onclose?: () => void,
   *   children?: any,
   *   footer?: any
   * }} 
   */
  let { 
    open = false,
    title = '',
    size = 'md',
    closable = true,
    onclose,
    children,
    footer
  } = $props();

  function handleBackdropClick() {
    if (closable && onclose) {
      onclose();
    }
  }

  /** @param {KeyboardEvent} e */
  function handleKeydown(e) {
    if (e.key === 'Escape' && closable && onclose) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div 
    class="modal-backdrop" 
    onclick={handleBackdropClick}
    role="button"
    tabindex="0"
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleBackdropClick();
      }
    }}
    aria-label="Close modal"
  >
    <div 
      class="modal modal-{size}" 
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        // Prevent keyboard events from bubbling, but don't handle them
        e.stopPropagation();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      {#if title || closable}
        <div class="modal-header">
          {#if title}
            <h2 id="modal-title" class="modal-title">{title}</h2>
          {/if}
          {#if closable}
            <button class="close-btn" onclick={onclose} aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          {/if}
        </div>
      {/if}

      <div class="modal-body">
        {@render children?.()}
      </div>

      {#if footer}
        <div class="modal-footer">
          {@render footer?.()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal {
    background-color: var(--em-surface);
    border: 1px solid var(--em-border);
    border-radius: var(--em-radius-lg);
    box-shadow: var(--em-shadow-lg);
    max-height: calc(100vh - 4rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-sm {
    width: 100%;
    max-width: 400px;
  }

  .modal-md {
    width: 100%;
    max-width: 560px;
  }

  .modal-lg {
    width: 100%;
    max-width: 800px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--em-border);
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    color: var(--em-text-primary);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: var(--em-radius-sm);
    color: var(--em-text-muted);
    cursor: pointer;
    transition: all var(--em-transition-fast);
  }

  .close-btn:hover {
    background-color: var(--em-bg-hover);
    color: var(--em-text-primary);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--em-border);
    background-color: var(--em-bg-tertiary);
  }
</style>
