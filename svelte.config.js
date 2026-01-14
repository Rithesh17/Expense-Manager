import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Using vitePreprocess for preprocessor
  preprocess: vitePreprocess(),

  kit: {
    // Base path for GitHub Pages (set to repository name if not deploying to root)
    // For root domain (username.github.io), leave as empty string
    // For subdirectory (username.github.io/repo-name), set to '/repo-name'
    paths: {
      base: process.env.BASE_PATH || ''
    },
    
    // Static site generator
    adapter: adapter({
      // Static site output folder
      pages: 'build',
      assets: 'build',
      fallback: 'index.html', // Using index.html instead of null for a real static site
      precompress: false,
      strict: false // Set to false to include non-prerendered routes via fallback (like /register, /expenses, etc.)
    }),
    
    // Custom alias defined to handle the content folder
    alias: {
      $content: path.resolve('./content'),
      $lib: path.resolve('./src/lib')
    },
    
    // Static site pre-processing options
    prerender: {
      crawl: true,
      entries: [
        '/',
        '/about',
        '/login',
        '/expenses',
        '/categories',
        '/budgets',
        '/reports',
        '/add',
        '/register',
        '/forgot-password',
        '/profile',
        '/settings'
      ],
      handleHttpError: 'warn',
      handleUnseenRoutes: 'ignore' // Ignore dynamic routes like /expenses/[id]
    }
  }
};

export default config; 