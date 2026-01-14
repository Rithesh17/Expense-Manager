# Getting Started with SpendWise

Welcome to SpendWise! This guide will help you get up and running quickly.

## What is SpendWise?

SpendWise is a free, privacy-focused personal expense tracking web application built with SvelteKit. Track your spending, manage budgets, categorize expenses, and gain insights into your financial habits.

## Quick Start (5 minutes)

### Prerequisites

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** or **pnpm** (comes with Node.js)
- A code editor (VS Code recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/spendwise.git
   cd spendwise
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - You should see the SpendWise dashboard!

## First Steps

### 1. Try It Out Locally (No Firebase Required)

SpendWise works **offline-first** with local storage. You can use it immediately without any setup:

- Add expenses
- Create categories
- Set budgets
- View reports
- All data stored in your browser

### 2. Set Up Firebase (Optional - For Cloud Sync)

If you want to sync your data across devices, set up Firebase:

1. See [Firebase Setup Guide](./firebase-setup.md) for detailed instructions
2. Create a Firebase project
3. Configure environment variables
4. Enable authentication and Firestore

**Note:** You can use SpendWise fully without Firebase - it works great offline!

## Project Structure

```
spendwise/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # State management (Svelte stores)
│   │   ├── firebase/       # Firebase integration
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
│   └── routes/             # Pages (SvelteKit file-based routing)
├── static/                 # Static assets (images, favicon)
├── docs/                   # Documentation
└── package.json            # Dependencies and scripts
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Type-check TypeScript |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint code with ESLint |

## Next Steps

- [Installation Guide](./installation.md) - Detailed setup instructions
- [Firebase Setup](./firebase-setup.md) - Configure cloud sync
- [Deployment Guide](./deployment.md) - Deploy to GitHub Pages
- [Development Guide](./development.md) - Contributing and development
- [Architecture](./architecture.md) - Technical overview

## Need Help?

- Check the [Troubleshooting](#troubleshooting) section below
- Review the [Development Guide](./development.md)
- Open an issue on GitHub

## Troubleshooting

### Port Already in Use

If port 5173 is taken, Vite will automatically use the next available port. Check the terminal output for the actual URL.

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Run type checking
npm run check
```

### Firebase Not Working

- Make sure you've set up environment variables (see [Firebase Setup](./firebase-setup.md))
- Check browser console for errors
- Verify Firebase project is active

---

**Ready to start tracking your expenses?** Run `npm run dev` and open `http://localhost:5173`
