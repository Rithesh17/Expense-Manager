# GitHub Pages Base Path Configuration

If your repository is not named `username.github.io`, GitHub Pages serves your site from a subdirectory like `https://username.github.io/repository-name/`. This requires configuring the base path in SvelteKit.

## Quick Fix

The workflow is already configured to automatically detect the base path. However, if you're still seeing 404 errors, check the following:

### Option 1: Repository Name Matches URL

If your repository is `spendwise` and your site is at `https://rithesh17.github.io/spendwise/`, the workflow should automatically set the base path to `/spendwise`.

### Option 2: Manual Configuration

If automatic detection doesn't work, you can manually set it:

1. **In GitHub Secrets:**
   - Go to Settings → Secrets and variables → Actions
   - Add a new secret:
     - **Name:** `BASE_PATH`
     - **Value:** `/your-repository-name` (e.g., `/spendwise`)
   - Note: Include the leading slash, no trailing slash

2. **Or update the workflow:**
   Edit `.github/workflows/deploy.yml` and change:
   ```yaml
   BASE_PATH: ${{ github.repository == format('{0}/{0}.github.io', github.repository_owner) && '' || format('/{0}', github.event.repository.name) }}
   ```
   
   To:
   ```yaml
   BASE_PATH: '/your-repository-name'
   ```

### Option 3: Deploy to Root Domain

If you want to deploy to `https://rithesh17.github.io/` (root domain):

1. Create a repository named `rithesh17.github.io`
2. Push your code there
3. The base path will automatically be empty (root)

## How to Find Your Repository Name

1. Go to your GitHub repository
2. Look at the URL: `https://github.com/username/repository-name`
3. The repository name is the last part after the `/`

## Verification

After setting the base path:

1. Push changes to trigger a new build
2. Check the build logs - you should see the base path being used
3. Visit your site - assets should load correctly

## Troubleshooting

### Still Getting 404 Errors

1. **Check the base path is correct:**
   - Repository name: `spendwise` → Base path: `/spendwise`
   - Repository name: `Expense-Manager` → Base path: `/Expense-Manager`

2. **Verify in build logs:**
   - Check GitHub Actions → Build job → Build step
   - Look for any base path configuration

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

4. **Check the HTML source:**
   - View page source on your deployed site
   - Look for script tags - they should include the base path
   - Example: `<script src="/spendwise/_app/..."></script>`

### Assets Loading from Wrong Path

If assets are trying to load from root (`/_app/...`) instead of subdirectory (`/repo-name/_app/...`):

1. Verify `BASE_PATH` is set in the workflow
2. Rebuild the site
3. Check that `svelte.config.js` has `paths.base` configured

## Current Configuration

The workflow automatically detects the base path based on:
- If repository is `username.github.io` → Base path: `` (empty, root)
- Otherwise → Base path: `/repository-name`

This should work automatically, but if you need to override it, use the manual configuration above.

---

**Need help?** Check the build logs in GitHub Actions for the exact base path being used.
