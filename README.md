# SpendWise

A free, privacy-focused personal expense tracking web application. Made this so I can be more responsible with my money XD

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![SvelteKit](https://img.shields.io/badge/SvelteKit-5.0-orange.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-green.svg)

## Features

- **Visual Dashboard** - See your spending at a glance with charts and metrics
- **Custom Categories** - Organize expenses with icons, colors, and subcategories
- **Budget Tracking** - Set spending limits and get alerts when approaching budget
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Privacy First** - Your data stays private; share only what you choose
- **Share & Split** - Share expenses with friends and split bills easily
- **Offline Support** - Works offline with automatic sync when online (coming soon)
- **Import/Export** - Export your data as JSON or CSV (coming soon)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/spendwise.git
cd spendwise

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build static site
npm run build

# Preview production build
npm run preview
```

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

- [Getting Started](./docs/getting-started.md) - Quick start guide
- [Installation Guide](./docs/installation.md) - Detailed setup
- [Firebase Setup](./docs/firebase-setup.md) - Cloud sync configuration
- [Deployment Guide](./docs/deployment.md) - Deploy to GitHub Pages
- [Development Guide](./docs/development.md) - For contributors
- [Architecture](./docs/architecture.md) - Technical overview

**New to SpendWise?** Start with the [Getting Started Guide](./docs/getting-started.md)!

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [SvelteKit](https://kit.svelte.dev/) | Frontend framework |
| [Svelte 5](https://svelte.dev/) | UI components with runes |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [statue-ssg](https://github.com/accretional/statue) | Static site generation |
| [Firebase](https://firebase.google.com/) | Backend (Auth, Firestore, Storage) - Phase 9 |
| [GitHub Pages](https://pages.github.com/) | Hosting |

## Project Structure

```
spendwise/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # Svelte stores with localStorage persistence
│   │   ├── firebase/       # Firebase integration
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Utility functions
│   │   └── index.css       # Global styles & theme
│   └── routes/
│       ├── +page.svelte    # Dashboard
│       ├── expenses/       # Expense list & management
│       ├── add/            # Add new expense
│       ├── categories/     # Category management
│       ├── budgets/        # Budget tracking
│       ├── reports/        # Analytics & reports
│       └── profile/        # User profile & settings
├── static/                 # Static assets
├── docs/                   # Documentation
├── site.config.js          # Site configuration
└── package.json
```

## Components

The app includes a custom component library:

| Component | Description |
|-----------|-------------|
| `PageHeader` | Page title with optional back button |
| `StatCard` | Metric display with trends |
| `Card` | Generic card container |
| `Button` | Multi-variant button |
| `Modal` | Accessible dialog |
| `EmptyState` | Empty state with CTA |
| `Skeleton` | Loading skeleton |
| `Toast` | Notifications |
| `Icon` | 50+ SVG icons |
| `BottomNav` | Mobile navigation |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Type-check the project |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint code with ESLint |

## Contributing

Contributions are welcome! Please read the [Development Guide](./docs/development.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test them
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

See [Development Guide](./docs/development.md) for detailed contribution guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons inspired by [Feather Icons](https://feathericons.com/)
- Static site generation powered by [statue-ssg](https://github.com/accretional/statue)

---

**Made with ❤️ for my own better personal finance management**