# Development Guide

Guide for developers contributing to or extending SpendWise.

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Architecture](#architecture)
- [Common Tasks](#common-tasks)

## Project Structure

```
spendwise/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Button.svelte
│   │   │   ├── Card.svelte
│   │   │   ├── Modal.svelte
│   │   │   └── ...
│   │   ├── stores/            # Svelte stores (state management)
│   │   │   ├── expenses.ts
│   │   │   ├── categories.ts
│   │   │   ├── budgets.ts
│   │   │   └── auth.ts
│   │   ├── firebase/          # Firebase integration
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   ├── firestore.ts
│   │   │   └── sync.ts
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Utility functions
│   │   └── index.css           # Global styles
│   └── routes/                 # Pages (file-based routing)
│       ├── +page.svelte        # Dashboard
│       ├── expenses/
│       ├── categories/
│       └── ...
├── static/                     # Static assets
├── docs/                       # Documentation
└── .github/workflows/         # CI/CD workflows
```

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [SvelteKit](https://kit.svelte.dev/) | Latest | Framework |
| [Svelte](https://svelte.dev/) | 5.x | UI components |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Styling |
| [Firebase](https://firebase.google.com/) | 12.x | Backend |
| [Vite](https://vitejs.dev/) | Latest | Build tool |

## Development Workflow

### 1. Setup

```bash
# Clone repository
git clone https://github.com/your-username/spendwise.git
cd spendwise

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Firebase credentials
```

### 2. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:5173` with hot module replacement.

### 3. Make Changes

- Edit files in `src/`
- Changes auto-reload in browser
- Check console for errors

### 4. Test Your Changes

```bash
# Type check
npm run check

# Lint
npm run lint

# Format code
npm run format
```

### 5. Build for Production

```bash
npm run build
npm run preview
```

## Code Style

### TypeScript

- Use TypeScript for all `.ts` files
- Define types in `src/lib/types/`
- Avoid `any` - use proper types

### Svelte Components

- Use Svelte 5 runes: `$state`, `$derived`, `$effect`
- Use `{#snippet}` for component composition
- Keep components focused and reusable

Example:
```svelte
<script lang="ts">
  let { title = 'Default' } = $props();
  let count = $state(0);
  
  let doubled = $derived(count * 2);
</script>

<h1>{title}</h1>
<button onclick={() => count++}>Count: {count}</button>
```

### File Naming

- Components: `PascalCase.svelte` (e.g., `Button.svelte`)
- Stores: `camelCase.ts` (e.g., `expenses.ts`)
- Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)

### Imports

```typescript
// Absolute imports (preferred)
import { Button } from '$lib/components';
import { expenses } from '$lib/stores';

// Relative imports (for same directory)
import { helper } from './utils';
```

## Testing

### Manual Testing

1. Test in multiple browsers (Chrome, Firefox, Safari)
2. Test on mobile devices
3. Test offline functionality
4. Test Firebase sync

### Type Checking

```bash
npm run check
```

### Linting

```bash
npm run lint
npm run format  # Auto-fix formatting
```

## Architecture

### State Management

SpendWise uses **Svelte stores** for state:

- `expenses.ts` - Expense data
- `categories.ts` - Category data
- `budgets.ts` - Budget data
- `auth.ts` - Authentication state
- `preferences.ts` - User preferences

Stores use localStorage for persistence and sync with Firebase when authenticated.

### Data Flow

```
User Action
    ↓
Component Handler
    ↓
Store Action (expenses.add, categories.update, etc.)
    ↓
Local Store Update (immediate)
    ↓
localStorage Save (persistence)
    ↓
Firebase Sync (if authenticated)
    ↓
Real-time Listener (updates other devices)
```

### Firebase Integration

- **Authentication**: Email/Password, Google
- **Firestore**: Expenses, Categories, Budgets
- **App Check**: reCAPTCHA v3 protection
- **Real-time Sync**: `onSnapshot` listeners

See [Firebase Setup](./firebase-setup.md) for details.

## Common Tasks

### Adding a New Component

1. Create `src/lib/components/MyComponent.svelte`
2. Export from `src/lib/components/index.ts`
3. Use in pages: `import { MyComponent } from '$lib/components'`

### Adding a New Page

1. Create `src/routes/my-page/+page.svelte`
2. Add route to navbar in `site.config.js`
3. Add to prerender entries in `svelte.config.js` (if needed)

### Adding a New Store

1. Create `src/lib/stores/mystore.ts`
2. Export from `src/lib/stores/index.ts`
3. Use: `import { myStore } from '$lib/stores'`

### Modifying Firebase Rules

1. Edit `firestore.rules`
2. Deploy: `firebase deploy --only firestore:rules`
3. Or use Firebase Console

### Adding Environment Variables

1. Add to `.env.example`
2. Add to `.env` (local)
3. Add to GitHub Secrets (deployment)
4. Use in code: `import { PUBLIC_MY_VAR } from '$env/static/public'`

## Debugging

### Browser DevTools

- **Console**: Check for errors
- **Network**: Monitor API calls
- **Application**: Check localStorage
- **React DevTools**: Not applicable (Svelte)

### Firebase Debugging

- Firebase Console → Firestore → Data
- Firebase Console → Authentication → Users
- Check browser console for Firebase errors

### Common Issues

**"Cannot read property of undefined"**
- Check TypeScript types
- Add null checks
- Verify data structure

**"Firebase not initialized"**
- Check environment variables
- Verify Firebase config
- Check browser console

**"Store not updating"**
- Verify store subscription
- Check store implementation
- Use `$derived` for computed values

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test
4. Commit: `git commit -m 'Add my feature'`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request

### Pull Request Guidelines

- ✅ Clear description of changes
- ✅ Tested locally
- ✅ Follows code style
- ✅ No TypeScript errors
- ✅ No linting errors

## Resources

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte 5 Docs](https://svelte.dev/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

## Next Steps

- [Getting Started](./getting-started.md) - For new users
- [Firebase Setup](./firebase-setup.md) - Backend configuration
- [Deployment](./deployment.md) - Production deployment
- [Architecture](./architecture.md) - Technical deep dive

---

**Happy coding!** 