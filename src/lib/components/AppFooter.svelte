<script lang="ts">
  import { base } from '$app/paths';
  const currentYear = new Date().getFullYear();
</script>

<footer class="app-footer">
  <div class="footer-container">
    <div class="footer-content">
      <div class="footer-brand">
        <span class="brand-icon">💰</span>
        <span class="brand-name">SpendWise</span>
      </div>
      
      <nav class="footer-nav">
        <a href={`${base}/about`}>About</a>
        <a href={`${base}/profile`}>Profile</a>
      </nav>
    </div>
    
    <div class="footer-bottom">
      <p class="copyright">© {currentYear} SpendWise. All rights reserved.</p>
      <p class="version">v1.0.0 • Phase 2</p>
    </div>
  </div>
</footer>

<style>
  .app-footer {
    background-color: var(--em-surface, #1E293B);
    border-top: 1px solid var(--em-border, #334155);
    padding: 2rem 1rem;
    margin-top: auto;
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .brand-icon {
    font-size: 1.5rem;
  }

  .brand-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--em-text-primary, #F8FAFC);
  }

  .footer-nav {
    display: flex;
    gap: 1.5rem;
  }

  .footer-nav a {
    color: var(--em-text-secondary, #94A3B8);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s ease;
  }

  .footer-nav a:hover {
    color: var(--em-primary, #3B82F6);
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--em-border, #334155);
  }

  .copyright,
  .version {
    margin: 0;
    font-size: 0.75rem;
    color: var(--em-text-muted, #64748B);
  }

  @media (max-width: 640px) {
    .footer-content {
      flex-direction: column;
      text-align: center;
    }

    .footer-bottom {
      flex-direction: column;
      text-align: center;
    }
  }

  /* Hide on mobile where bottom nav is visible */
  @media (max-width: 768px) {
    .app-footer {
      padding-bottom: 5rem;
    }
  }
</style>
