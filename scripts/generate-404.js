#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate 404.html for GitHub Pages
 * This file is served by GitHub Pages for any 404 errors,
 * allowing SvelteKit to handle client-side routing
 */
function generate404() {
  try {
    const buildDir = path.join(__dirname, '..', 'build');
    
    // Ensure build directory exists
    if (!fs.existsSync(buildDir)) {
      console.error('❌ Build directory does not exist. Please run "npm run build" first.');
      process.exit(1);
    }

    // Get base path from environment or detect from build
    const basePath = process.env.BASE_PATH || '';
    
    // Create a styled 404 page that redirects to index.html for SPA routing
    // This page is shown briefly before redirect, providing a better UX
    const html404 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found | SpendWise</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      color: #F8FAFC;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow: hidden;
    }
    
    .container {
      text-align: center;
      max-width: 600px;
      animation: fadeIn 0.5s ease-in;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .emoji {
      font-size: 6rem;
      margin-bottom: 1rem;
      animation: bounce 2s infinite;
    }
    
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }
    
    h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .message {
      font-size: 1.5rem;
      color: #94A3B8;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    
    .submessage {
      font-size: 1rem;
      color: #64748B;
      margin-bottom: 2rem;
    }
    
    .redirect-info {
      font-size: 0.875rem;
      color: #64748B;
      margin-top: 2rem;
      opacity: 0.7;
    }
    
    .link {
      color: #60A5FA;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: all 0.2s;
    }
    
    .link:hover {
      border-bottom-color: #60A5FA;
    }
    
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(59, 130, 246, 0.3);
      border-radius: 50%;
      border-top-color: #3B82F6;
      animation: spin 1s linear infinite;
      margin-left: 0.5rem;
      vertical-align: middle;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    @media (max-width: 600px) {
      h1 {
        font-size: 2rem;
      }
      
      .message {
        font-size: 1.25rem;
      }
      
      .emoji {
        font-size: 4rem;
      }
    }
  </style>
  <script>
    (function() {
      // Base path from build environment (set during GitHub Actions build)
      const envBasePath = ${JSON.stringify(basePath)};
      
      // Get the current pathname (e.g., /SpendWise/login)
      const currentPath = window.location.pathname;
      
      // Determine the base path
      let finalBasePath = envBasePath;
      
      // If no env base path, try to detect from URL
      // For GitHub Pages subdirectory: /repo-name/path → base is /repo-name
      if (!finalBasePath && currentPath !== '/') {
        const pathParts = currentPath.split('/').filter(p => p);
        if (pathParts.length > 0) {
          // First segment is likely the base path (repository name)
          finalBasePath = '/' + pathParts[0];
        }
      }
      
      // Normalize: ensure starts with /, remove trailing /
      if (finalBasePath && !finalBasePath.startsWith('/')) {
        finalBasePath = '/' + finalBasePath;
      }
      if (finalBasePath.endsWith('/')) {
        finalBasePath = finalBasePath.slice(0, -1);
      }
      
      // Instead of redirecting, we'll try to load index.html content
      // But first, let's try a simpler approach: redirect to the original path
      // which should trigger SvelteKit's router
      
      // Actually, the best approach for GitHub Pages is:
      // 1. Show the nice 404 message
      // 2. Redirect to index.html
      // 3. SvelteKit's router will check the current URL and navigate
      
      // But wait - when GitHub Pages serves 404.html, the URL is still the original
      // So we can just redirect to index.html and let SvelteKit handle it
      // OR we can redirect to the original path and hope GitHub Pages serves index.html
      
      // Redirect to home page after showing the 404 message
      // Redirect to the root path, not index.html, to avoid redirect loops
      setTimeout(function() {
        // Redirect to home (root path) - SvelteKit will handle routing from there
        const redirectUrl = finalBasePath + '/' + window.location.search + window.location.hash;
        window.location.replace(redirectUrl);
      }, 3000); // 3 second delay to show the message
    })();
  </script>
</head>
<body>
  <div class="container">
    <div class="emoji">💸</div>
    <h1>404</h1>
    <p class="message">
      Uh oh! This is embarrassing...<br>
      We seem to have lost track of this page!
    </p>
    <p class="submessage">
      Don't worry, we're taking you back to the dashboard.
      <span class="spinner"></span>
    </p>
    <p class="redirect-info">
      Taking you back to the dashboard...<br>
      <a href="${basePath || ''}/" class="link">Or click here to go home now</a>
    </p>
  </div>
</body>
</html>`;

    const filePath = path.join(buildDir, '404.html');
    fs.writeFileSync(filePath, html404);
    
    console.log('✅ Generated 404.html for GitHub Pages');
    console.log(`📍 Location: ${filePath}`);
    console.log(`🔗 Base path: ${basePath || '(root)'}`);
    console.log(`ℹ️  Custom 404 page with redirect to index.html for SPA routing`);
    
  } catch (error) {
    console.error('❌ Error generating 404.html:', error.message);
    process.exit(1);
  }
}

generate404();
