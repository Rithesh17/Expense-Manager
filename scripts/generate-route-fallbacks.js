#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate placeholder HTML files for non-prerendered routes
 * These files are copies of index.html so the client-side router can handle them
 */
function generateRouteFallbacks() {
  try {
    const buildDir = path.join(__dirname, '..', 'build');
    
    // Ensure build directory exists
    if (!fs.existsSync(buildDir)) {
      console.error('❌ Build directory does not exist. Please run "npm run build" first.');
      process.exit(1);
    }

    // Read the index.html file
    const indexHtmlPath = path.join(buildDir, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) {
      console.error('❌ index.html does not exist in build directory.');
      process.exit(1);
    }

    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

    // Routes that need placeholder HTML files (non-prerendered routes)
    const routes = [
      'expenses',
      'categories',
      'budgets',
      'reports',
      'add',
      'register',
      'forgot-password',
      'profile',
      'settings'
    ];

    let created = 0;
    let skipped = 0;

    routes.forEach(route => {
      const routeDir = path.join(buildDir, route);
      const routeIndexPath = path.join(routeDir, 'index.html');

      // Create directory if it doesn't exist
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }

      // Only create if it doesn't already exist (to avoid overwriting prerendered pages)
      if (!fs.existsSync(routeIndexPath)) {
        fs.writeFileSync(routeIndexPath, indexHtml);
        created++;
      } else {
        skipped++;
      }
    });

    console.log(`✅ Generated ${created} route fallback files`);
    if (skipped > 0) {
      console.log(`ℹ️  Skipped ${skipped} routes (already exist - likely prerendered)`);
    }
    console.log(`📍 Routes: ${routes.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error generating route fallbacks:', error.message);
    process.exit(1);
  }
}

generateRouteFallbacks();
