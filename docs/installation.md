# Installation Guide

Complete installation instructions for SpendWise.

## System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or pnpm/yarn)
- **Operating System**: Windows, macOS, or Linux
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)

## Step-by-Step Installation

### 1. Install Node.js

If you don't have Node.js installed:

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS (Long Term Support) version
3. Run the installer
4. Verify installation:
   ```bash
   node --version  # Should show v18.x.x or higher
   npm --version   # Should show 9.x.x or higher
   ```

### 2. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/your-username/spendwise.git

# Or using SSH
git clone git@github.com:your-username/spendwise.git

# Navigate to project directory
cd spendwise
```

### 3. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- SvelteKit and Svelte 5
- Firebase SDK
- Tailwind CSS
- TypeScript
- Development tools

### 4. Configure Environment Variables (Optional)

For local development without Firebase, you can skip this step. For Firebase integration:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your Firebase credentials (see [Firebase Setup](./firebase-setup.md))

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Verification

To verify everything is working:

1. Development server starts without errors
2. Browser opens to the dashboard
3. You can add an expense
4. Data persists in browser localStorage

## Production Build

To build for production:

```bash
# Build static files
npm run build

# Preview the build
npm run preview
```

The built files will be in the `build/` directory.

## Common Issues

### Node Version Mismatch

If you get version errors:

```bash
# Use nvm to switch Node versions
nvm install 18
nvm use 18
```

### Permission Errors (Linux/macOS)

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

### Port Conflicts

If port 5173 is in use, Vite will automatically use the next available port. Check the terminal output.

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .svelte-kit
npm install
```

## Next Steps

- [Getting Started](./getting-started.md) - Quick overview
- [Firebase Setup](./firebase-setup.md) - Enable cloud sync
- [Deployment](./deployment.md) - Deploy to production

---

**Installation complete!** You're ready to start developing.
