# Firebase Setup Guide

This guide will help you set up Firebase for cloud sync, authentication, and real-time updates in SpendWise.

## Why Firebase?

Firebase enables:
- **Cloud Sync** - Access your data from any device
- **Authentication** - Secure user accounts
- **Real-time Updates** - Changes sync instantly
- **Backup** - Your data is safely stored in the cloud

**Note:** SpendWise works perfectly without Firebase using local storage. Firebase is optional but recommended for multi-device use.

## Prerequisites

- A Google account
- A Firebase project (we'll create one)
- 5-10 minutes

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `spendwise` (or your preferred name)
4. Click **Continue**
5. **Disable** Google Analytics (optional, not required)
6. Click **Create project**
7. Wait for project creation, then click **Continue**

## Step 2: Enable Authentication

1. In Firebase Console, click **Authentication** in the left menu
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle **Enable**
   - Click **Save**
5. (Optional) Enable **Google** sign-in:
   - Click on "Google"
   - Toggle **Enable**
   - Enter support email
   - Click **Save**

## Step 3: Create Firestore Database

1. Click **Firestore Database** in the left menu
2. Click **Create database**
3. Select **Start in production mode** (we'll add rules next)
4. Choose a location (select closest to you)
5. Click **Enable**

## Step 4: Configure Firestore Security Rules

1. In Firestore, go to **Rules** tab
2. Copy the rules from `firestore.rules` in your project
3. Paste and click **Publish**

Example rules (already in your project):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Expenses collection
    match /expenses/{expenseId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
    }
    
    // Categories and Budgets (similar rules)
    // ... (see firestore.rules for complete rules)
  }
}
```

## Step 5: Enable App Check (reCAPTCHA v3)

1. In Firebase Console, go to **App Check**
2. Click **Get started**
3. Click **Register app** → Select **Web**
4. Register reCAPTCHA v3:
   - Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
   - Click **+** to create a new site
   - Label: "SpendWise"
   - reCAPTCHA type: **reCAPTCHA v3**
   - Domains: Add your domain (e.g., `yourusername.github.io`)
   - Accept terms and submit
   - Copy the **Site Key**
5. Back in Firebase App Check, paste the Site Key
6. Click **Save**

## Step 6: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. Click **Web icon** `</>`
5. Register app:
   - App nickname: "SpendWise Web"
   - Click **Register app**
6. Copy the `firebaseConfig` object

It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 7: Configure Environment Variables

1. In your project, copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Firebase credentials:
   ```env
   PUBLIC_FIREBASE_API_KEY=your_api_key_here
   PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   ```

3. Replace the placeholder values with your actual Firebase config values

## Step 8: Test Firebase Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Try to create an account or sign in
4. Check the browser console for any errors
5. Verify in Firebase Console:
   - **Authentication** → Users (should show your test user)
   - **Firestore** → Data (should show collections)

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"

- Check that all environment variables are set correctly
- Restart the development server after changing `.env`
- Verify variable names start with `PUBLIC_`

### "Permission denied" in Firestore

- Check that Firestore rules are published
- Verify rules allow authenticated users
- Check browser console for specific error

### reCAPTCHA Not Working

- Verify domain is added in reCAPTCHA settings
- Check that Site Key matches in `.env`
- Ensure App Check is enabled in Firebase Console

### Authentication Not Working

- Verify Email/Password is enabled in Firebase Console
- Check that environment variables are correct
- Clear browser cache and try again

## Security Best Practices

**Do:**
- Keep `.env` file local (never commit to git)
- Use strong Firestore security rules
- Enable App Check for production
- Regularly review Firebase usage

**Don't:**
- Commit `.env` to version control
- Share your Firebase credentials
- Use production Firebase for testing
- Disable security rules in production

## Next Steps

- [Deployment Guide](./deployment.md) - Deploy with Firebase
- [Development Guide](./development.md) - Learn the codebase
- Review [Firestore Rules](../firestore.rules) - Understand security

---

**Firebase setup complete!** Your app now has cloud sync enabled.
