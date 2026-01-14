# Architecture Overview

Technical architecture and design decisions for SpendWise.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                  Browser                        │
│  ┌──────────────────────────────────────────┐  │
│  │         SvelteKit Application            │  │
│  │  ┌──────────────┐  ┌──────────────────┐ │  │
│  │  │   Routes     │  │    Components     │ │  │
│  │  │  (Pages)     │  │   (UI Library)    │ │  │
│  │  └──────┬───────┘  └────────┬──────────┘ │  │
│  │         │                   │             │  │
│  │  ┌──────▼───────────────────▼──────────┐ │  │
│  │  │         Svelte Stores               │ │  │
│  │  │  (State Management)                 │ │  │
│  │  └──────┬───────────────────┬──────────┘ │  │
│  │         │                   │             │  │
│  │  ┌──────▼──────────┐  ┌─────▼──────────┐ │  │
│  │  │  localStorage   │  │   Firebase     │ │  │
│  │  │  (Offline)      │  │   (Cloud Sync)  │ │  │
│  │  └─────────────────┘  └────────────────┘ │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **SvelteKit**: Full-stack framework with file-based routing
- **Svelte 5**: Component framework with runes (`$state`, `$derived`, `$effect`)
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS 4**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server

### Backend (Optional)

- **Firebase Authentication**: Email/Password, Google OAuth
- **Cloud Firestore**: NoSQL database for cloud sync
- **Firebase App Check**: reCAPTCHA v3 protection

### Deployment

- **GitHub Actions**: CI/CD pipeline
- **GitHub Pages**: Static site hosting
- **Static Site Generation**: Pre-rendered HTML/CSS/JS

## Data Flow

### Local-First Architecture

```
User Action
    ↓
Component Handler
    ↓
Store Action (e.g., expenses.add())
    ↓
┌─────────────────────────┐
│  Local Store Update     │ ← Immediate UI update
│  (Svelte Store)         │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│  localStorage Save      │ ← Persistence
│  (Browser Storage)      │
└─────────────────────────┘
            │
            ↓ (if authenticated)
┌─────────────────────────┐
│  Firebase Sync          │ ← Cloud backup
│  (Firestore)            │
└─────────────────────────┘
```

### Real-Time Sync

```
Firestore Change
    ↓
onSnapshot Listener
    ↓
Compare with Local Store
    ↓
Update Local Store (if different)
    ↓
Update localStorage
    ↓
UI Reacts (Svelte reactivity)
```

## State Management

### Svelte Stores

SpendWise uses Svelte's built-in store system:

**Store Structure:**
```typescript
// Example: expenses.ts
export const expenses = writable<Expense[]>([]);

export const expenseActions = {
  add: async (formData) => {
    // 1. Create expense object
    // 2. Update store
    // 3. Save to localStorage
    // 4. Sync to Firebase (if authenticated)
  },
  // ... other methods
};
```

**Stores:**
- `expenses` - Expense data
- `categories` - Category definitions
- `budgets` - Budget limits
- `auth` - Authentication state
- `preferences` - User preferences

### Derived Stores

Computed values using `$derived`:

```typescript
export const todayExpenses = $derived(
  $expenses.filter(e => isToday(e.date))
);

export const monthStats = $derived(
  calculateStats($monthExpenses)
);
```

## Component Architecture

### Component Hierarchy

```
App (+layout.svelte)
├── Navbar
├── Main Content
│   ├── Dashboard (+page.svelte)
│   ├── Expenses List
│   ├── Categories
│   └── ...
├── BottomNav (mobile)
└── Footer
```

### Component Types

1. **Layout Components**: Structure (Navbar, Footer)
2. **Page Components**: Routes (Dashboard, Expenses)
3. **UI Components**: Reusable (Button, Card, Modal)
4. **Feature Components**: Domain-specific (QuickAddExpense)

## Firebase Integration

### Authentication Flow

```
User Login
    ↓
Firebase Auth (signInWithEmailAndPassword)
    ↓
Auth State Change (onAuthStateChanged)
    ↓
Update authStore
    ↓
Start Firestore Sync
    ↓
Load User Data
```

### Data Sync Strategy

**Write Path:**
1. Update local store (optimistic update)
2. Save to localStorage
3. Sync to Firestore (async, non-blocking)

**Read Path:**
1. Load from localStorage (immediate)
2. Start Firestore listener
3. Update when Firestore data arrives

**Conflict Resolution:**
- Firestore data takes precedence
- Change detection prevents loops
- Timestamps track updates

## Routing

SvelteKit file-based routing:

```
src/routes/
├── +page.svelte           → / (Dashboard)
├── expenses/
│   ├── +page.svelte       → /expenses
│   └── [id]/
│       └── +page.svelte   → /expenses/:id
├── categories/
│   └── +page.svelte       → /categories
└── ...
```

**Route Protection:**
- Client-side guards in `+layout.svelte`
- Redirects unauthenticated users to `/login`

## Build Process

### Development

```
npm run dev
    ↓
Vite Dev Server
    ↓
Hot Module Replacement
    ↓
Browser (localhost:5173)
```

### Production Build

```
npm run build
    ↓
SvelteKit Build
    ↓
Static Site Generation
    ↓
build/ folder
    ├── index.html
    ├── _app/
    │   ├── chunks/
    │   └── ...
    └── assets/
```

## Security

### Client-Side

- Environment variables for sensitive config
- Input validation
- XSS protection (Svelte auto-escaping)

### Server-Side (Firebase)

- Firestore Security Rules
- App Check (reCAPTCHA v3)
- Authentication required for writes
- User data isolation

### Secrets Management

- `.env` for local development (gitignored)
- GitHub Secrets for CI/CD
- No secrets in codebase

## Performance

### Optimizations

1. **Static Site Generation**: Pre-rendered pages
2. **Code Splitting**: Route-based chunks
3. **Lazy Loading**: Dynamic imports for Firebase
4. **Local-First**: Instant UI updates
5. **Optimistic Updates**: Update UI before server response

### Bundle Size

- Tree-shaking removes unused code
- Dynamic imports for Firebase
- Minimal dependencies

## Offline Support

### Strategy

1. **Local Storage**: Primary data store
2. **Service Worker**: (Future) Cache assets
3. **Queue Operations**: Sync when online
4. **Conflict Resolution**: Last-write-wins

### Current Implementation

- Works fully offline
- Data persists in localStorage
- Syncs when online (if authenticated)
- Service Worker (planned)

## Testing Strategy

### Manual Testing

- Browser DevTools
- Multiple devices
- Offline/online scenarios

### Automated Testing

- TypeScript type checking
- ESLint for code quality
- (Future) Unit tests with Vitest

## Deployment

### GitHub Pages

1. Push to `main` branch
2. GitHub Actions builds
3. Static files uploaded
4. GitHub Pages serves

### Environment Variables

- Build-time injection
- No runtime config needed
- Secrets in GitHub Secrets

## Future Enhancements

- [ ] Service Worker for offline
- [ ] Unit and E2E tests
- [ ] PWA support
- [ ] Data export/import
- [ ] Sharing & collaboration
- [ ] Mobile app (Capacitor)

---

**Architecture designed for:**
- Performance
- Offline-first
- Developer experience
- User privacy
- Scalability
