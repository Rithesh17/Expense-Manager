# 💰 Expense Manager

A free, privacy-focused personal expense tracking web application. Track your spending, manage budgets, categorize expenses, and gain insights into your financial habits.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![SvelteKit](https://img.shields.io/badge/SvelteKit-5.0-orange.svg)
![Status](https://img.shields.io/badge/status-Phase%201%20Complete-green.svg)

## ✨ Features

- 📊 **Visual Dashboard** - See your spending at a glance with charts and metrics
- 🏷️ **Custom Categories** - Organize expenses with icons, colors, and subcategories
- 💵 **Budget Tracking** - Set spending limits and get alerts when approaching budget
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🔒 **Privacy First** - Your data stays private; share only what you choose
- 👥 **Share & Split** - Share expenses with friends and split bills easily
- 📴 **Offline Support** - Works offline with automatic sync when online (coming soon)
- 📤 **Import/Export** - Export your data as JSON or CSV (coming soon)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/expense-manager.git
cd expense-manager

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

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [SvelteKit](https://kit.svelte.dev/) | Frontend framework |
| [Svelte 5](https://svelte.dev/) | UI components with runes |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [statue-ssg](https://github.com/accretional/statue) | Static site generation |
| [Firebase](https://firebase.google.com/) | Backend (Auth, Firestore, Storage) - Phase 9 |
| [GitHub Pages](https://pages.github.com/) | Hosting |

## 📁 Project Structure

```
expense-manager/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # Svelte stores (Phase 2)
│   │   ├── types/          # TypeScript interfaces (Phase 2)
│   │   ├── utils/          # Utility functions (Phase 2)
│   │   └── index.css       # Global styles & theme
│   └── routes/
│       ├── +page.svelte    # Dashboard
│       ├── expenses/       # Expense list & management
│       ├── add/            # Add new expense
│       ├── categories/     # Category management
│       ├── budgets/        # Budget tracking
│       ├── reports/        # Analytics & reports
│       └── settings/       # User settings
├── static/                 # Static assets
├── content/                # Markdown content (legal pages)
├── site.config.js          # Site configuration
├── EXPENSE_TRACKER_DESIGN.md  # Full design document
└── package.json
```

## 📋 Development Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project Setup & Core UI | ✅ Complete |
| 2 | Data Layer & Storage | 🔲 Not Started |
| 3 | Expense Management | 🔲 Not Started |
| 4 | Category Management | 🔲 Not Started |
| 5 | Dashboard & Visualizations | 🔲 Not Started |
| 6 | Budget Management | 🔲 Not Started |
| 7 | Reports & Analytics | 🔲 Not Started |
| 8 | Search & Filtering | 🔲 Not Started |
| 9 | Firebase Integration | 🔲 Not Started |
| 10 | Sharing & Collaboration | 🔲 Not Started |
| 11 | Polish & Optimization | 🔲 Not Started |

See [EXPENSE_TRACKER_DESIGN.md](./EXPENSE_TRACKER_DESIGN.md) for detailed specifications.

## 🎨 Components

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

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Type-check the project |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint code with ESLint |

## 🤝 Contributing

Contributions are welcome! Please read the design document first to understand the architecture and planned features.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons inspired by [Feather Icons](https://feathericons.com/)
- Static site generation powered by [statue-ssg](https://github.com/accretional/statue)

---

**Made with ❤️ for better personal finance management**
