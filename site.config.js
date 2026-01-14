// Site Configuration
// SpendWise - Personal Expense Tracking Application

export const siteConfig = {
  // Site general information
  site: {
    name: "SpendWise",
    description: "Track your expenses, manage budgets, and gain insights into your spending habits",
    url: "https://spendwise.github.io",
    author: "SpendWise Team"
  },

  // Navigation bar configuration
  navbar: {
    // Site title displayed in the navbar
    siteTitle: "💰 SpendWise",

    // Logo image URL (null or false for no logo)
    logo: null,

    // Main navigation items
    defaultNavItems: [
      { title: 'Dashboard', url: '/' },
      { title: 'Expenses', url: '/expenses' },
      { title: 'Categories', url: '/categories' },
      { title: 'Budgets', url: '/budgets' },
      { title: 'Reports', url: '/reports' },
      { title: 'Add Expense', url: '/add', cta: true }
    ],

    // Hide these directories from navbar
    hiddenFromNav: ['legal', 'settings', 'shared']
  },

  // Contact information
  contact: {
    email: "support@expense-manager.app",
    privacyEmail: "privacy@expense-manager.app",
    supportEmail: "support@expense-manager.app"
  },

  // Social media links
  social: {
    github: "https://github.com/expense-manager"
  },

  // Legal pages specific settings
  legal: {
    privacyPolicyLastUpdated: "2026-01-12",
    termsLastUpdated: "2026-01-12",
    isCaliforniaCompliant: true,
    doNotSell: {
      processingTime: "15 business days",
      confirmationRequired: true
    }
  },

  // Search configuration
  search: {
    enabled: true,
    placeholder: 'Search expenses...',
    noResultsText: 'No expenses found',
    debounceMs: 300,
    minQueryLength: 2,
    maxResults: 20,
    showCategories: true,
    showDates: true,
    showExcerpts: true,
    excerptLength: 50
  },

  // SEO and meta information
  seo: {
    defaultTitle: "SpendWise - Track Your Spending",
    titleTemplate: "%s | SpendWise",
    defaultDescription: "Free personal expense tracker. Manage budgets, categorize spending, and visualize your financial habits.",
    keywords: ["expense tracker", "budget manager", "personal finance", "spending tracker", "money management"],
    ogImage: "/images/og-image.png",
    twitterCard: "summary_large_image"
  },

  // App-specific configuration
  app: {
    // Default currency
    defaultCurrency: "USD",
    
    // Available currencies
    currencies: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR"],
    
    // Date format options
    dateFormats: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
    
    // Default date format
    defaultDateFormat: "MM/DD/YYYY",
    
    // Default theme
    defaultTheme: "dark",
    
    // Pagination
    expensesPerPage: 50,
    
    // Budget alert thresholds
    budgetWarningThreshold: 0.8,  // 80%
    budgetDangerThreshold: 1.0    // 100%
  }
};

// Export configuration
export default siteConfig; 
