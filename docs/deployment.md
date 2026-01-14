# Deployment Guide

Deploy SpendWise to GitHub Pages with secure environment variable handling.

## Overview

This guide covers deploying SpendWise to GitHub Pages using GitHub Actions. The deployment process:

1. Builds static files from your SvelteKit project
2. Uses GitHub Secrets for sensitive keys
3. Automatically deploys on every push to `main`

## Prerequisites

- GitHub repository
- GitHub Pages enabled
- Firebase credentials (if using Firebase)
- 10 minutes

## Quick Start

### Option 1: Deploy from Same Repository (Recommended)

1. **Set up GitHub Secrets** (see [Step 2](#step-2-configure-github-secrets))
2. **Enable GitHub Pages**:
   - Go to repository **Settings** → **Pages**
   - **Source**: Select `GitHub Actions`
   - Save
3. **Push to main branch** - Deployment happens automatically!

### Option 2: Deploy to Separate Repository

If you want to deploy to `username.github.io`:

1. Create a new repository: `yourusername.github.io`
2. Follow the separate repo workflow (see below)

## Step-by-Step Guide

### Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Configure GitHub Secrets

GitHub Secrets store your Firebase credentials securely. **This is required for the build to work!**

📖 **Detailed instructions:** See [GitHub Secrets Setup Guide](./github-secrets-setup.md) for step-by-step instructions with screenshots.

**Quick steps:**

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of these 7 secrets:

   | Secret Name | Where to Get It |
   |------------|-----------------|
   | `PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps → Web app config |
   | `PUBLIC_FIREBASE_AUTH_DOMAIN` | Same as above (authDomain) |
   | `PUBLIC_FIREBASE_PROJECT_ID` | Same as above (projectId) |
   | `PUBLIC_FIREBASE_STORAGE_BUCKET` | Same as above (storageBucket) |
   | `PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same as above (messagingSenderId) |
   | `PUBLIC_FIREBASE_APP_ID` | Same as above (appId) |
   | `PUBLIC_RECAPTCHA_SITE_KEY` | [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) |

**Important:** 
- Use the **exact** secret names (case-sensitive)
- All secrets must start with `PUBLIC_`
- Copy only the **value**, not the entire config object

### Step 3: Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select:
   - **Source**: `GitHub Actions` (not "Deploy from a branch")
3. Click **Save**

### Step 4: Deploy

The deployment workflow (`.github/workflows/deploy.yml`) will:

1. Trigger on push to `main` branch
2. Build static files with your secrets
3. Upload to GitHub Pages
4. Deploy automatically

**To deploy:**
```bash
git push origin main
```

Or trigger manually:
1. Go to **Actions** tab
2. Select **Deploy to GitHub Pages**
3. Click **Run workflow**

### Step 5: Verify Deployment

1. Wait 1-2 minutes for build to complete
2. Check **Actions** tab for build status
3. Visit your site: `https://yourusername.github.io/repository-name`
4. Test authentication and data sync

## Deployment Workflow Explained

The workflow (`.github/workflows/deploy.yml`) does:

```yaml
1. Checkout code
2. Setup Node.js
3. Install dependencies (npm ci)
4. Build with environment variables from secrets
5. Upload build artifact
6. Deploy to GitHub Pages
```

## Custom Domain (Optional)

To use a custom domain:

1. Add `CNAME` file to `static/` folder:
   ```
   yourdomain.com
   ```

2. Configure DNS:
   - Add CNAME record: `yourdomain.com` → `username.github.io`

3. In GitHub Pages settings:
   - Add custom domain: `yourdomain.com`
   - Enable "Enforce HTTPS"

## Troubleshooting

### Build Fails: "Missing Environment Variable" or "Invalid API Key"

**Solution:**
- See [GitHub Secrets Setup Guide](./github-secrets-setup.md) for detailed instructions
- Verify all 7 secrets are added in GitHub Secrets
- Check secret names match exactly (case-sensitive, must start with `PUBLIC_`)
- Make sure you copied the **value** only, not the entire config object
- Double-check for extra spaces or quotes in the values

### Site Shows "404 Not Found" or Assets Not Loading

**Solution:**
- Check GitHub Pages source is set to "GitHub Actions"
- Verify workflow completed successfully
- **If repository is not `username.github.io`**: See [Base Path Configuration](./github-pages-base-path.md)
- The workflow should automatically detect the base path, but you may need to configure it manually
- Wait a few minutes for DNS propagation

### Firebase Not Working After Deployment

**Solution:**
- Verify secrets are set correctly
- Check Firebase Console → Authentication → Authorized domains
- Add your GitHub Pages domain to authorized domains
- Verify Firestore rules are deployed

### Build Succeeds But Site Doesn't Update

**Solution:**
- Clear browser cache
- Check Actions tab for latest deployment
- Verify GitHub Pages is using the latest artifact

## Manual Deployment (Alternative)

If you prefer manual deployment:

1. Build locally:
   ```bash
   npm run build
   ```

2. Copy `build/` folder contents to your GitHub Pages repository

**Note:** Not recommended - loses automatic deployment benefits.

## Security Notes

**Secure:**
- Secrets stored encrypted in GitHub
- Never exposed in code or logs
- Only accessible during build

**Remember:**
- Firebase API keys are public by design (client-side)
- Security comes from Firestore Rules and App Check
- Never commit `.env` file to git

## Monitoring

Check deployment status:

- **Actions Tab**: See build logs and status
- **Pages Tab**: View deployment history
- **Settings → Pages**: Configure deployment source

## Next Steps

- [Firebase Setup](./firebase-setup.md) - If not done yet
- [Development Guide](./development.md) - Continue development
- Review [Firestore Rules](../firestore.rules) - Security

---

**Deployment complete!** Your app is live on GitHub Pages.
