# Setting Up GitHub Secrets

This guide shows you exactly how to add your Firebase and reCAPTCHA credentials to GitHub Secrets so your build works.

## Step-by-Step Instructions

### Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one if you haven't)
3. Click the **gear icon** ⚙️ next to "Project Overview"
4. Select **Project settings**
5. Scroll down to **Your apps** section
6. If you don't have a web app yet:
   - Click **Web icon** `</>`
   - Register app: "SpendWise Web"
   - Click **Register app**
7. You'll see your `firebaseConfig` object. Copy these values:

```javascript
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_auth_domain",
  projectId: "your_project_id",
  storageBucket: "your_project_id.firebasestorage.app",
  messagingSenderId: "your_messaging_sender_id",
  appId: "your_app_id"
};
```

### Step 2: Get Your reCAPTCHA Site Key

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Find your site (or create one if needed)
3. Copy the **Site Key** (not the Secret Key)

### Step 3: Add Secrets to GitHub

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/yourusername/spendwise`

2. **Open Settings**
   - Click **Settings** tab (top navigation)

3. **Go to Secrets**
   - In the left sidebar, click **Secrets and variables**
   - Click **Actions**

4. **Add Each Secret**
   - Click **New repository secret** button
   - Add each secret one by one:

#### Secret 1: Firebase API Key
- **Name:** `PUBLIC_FIREBASE_API_KEY`
- **Value:** `your_api_key` (your actual API key)
- Click **Add secret**

#### Secret 2: Firebase Auth Domain
- **Name:** `PUBLIC_FIREBASE_AUTH_DOMAIN`
- **Value:** `your_auth_domain` (your actual domain)
- Click **Add secret**

#### Secret 3: Firebase Project ID
- **Name:** `PUBLIC_FIREBASE_PROJECT_ID`
- **Value:** `your_project_id` (your actual project ID)
- Click **Add secret**

#### Secret 4: Firebase Storage Bucket
- **Name:** `PUBLIC_FIREBASE_STORAGE_BUCKET`
- **Value:** `your_project_id.firebasestorage.app` (your actual bucket)
- Click **Add secret**

#### Secret 5: Firebase Messaging Sender ID
- **Name:** `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- **Value:** `your_messaging_sender_id` (your actual sender ID)
- Click **Add secret**

#### Secret 6: Firebase App ID
- **Name:** `PUBLIC_FIREBASE_APP_ID`
- **Value:** `your_app_id` (your actual app ID)
- Click **Add secret**

#### Secret 7: reCAPTCHA Site Key
- **Name:** `PUBLIC_RECAPTCHA_SITE_KEY`
- **Value:** `site_key` (your actual site key)
- Click **Add secret**

### Step 4: Verify Secrets Are Added

After adding all 7 secrets, you should see them listed:

```
PUBLIC_FIREBASE_API_KEY          (hidden)
PUBLIC_FIREBASE_AUTH_DOMAIN      (hidden)
PUBLIC_FIREBASE_PROJECT_ID       (hidden)
PUBLIC_FIREBASE_STORAGE_BUCKET   (hidden)
PUBLIC_FIREBASE_MESSAGING_SENDER_ID (hidden)
PUBLIC_FIREBASE_APP_ID           (hidden)
PUBLIC_RECAPTCHA_SITE_KEY        (hidden)
```

**Important:** The values will be hidden (shown as dots) - this is normal and secure.

### Step 5: Trigger a New Build

1. **Go to Actions tab**
   - Click **Actions** in your repository

2. **Run the workflow**
   - Click **Deploy to GitHub Pages** workflow
   - Click **Run workflow** button (top right)
   - Select branch: `main`
   - Click **Run workflow**

3. **Wait for build**
   - The build should now succeed!
   - Check the logs if there are any issues

## Quick Reference: Secret Names

Make sure you use these **exact** names (case-sensitive):

```
PUBLIC_FIREBASE_API_KEY
PUBLIC_FIREBASE_AUTH_DOMAIN
PUBLIC_FIREBASE_PROJECT_ID
PUBLIC_FIREBASE_STORAGE_BUCKET
PUBLIC_FIREBASE_MESSAGING_SENDER_ID
PUBLIC_FIREBASE_APP_ID
PUBLIC_RECAPTCHA_SITE_KEY
```

## Common Mistakes

### ❌ Wrong Secret Name
- Using `FIREBASE_API_KEY` instead of `PUBLIC_FIREBASE_API_KEY`
- Missing the `PUBLIC_` prefix
- Typos in the name

### ❌ Wrong Value
- Copying the entire `firebaseConfig` object instead of just the value
- Including quotes or extra spaces
- Using the Secret Key instead of Site Key for reCAPTCHA

### ❌ Not Adding All Secrets
- Missing one or more secrets
- Build will fail if any are missing

## Troubleshooting

### Build Still Fails: "Invalid API Key"

1. **Double-check the API key value**
   - Make sure you copied the exact value from Firebase Console
   - No extra spaces or quotes

2. **Verify secret name**
   - Must be exactly: `PUBLIC_FIREBASE_API_KEY`
   - Case-sensitive!

3. **Check Firebase project is active**
   - Go to Firebase Console
   - Make sure project is not disabled

4. **Re-run the workflow**
   - Go to Actions → Deploy to GitHub Pages
   - Click "Re-run all jobs"

### Build Fails: "Missing Environment Variable"

- Check that all 7 secrets are added
- Verify secret names match exactly
- Make sure secrets start with `PUBLIC_`

### Can't See Secrets After Adding

- Secrets are hidden for security (this is normal)
- You can only see the names, not the values
- To verify, check if build succeeds

## Security Notes

✅ **Safe:**
- Secrets are encrypted by GitHub
- Never visible in code or logs
- Only accessible during build

⚠️ **Remember:**
- Firebase API keys are public by design
- Security comes from Firestore Rules
- Never commit secrets to code

## Next Steps

After secrets are set up:

1. ✅ Build should succeed
2. ✅ Site will deploy to GitHub Pages
3. ✅ Firebase will work on the live site

See [Deployment Guide](./deployment.md) for more details.

---

**Need help?** Check the build logs in the Actions tab for specific error messages.
