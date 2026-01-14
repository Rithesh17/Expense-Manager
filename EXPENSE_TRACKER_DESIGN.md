# Expense Tracker Web Application - Design Document

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Authentication & Authorization](#authentication--authorization)
5. [Core Features](#core-features)
6. [Sharing & Collaboration](#sharing--collaboration)
7. [User Interface & Experience](#user-interface--experience)
8. [Visual Elements](#visual-elements)
9. [Security & Privacy](#security--privacy)
10. [Data Persistence & Sync](#data-persistence--sync)
11. [Performance & Scalability](#performance--scalability)

---

## Overview

### Purpose
A web application for personal expense tracking with optional sharing capabilities. The application allows users to track their expenditures, categorize spending, set budgets, and share expenses with friends through shareable links or collaborative groups.

### Key Principles
- **Offline-First**: Application works fully offline, syncing when online
- **Privacy by Default**: All expenses are private unless explicitly shared
- **Public Read, Authenticated Write**: Shareable links allow read-only public access; all write operations require authentication
- **Free & Simple**: No backend server required; uses GitHub Pages for hosting and Firebase for data storage
- **Multi-Device Sync**: Real-time synchronization across devices for authenticated users

### Target Users
- Primary: Individual users tracking personal expenses
- Secondary: Users sharing expenses with friends, roommates, or travel groups

---

## Architecture

### Hosting & Infrastructure

#### Static Site Hosting
- **Platform**: GitHub Pages
- **Type**: Static HTML/CSS/JavaScript
- **Deployment**: Automatic on git push
- **Custom Domain**: Supported
- **HTTPS**: Enabled by default

#### Backend Services
- **Database**: Firebase Firestore (NoSQL document database)
- **Authentication**: Firebase Authentication (Email/Password)
- **Storage**: Firebase Storage (optional, for receipt attachments)
- **Hosting**: Not required (using GitHub Pages)

#### Client-Side Architecture
- **Framework**: SvelteKit (statue-ssg based)
- **State Management**: Svelte stores
- **Real-time Updates**: Firebase Firestore listeners
- **Offline Support**: Firestore offline persistence + IndexedDB cache

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Pages                         │
│              (Static HTML/CSS/JavaScript)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Client-Side Code
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Firebase Services                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Firestore   │  │     Auth     │  │   Storage    │ │
│  │  (Database)  │  │  (Login)    │  │  (Receipts)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Security Rules (Access Control)          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                     │
                     │ Offline Cache
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Browser Storage                        │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │  IndexedDB   │  │ LocalStorage  │                   │
│  │  (Cache)     │  │  (Settings)   │                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

#### Read Operations
1. User requests data (expense, user profile, group)
2. Application checks authentication state
3. Queries Firestore with appropriate filters
4. Security rules validate access permissions
5. Data returned to client
6. Cached in IndexedDB for offline access

#### Write Operations
1. User attempts write operation (create, update, delete)
2. Application verifies authentication
3. If not authenticated, redirects to login
4. If authenticated, validates ownership/permissions
5. Writes to Firestore
6. Security rules enforce access control
7. Real-time listeners update all connected clients
8. Offline cache updated

#### Offline Operations
1. User performs operation while offline
2. Data written to IndexedDB cache
3. Operation queued for sync
4. When online, syncs with Firestore
5. Conflicts resolved (last-write-wins or merge strategy)

---

## Data Models

### Expense

#### Core Fields
- **id** (string, auto-generated): Unique identifier
- **userId** (string, required): Owner's Firebase UID
- **amount** (number, required): Expense amount (positive number)
- **description** (string, required): Expense description
- **category** (string, required): Category ID reference
- **date** (timestamp, required): Date and time of expense
- **createdAt** (timestamp, auto): Creation timestamp
- **updatedAt** (timestamp, auto): Last update timestamp

#### Optional Fields
- **merchant** (string, optional): Merchant/payee name
- **paymentMethod** (string, optional): Payment method (cash, card, digital wallet, etc.)
- **notes** (string, optional): Additional notes
- **tags** (array of strings, optional): User-defined tags
- **receiptUrl** (string, optional): URL to receipt image/PDF in Firebase Storage
- **location** (object, optional): Geographic location data

#### Sharing Fields
- **isShared** (boolean, default: false): Whether expense is shared with others
- **sharedWith** (array of strings, optional): Array of user IDs who can view this expense
- **shareable** (boolean, default: false): Whether expense has a public shareable link
- **shareableId** (string, optional): Unique identifier for shareable link (e.g., "abc123")
- **groupId** (string, optional): Group ID if expense belongs to a shared group

#### Split Fields
- **splitType** (string, optional): "equal", "custom", "percentage", or null
- **splits** (object, optional): Map of userId to amount/percentage
  - Example: `{ "user123": 25, "user456": 25 }` for equal split
  - Example: `{ "user123": 30, "user456": 20 }` for custom amounts

#### Example Document
```json
{
  "id": "exp_abc123",
  "userId": "user_xyz789",
  "amount": 50.00,
  "description": "Dinner at restaurant",
  "category": "cat_food",
  "date": "2024-01-15T19:30:00Z",
  "merchant": "Restaurant Name",
  "paymentMethod": "card",
  "notes": "Business dinner",
  "tags": ["business", "client-meeting"],
  "isShared": true,
  "sharedWith": ["user_def456"],
  "shareable": true,
  "shareableId": "abc123",
  "splitType": "equal",
  "splits": {
    "user_xyz789": 25.00,
    "user_def456": 25.00
  },
  "createdAt": "2024-01-15T19:35:00Z",
  "updatedAt": "2024-01-15T19:35:00Z"
}
```

### Category

#### Core Fields
- **id** (string, auto-generated): Unique identifier
- **userId** (string, nullable): Owner's Firebase UID (null for global/system categories)
- **name** (string, required): Category name
- **icon** (string, optional): Icon identifier or emoji (e.g., "🍔", "food")
- **color** (string, optional): Hex color code (e.g., "#FF5733")
- **createdAt** (timestamp, auto): Creation timestamp

#### Optional Fields
- **parentId** (string, optional): Parent category ID for subcategories
- **budget** (number, optional): Monthly budget limit for this category
- **budgetPeriod** (string, optional): "monthly", "yearly", or null

#### Example Document
```json
{
  "id": "cat_food",
  "userId": "user_xyz789",
  "name": "Food & Dining",
  "icon": "🍔",
  "color": "#FF5733",
  "budget": 500.00,
  "budgetPeriod": "monthly",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### User Profile

#### Core Fields
- **id** (string, required): Firebase Auth UID
- **email** (string, required): User's email address
- **displayName** (string, optional): User's display name
- **createdAt** (timestamp, auto): Account creation timestamp
- **lastLoginAt** (timestamp, auto): Last login timestamp

#### Public Profile Fields
- **publicProfile** (boolean, default: false): Whether profile is publicly viewable
- **shareableId** (string, optional): Custom slug for public profile URL (e.g., "john-doe")
- **showEmail** (boolean, default: false): Whether to show email on public profile
- **bio** (string, optional): User biography for public profile

#### Preferences
- **currency** (string, default: "USD"): Preferred currency code
- **dateFormat** (string, default: "MM/DD/YYYY"): Date format preference
- **theme** (string, default: "light"): "light" or "dark"
- **language** (string, default: "en"): Language preference

#### Example Document
```json
{
  "id": "user_xyz789",
  "email": "user@example.com",
  "displayName": "John Doe",
  "publicProfile": true,
  "shareableId": "john-doe",
  "showEmail": false,
  "bio": "Personal finance enthusiast",
  "currency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "theme": "dark",
  "language": "en",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-01-15T10:30:00Z"
}
```

### Group

#### Core Fields
- **id** (string, auto-generated): Unique identifier
- **name** (string, required): Group name
- **createdBy** (string, required): Creator's Firebase UID
- **createdAt** (timestamp, auto): Creation timestamp
- **updatedAt** (timestamp, auto): Last update timestamp

#### Members
- **members** (array of strings, required): Array of user IDs who are members
- **memberRoles** (object, optional): Map of userId to role ("admin", "member")
  - Example: `{ "user123": "admin", "user456": "member" }`

#### Sharing
- **shareable** (boolean, default: false): Whether group has a public shareable link
- **shareableId** (string, optional): Unique identifier for shareable link

#### Settings
- **description** (string, optional): Group description
- **defaultSplitType** (string, optional): Default split type for group expenses

#### Example Document
```json
{
  "id": "group_household_2024",
  "name": "Household Expenses 2024",
  "createdBy": "user_xyz789",
  "members": ["user_xyz789", "user_def456", "user_ghi789"],
  "memberRoles": {
    "user_xyz789": "admin",
    "user_def456": "member",
    "user_ghi789": "member"
  },
  "shareable": true,
  "shareableId": "household-2024",
  "description": "Shared expenses for our household",
  "defaultSplitType": "equal",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### Budget

#### Core Fields
- **id** (string, auto-generated): Unique identifier
- **userId** (string, required): Owner's Firebase UID
- **categoryId** (string, nullable): Category ID (null for overall budget)
- **amount** (number, required): Budget amount
- **period** (string, required): "daily", "weekly", "monthly", "yearly"
- **startDate** (timestamp, required): Budget period start date
- **endDate** (timestamp, optional): Budget period end date (for custom periods)

#### Tracking
- **spent** (number, default: 0): Amount spent in current period (calculated)
- **createdAt** (timestamp, auto): Creation timestamp
- **updatedAt** (timestamp, auto): Last update timestamp

#### Example Document
```json
{
  "id": "budget_monthly_food",
  "userId": "user_xyz789",
  "categoryId": "cat_food",
  "amount": 500.00,
  "period": "monthly",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "spent": 350.00,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Friend Relationship

#### Core Fields
- **id** (string, auto-generated): Unique identifier
- **userId** (string, required): User who initiated the relationship
- **friendId** (string, required): User who is the friend
- **status** (string, required): "pending", "accepted", "blocked"
- **createdAt** (timestamp, auto): Request creation timestamp
- **updatedAt** (timestamp, auto): Last update timestamp

#### Example Document
```json
{
  "id": "friend_req_123",
  "userId": "user_xyz789",
  "friendId": "user_def456",
  "status": "accepted",
  "createdAt": "2024-01-10T00:00:00Z",
  "updatedAt": "2024-01-10T12:00:00Z"
}
```

---

## Authentication & Authorization

### Authentication Model

#### Authentication Methods
- **Email/Password**: Primary authentication method
  - User registration with email and password
  - Password requirements: Minimum 8 characters, complexity recommended
  - Email verification: Optional but recommended
  - Password reset: Via email link

#### Authentication States
- **Unauthenticated (Public)**: No user logged in
  - Can view shareable expenses, users, and groups
  - Cannot perform any write operations
  - Cannot create expenses or manage data
- **Authenticated**: User is logged in
  - Full access to own data
  - Can create, edit, delete own expenses
  - Can share expenses and create groups
  - Can view shared expenses from friends

### Authorization Model

#### Access Control Matrix

| Resource | Public Read | Authenticated Read | Owner Write | Shared User Write |
|----------|-------------|-------------------|-------------|-------------------|
| Own Expense | No | Yes | Yes | No |
| Shareable Expense | Yes (if shareable=true) | Yes | Yes | No |
| Shared Expense | No | Yes (if in sharedWith) | Yes | No |
| Group Expense | No | Yes (if group member) | Yes | No |
| Own Profile | No | Yes | Yes | No |
| Public Profile | Yes (if publicProfile=true) | Yes | Yes | No |
| Own Category | No | Yes | Yes | No |
| Global Category | Yes | Yes | No | No |
| Own Group | No | Yes (if member) | Yes (if admin) | No |
| Shareable Group | Yes (if shareable=true) | Yes (if member) | Yes (if admin) | No |

#### Security Rules Logic

##### Expense Access Rules
- **Public Read**: Allowed if `shareable == true`
- **Authenticated Read**: Allowed if:
  - User is the owner (`userId == auth.uid`)
  - User is in `sharedWith` array
  - Expense is shareable
  - User is member of expense's group
- **Write**: Allowed only if user is the owner (`userId == auth.uid`)

##### User Profile Access Rules
- **Public Read**: Allowed if `publicProfile == true`
- **Authenticated Read**: Always allowed for own profile
- **Write**: Allowed only if user is the owner (`id == auth.uid`)

##### Group Access Rules
- **Public Read**: Allowed if `shareable == true`
- **Authenticated Read**: Allowed if user is in `members` array
- **Write**: Allowed if:
  - User is the creator (`createdBy == auth.uid`)
  - User is admin (from `memberRoles`)

### Shareable Link Security

#### Link Types
1. **Expense Links**: `/shared/expense/{shareableId}`
   - Accessible to anyone with the link
   - Read-only access
   - No authentication required
   - Link contains unique, non-sequential ID

2. **User Profile Links**: `/shared/user/{shareableId}`
   - Accessible to anyone with the link
   - Shows only public expenses
   - Read-only access
   - No authentication required

3. **Group Links**: `/shared/group/{shareableId}`
   - Accessible to anyone with the link
   - Shows group expenses
   - Read-only access
   - No authentication required

#### Link Generation
- **Expense Shareable ID**: Auto-generated unique identifier (UUID or random string)
- **User Shareable ID**: Custom slug (user-defined or auto-generated from display name)
- **Group Shareable ID**: Auto-generated or custom slug

#### Link Expiration (Future Enhancement)
- Optional expiration date for shareable links
- Time-based access control
- View count limits

---

## Core Features

### Expense Management

#### Create Expense
- **Required Fields**: Amount, description, category, date
- **Optional Fields**: Merchant, payment method, notes, tags, receipt, location
- **Validation**: 
  - Amount must be positive number
  - Description cannot be empty
  - Date cannot be in the future (configurable)
  - Category must exist
- **Default Values**: 
  - Date defaults to current date/time
  - Category defaults to last used category
- **Sharing Options**: 
  - Toggle to make shareable
  - Add friends to share with
  - Assign to group
  - Set split type and amounts

#### View Expenses
- **List View**: Table or card layout showing expenses
- **Sorting Options**: By date (newest/oldest), amount (high/low), category, description
- **Filtering Options**: 
  - By category
  - By date range
  - By amount range
  - By tags
  - By payment method
  - By shared status
- **Search**: Full-text search across description, merchant, notes, tags
- **Pagination**: Load expenses in batches (e.g., 50 per page)

#### Edit Expense
- **Access**: Only owner can edit
- **Fields**: All fields editable except ID
- **History**: Track update timestamp
- **Validation**: Same as create expense

#### Delete Expense
- **Access**: Only owner can delete
- **Confirmation**: Require confirmation dialog
- **Cascade**: If expense is in a group, remove from group totals
- **Soft Delete** (optional): Mark as deleted instead of removing

#### Bulk Operations
- **Select Multiple**: Checkbox selection for multiple expenses
- **Bulk Delete**: Delete multiple expenses at once
- **Bulk Category Change**: Change category for multiple expenses
- **Bulk Tag Addition**: Add tags to multiple expenses

### Category Management

#### Create Category
- **Required Fields**: Name
- **Optional Fields**: Icon, color, parent category, budget
- **Validation**: Name must be unique per user
- **System Categories**: Pre-defined categories available to all users

#### Edit Category
- **Access**: Only owner can edit
- **Impact**: Editing category does not affect existing expenses
- **Budget Updates**: Can update budget amount and period

#### Delete Category
- **Access**: Only owner can delete
- **Validation**: Cannot delete if expenses exist (or reassign expenses)
- **Reassignment**: Option to reassign expenses to another category

#### Category Hierarchy
- **Parent Categories**: Main categories (e.g., "Food")
- **Subcategories**: Child categories (e.g., "Groceries", "Restaurants")
- **Navigation**: Tree view for category selection

### Budget Management

#### Create Budget
- **Types**: 
  - Overall budget (all expenses)
  - Category budget (specific category)
- **Period**: Daily, weekly, monthly, yearly, custom
- **Amount**: Budget limit amount
- **Start Date**: When budget period begins
- **End Date**: When budget period ends (for custom periods)

#### Budget Tracking
- **Current Spending**: Real-time calculation of spent amount
- **Remaining**: Budget amount minus spent amount
- **Progress Indicator**: Visual progress bar showing percentage used
- **Alerts**: 
  - Warning at 80% of budget
  - Alert at 100% of budget
  - Over-budget notification

#### Budget Reports
- **Period Summary**: Total spent vs budget for period
- **Category Breakdown**: Spending by category within budget
- **Trend Analysis**: Compare current period to previous periods

### Reporting & Analytics

#### Expense Summary
- **Time Periods**: Today, this week, this month, this year, custom range
- **Totals**: Total expenses for selected period
- **Averages**: Average daily/weekly/monthly spending
- **Count**: Number of expenses in period

#### Category Analysis
- **By Category**: Total spending per category
- **Percentage**: Percentage of total spending per category
- **Trends**: Category spending over time
- **Comparison**: Compare categories side-by-side

#### Spending Trends
- **Over Time**: Line chart showing spending trends
- **Daily Patterns**: Spending by day of week
- **Monthly Patterns**: Spending by month
- **Year-over-Year**: Compare same period across years

#### Top Expenses
- **Largest Expenses**: Highest amount expenses
- **Most Frequent**: Most common categories or merchants
- **Recent**: Most recent expenses

### Search & Filter

#### Search Functionality
- **Full-Text Search**: Search across description, merchant, notes, tags
- **Fuzzy Matching**: Handle typos and partial matches
- **Search History**: Recent searches (optional)
- **Search Suggestions**: Auto-complete suggestions

#### Filter Options
- **Date Range**: Start and end date picker
- **Category**: Multi-select category filter
- **Amount Range**: Min and max amount sliders
- **Tags**: Multi-select tag filter
- **Payment Method**: Filter by payment method
- **Shared Status**: Filter by shared/private
- **Group**: Filter by group membership

#### Filter Combinations
- **Multiple Filters**: Apply multiple filters simultaneously
- **Saved Filters**: Save frequently used filter combinations
- **Filter Presets**: Quick filter buttons (e.g., "This Month", "Food Only")

---

## Sharing & Collaboration

### Shareable Links

#### Expense Shareable Links
- **Generation**: User toggles "Make shareable" on expense
- **Link Format**: `https://yoursite.com/shared/expense/{shareableId}`
- **Access**: Anyone with link can view expense (read-only)
- **Content**: Shows expense details, category, amount, date, notes
- **Actions**: 
  - Public users: View only, "Login to edit" button
  - Owner: Full edit/delete access
- **Revocation**: User can disable shareable link (sets `shareable = false`)

#### User Profile Shareable Links
- **Generation**: User enables public profile in settings
- **Link Format**: `https://yoursite.com/shared/user/{shareableId}`
- **Access**: Anyone with link can view public profile
- **Content**: 
  - User display name
  - Public expenses (where `publicProfile = true` on expense)
  - Optional: Bio, public stats
- **Privacy**: User controls which expenses are public

#### Group Shareable Links
- **Generation**: Group creator enables sharing on group
- **Link Format**: `https://yoursite.com/shared/group/{shareableId}`
- **Access**: Anyone with link can view group and its expenses
- **Content**: Group name, description, expenses, member list (optional)
- **Actions**: Public users can view only; members can add expenses

### Friend System

#### Add Friend
- **Methods**: 
  - Search by email address
  - Search by username (if implemented)
  - Accept friend request
- **Process**: 
  1. User searches for friend
  2. Sends friend request
  3. Friend receives notification
  4. Friend accepts or declines
- **Status**: Track pending, accepted, blocked status

#### Friend List
- **View**: List of all friends
- **Filter**: Active friends, pending requests, blocked users
- **Actions**: 
  - View friend's shared expenses
  - Remove friend
  - Block user

### Shared Expenses

#### Share Individual Expense
- **Method**: Toggle "Share with friends" on expense
- **Selection**: Choose friends from friend list
- **Access**: Selected friends can view expense in their shared expenses list
- **Notifications**: Friends receive notification of shared expense (optional)

#### Share via Group
- **Method**: Assign expense to group
- **Access**: All group members can view expense
- **Organization**: Expenses organized by group
- **Totals**: Group-level expense totals and statistics

### Expense Splitting

#### Split Types
- **Equal Split**: Divide expense equally among participants
- **Custom Split**: Specify exact amounts for each participant
- **Percentage Split**: Specify percentage for each participant
- **No Split**: Expense not split (owner pays full amount)

#### Split Calculation
- **Automatic**: Calculate splits based on type
- **Manual Override**: User can manually adjust split amounts
- **Validation**: Total splits must equal expense amount
- **Display**: Show each person's portion clearly

#### Settle Up
- **Calculation**: Calculate who owes whom based on all shared expenses
- **Summary**: Show net amounts (person A owes person B $X)
- **Settlement**: Mark expenses as settled (optional tracking)

### Groups

#### Create Group
- **Required**: Group name
- **Optional**: Description, default split type
- **Members**: Add friends to group
- **Settings**: Make group shareable, set permissions

#### Group Management
- **Members**: Add/remove members (admin only)
- **Roles**: Assign admin or member roles
- **Settings**: Update group name, description, sharing settings
- **Delete**: Delete group (admin only, with confirmation)

#### Group Expenses
- **View**: All expenses assigned to group
- **Add**: Members can add expenses to group
- **Totals**: Group-level spending totals and statistics
- **Reports**: Group-specific reports and analytics

---

## User Interface & Experience

### Layout Structure

#### Global Layout
- **Header**: 
  - Application logo/name
  - Navigation menu
  - User profile/account menu
  - Search bar (optional)
- **Main Content**: Page-specific content area
- **Footer**: 
  - Links (About, Privacy, Terms)
  - Copyright information
  - Version information

#### Navigation
- **Primary Navigation**: 
  - Dashboard
  - Expenses
  - Add Expense
  - Categories
  - Groups
  - Reports
  - Settings
- **Secondary Navigation**: 
  - Context-specific navigation (e.g., breadcrumbs)
  - Filter/sort controls
- **Mobile Navigation**: 
  - Bottom navigation bar
  - Hamburger menu for additional options

### Page Layouts

#### Dashboard
- **Hero Section**: Key metrics cards (today's total, month total, budget status)
- **Quick Stats**: Average daily spending, biggest expense, most used category
- **Recent Expenses**: List of most recent expenses (last 5-10)
- **Quick Actions**: Quick add expense button, view all expenses link
- **Charts**: Mini charts showing spending trends (pie chart by category, line chart over time)

#### Expense List Page
- **Toolbar**: 
  - Add expense button
  - Filter button
  - Sort dropdown
  - View toggle (list/card view)
- **Expense List**: 
  - Table or card layout
  - Each item shows: amount, description, category, date, actions
  - Expandable rows for full details
- **Pagination**: Load more button or infinite scroll
- **Empty State**: Message when no expenses match filters

#### Add/Edit Expense Page
- **Form Layout**: 
  - Amount input (prominent, large)
  - Description input
  - Category selector (dropdown or visual selector)
  - Date picker
  - Optional fields (collapsible section)
- **Sharing Section**: 
  - Toggle for shareable link
  - Friend selection for sharing
  - Group assignment
  - Split configuration
- **Actions**: 
  - Save button
  - Cancel button
  - Delete button (edit mode only)

#### Category Management Page
- **Category List**: Grid or list of categories
- **Category Cards**: Show name, icon, color, budget, expense count
- **Actions**: Add category, edit category, delete category
- **System Categories**: Separate section for pre-defined categories

#### Reports Page
- **Period Selector**: Date range picker
- **Summary Cards**: Key metrics for selected period
- **Charts Section**: 
  - Pie chart by category
  - Bar chart over time
  - Line chart for trends
- **Table View**: Detailed breakdown table
- **Export Options**: Export report as PDF/CSV

#### Settings Page
- **Account Section**: 
  - Email
  - Display name
  - Change password
  - Delete account
- **Preferences**: 
  - Currency
  - Date format
  - Theme (light/dark)
  - Language
- **Privacy**: 
  - Public profile toggle
  - Shareable ID
  - Default sharing settings
- **Data Management**: 
  - Export data
  - Import data
  - Delete all data

### Responsive Design

#### Mobile (< 768px)
- **Navigation**: Bottom navigation bar, hamburger menu
- **Layout**: Single column, stacked elements
- **Forms**: Full-width inputs, large touch targets
- **Tables**: Card view instead of table view
- **Charts**: Simplified, touch-friendly charts

#### Tablet (768px - 1024px)
- **Navigation**: Side navigation or top navigation
- **Layout**: Two-column where appropriate
- **Forms**: Standard form layout
- **Tables**: Table view with horizontal scroll if needed

#### Desktop (> 1024px)
- **Navigation**: Top navigation with dropdown menus
- **Layout**: Multi-column layouts, sidebars
- **Forms**: Multi-column form layouts
- **Tables**: Full table view with all columns visible

### Accessibility

#### Keyboard Navigation
- **Tab Order**: Logical tab order through all interactive elements
- **Shortcuts**: Keyboard shortcuts for common actions
- **Focus Indicators**: Clear focus indicators on all interactive elements

#### Screen Reader Support
- **ARIA Labels**: Proper ARIA labels on all interactive elements
- **Semantic HTML**: Use semantic HTML elements
- **Alt Text**: Descriptive alt text for images and icons
- **Live Regions**: Announce dynamic content changes

#### Visual Accessibility
- **Color Contrast**: WCAG AA compliant color contrast ratios
- **Text Size**: Scalable text (rem/em units, not fixed pixels)
- **Focus States**: Clear, visible focus states
- **Error Messages**: Clear, descriptive error messages

---

## Visual Elements

### Color System

#### Primary Colors
- **Primary**: Main brand color (e.g., blue #3B82F6)
- **Secondary**: Accent color (e.g., purple #8B5CF6)
- **Success**: Green for positive actions (#10B981)
- **Warning**: Yellow/orange for warnings (#F59E0B)
- **Error**: Red for errors (#EF4444)
- **Info**: Blue for informational messages (#3B82F6)

#### Neutral Colors
- **Background**: Light gray (#F9FAFB) or dark (#111827) for dark mode
- **Surface**: White (#FFFFFF) or dark gray (#1F2937) for dark mode
- **Text Primary**: Dark gray (#111827) or light (#F9FAFB) for dark mode
- **Text Secondary**: Medium gray (#6B7280)
- **Border**: Light gray (#E5E7EB)

#### Category Colors
- **Dynamic**: User-assignable colors per category
- **Default Palette**: Pre-defined color palette for quick selection
- **Contrast**: Ensure sufficient contrast for text readability

### Typography

#### Font Families
- **Primary**: Sans-serif font (e.g., Inter, System UI)
- **Monospace**: For numbers, codes (e.g., amounts, IDs)

#### Font Sizes
- **Heading 1**: 2.5rem (40px) - Page titles
- **Heading 2**: 2rem (32px) - Section titles
- **Heading 3**: 1.5rem (24px) - Subsection titles
- **Body**: 1rem (16px) - Default text
- **Small**: 0.875rem (14px) - Secondary text, captions
- **Tiny**: 0.75rem (12px) - Labels, metadata

#### Font Weights
- **Bold**: 700 - Headings, emphasis
- **Semibold**: 600 - Subheadings
- **Regular**: 400 - Body text
- **Light**: 300 - Large display text

### Icons & Imagery

#### Icon System
- **Style**: Consistent icon style (outline or filled)
- **Library**: Icon library (e.g., Heroicons, Feather Icons)
- **Category Icons**: Emoji or custom icons for categories
- **Action Icons**: Clear, recognizable action icons

#### Images
- **Receipts**: User-uploaded receipt images
- **Avatars**: User profile pictures (optional)
- **Placeholders**: Placeholder images for empty states

### Charts & Visualizations

#### Pie Chart (Category Breakdown)
- **Purpose**: Show spending distribution by category
- **Colors**: Use category colors
- **Labels**: Category names and percentages
- **Interactivity**: Hover to highlight, click to filter

#### Bar Chart (Time Series)
- **Purpose**: Show spending over time (daily, weekly, monthly)
- **Orientation**: Vertical bars
- **X-Axis**: Time periods
- **Y-Axis**: Amount spent
- **Colors**: Gradient or single color

#### Line Chart (Trends)
- **Purpose**: Show spending trends over time
- **Lines**: Multiple lines for category comparison (optional)
- **Points**: Data points on line
- **Area**: Optional filled area under line

#### Donut Chart (Budget Progress)
- **Purpose**: Show budget utilization
- **Inner Ring**: Spent amount
- **Outer Ring**: Budget limit
- **Colors**: Green (under budget), yellow (near limit), red (over budget)

#### Heatmap (Spending Intensity)
- **Purpose**: Show spending intensity by day
- **Grid**: Calendar grid layout
- **Colors**: Intensity-based color scale
- **Interactivity**: Hover to see details, click to view day's expenses

### Components

#### Cards
- **Expense Cards**: Show expense details in card format
- **Category Cards**: Show category with icon, color, budget
- **Stat Cards**: Show metrics (total, average, count)
- **Group Cards**: Show group information and summary

#### Buttons
- **Primary**: Main action buttons (solid, prominent)
- **Secondary**: Secondary actions (outline style)
- **Tertiary**: Tertiary actions (text style)
- **Icon Buttons**: Icon-only buttons for compact spaces
- **States**: Hover, active, disabled, loading states

#### Forms
- **Input Fields**: Text inputs with labels and validation
- **Select Dropdowns**: Category selectors, filters
- **Date Pickers**: Date selection with calendar
- **Checkboxes**: Multi-select options
- **Radio Buttons**: Single-select options
- **Sliders**: Amount range filters

#### Modals & Dialogs
- **Confirmation Dialogs**: Delete confirmations, important actions
- **Form Modals**: Add/edit expense in modal
- **Info Modals**: Help text, feature explanations
- **Alert Modals**: Error messages, warnings

#### Notifications
- **Toast Notifications**: Success, error, info messages
- **Banner Alerts**: Persistent important messages
- **Inline Messages**: Form validation errors

### Animations & Transitions

#### Page Transitions
- **Route Changes**: Smooth fade or slide transitions
- **Loading States**: Skeleton screens or loading spinners

#### Component Animations
- **Expense List**: Staggered fade-in for list items
- **Charts**: Animated chart rendering
- **Modals**: Slide-up or fade-in animations
- **Buttons**: Subtle hover and click animations

#### Micro-interactions
- **Hover Effects**: Subtle scale, shadow, or color changes
- **Click Feedback**: Ripple or press animations
- **Form Validation**: Real-time validation with smooth error appearance
- **Success States**: Checkmark animations, success messages

---

## Security & Privacy

### Data Privacy

#### Default Privacy
- **Private by Default**: All expenses are private unless explicitly shared
- **User Control**: Users have full control over what to share
- **Granular Sharing**: Share individual expenses, not entire account

#### Public Data
- **Opt-In Only**: Users must explicitly enable public profile or shareable links
- **Selective Sharing**: Users choose which expenses are public
- **Revocable**: Users can revoke sharing at any time

### Data Security

#### Authentication Security
- **Password Requirements**: Minimum 8 characters, complexity recommended
- **Password Hashing**: Firebase handles secure password hashing
- **Session Management**: Secure session tokens, automatic expiration
- **Email Verification**: Optional but recommended email verification

#### Data Encryption
- **In Transit**: HTTPS for all communications
- **At Rest**: Firebase encrypts data at rest
- **Client-Side**: Sensitive data not stored in localStorage (use secure storage)

#### Access Control
- **Security Rules**: Firestore security rules enforce access control
- **Owner Verification**: All write operations verify ownership
- **Public Read Protection**: Only explicitly shareable data is publicly readable

### Shareable Link Security

#### Link Generation
- **Unique IDs**: Non-sequential, hard-to-guess unique identifiers
- **Length**: Sufficient length to prevent brute-force guessing
- **Randomness**: Cryptographically random generation

#### Link Access
- **No Authentication Required**: Public links accessible without login
- **Read-Only**: Public access is read-only, no write operations
- **Expiration** (Future): Optional expiration dates for links
- **View Limits** (Future): Optional view count limits

### Data Protection

#### User Data Ownership
- **Full Control**: Users own their data
- **Export**: Users can export all their data
- **Deletion**: Users can delete their account and all data
- **Portability**: Data export in standard formats (JSON, CSV)

#### Backup & Recovery
- **Automatic Sync**: Real-time sync to cloud (Firebase)
- **Offline Cache**: Local cache for offline access
- **Export Functionality**: Manual export for additional backup
- **Import Functionality**: Restore from exported data

---

## Data Persistence & Sync

### Storage Architecture

#### Primary Storage: Firebase Firestore
- **Real-Time Database**: NoSQL document database
- **Offline Persistence**: Automatic offline caching
- **Real-Time Sync**: Automatic synchronization across devices
- **Conflict Resolution**: Last-write-wins or merge strategies

#### Secondary Storage: IndexedDB
- **Offline Cache**: Local cache for offline access
- **Performance**: Fast local queries when offline
- **Sync Queue**: Queue operations when offline, sync when online
- **Backup**: Additional local backup

### Sync Strategy

#### Online Sync
- **Real-Time Listeners**: Firestore listeners for real-time updates
- **Automatic Sync**: Changes sync automatically to all connected devices
- **Optimistic Updates**: Update UI immediately, sync in background

#### Offline Support
- **Offline Mode**: Full functionality when offline
- **Local Cache**: All data cached locally in IndexedDB
- **Operation Queue**: Write operations queued when offline
- **Sync on Connect**: Automatic sync when connection restored

#### Conflict Resolution
- **Last-Write-Wins**: Default strategy (most recent update wins)
- **Merge Strategy**: For specific fields (e.g., tags array)
- **Manual Resolution**: User intervention for critical conflicts (optional)

### Data Migration

#### Version Management
- **Schema Versioning**: Track data schema versions
- **Migration Scripts**: Automatic migration between versions
- **Backward Compatibility**: Support older data formats

#### Import/Export
- **Export Format**: JSON or CSV format
- **Import Format**: Support JSON and CSV import
- **Data Validation**: Validate imported data
- **Merge Strategy**: Merge or replace on import

---

## Performance & Scalability

### Performance Targets

#### Load Times
- **Initial Load**: < 2 seconds for first page load
- **Page Navigation**: < 500ms for client-side navigation
- **Data Fetching**: < 1 second for expense list load
- **Chart Rendering**: < 500ms for chart generation

#### Responsiveness
- **Input Response**: < 100ms for form input feedback
- **Button Clicks**: Immediate visual feedback
- **Search Results**: < 300ms for search results
- **Filter Application**: < 200ms for filter application

### Optimization Strategies

#### Data Loading
- **Pagination**: Load expenses in batches (50-100 per page)
- **Lazy Loading**: Load data as needed (e.g., load more on scroll)
- **Caching**: Cache frequently accessed data
- **Prefetching**: Prefetch likely-needed data

#### Rendering Optimization
- **Virtual Scrolling**: For long lists (1000+ items)
- **Component Lazy Loading**: Load components on demand
- **Chart Optimization**: Render charts efficiently, use canvas for large datasets
- **Image Optimization**: Compress and lazy-load images

#### Network Optimization
- **Request Batching**: Batch multiple requests when possible
- **Compression**: Compress data in transit
- **Caching Headers**: Proper cache headers for static assets
- **CDN**: Use CDN for static assets (GitHub Pages provides this)

### Scalability Considerations

#### Data Volume
- **Expense Limit**: No hard limit, but optimize for 10,000+ expenses per user
- **Category Limit**: No hard limit, optimize for 100+ categories
- **Group Limit**: No hard limit, optimize for 50+ groups per user

#### User Scale
- **Concurrent Users**: Firebase handles scaling automatically
- **Data Isolation**: Each user's data isolated by security rules
- **Query Optimization**: Indexed queries for fast retrieval

#### Cost Management
- **Free Tier**: Stay within Firebase free tier limits
- **Query Optimization**: Minimize Firestore reads/writes
- **Caching**: Reduce redundant database queries
- **Batch Operations**: Batch writes to reduce write operations

---

## Appendix

### Terminology

- **Expense**: A single expenditure record
- **Category**: Classification for expenses (e.g., Food, Transport)
- **Budget**: Spending limit for a category or overall
- **Group**: Collection of users sharing expenses
- **Shareable Link**: Public URL for viewing expenses/users/groups
- **Split**: Division of expense amount among multiple people
- **Friend**: User with accepted friend relationship
- **Public Profile**: User profile accessible via shareable link
- **Shareable Expense**: Expense accessible via public link

### Assumptions

1. **Single Currency**: Primary assumption is single currency per user (multi-currency is future enhancement)
2. **English First**: Primary language is English (internationalization is future enhancement)
3. **Personal Use**: Designed primarily for personal expense tracking
4. **Free Tier**: Designed to stay within Firebase free tier limits
5. **Modern Browsers**: Supports modern browsers with IndexedDB and ES6+ support

### Future Enhancements (Out of Scope)

- Multi-currency support
- Receipt OCR (automatic expense extraction)
- Recurring expense automation
- Expense templates
- Advanced analytics and machine learning insights
- Mobile native apps (iOS/Android)
- Email/SMS notifications
- Expense approval workflows
- Integration with banking APIs
- Tax reporting features
- Expense reimbursement tracking

---

## Development Phases

This section outlines the phased approach to building the Expense Tracker application. Each phase builds upon the previous one, allowing for incremental development and testing.

### Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Project Setup & Core UI | ✅ Completed | Base configuration, layout, navigation, theme |
| 2 | Data Layer & Storage | ✅ Completed | Svelte stores, localStorage persistence, mock data |
| 3 | Expense Management | ✅ Completed | CRUD operations for expenses |
| 4 | Category Management | ✅ Completed | Category CRUD, icons, colors |
| 5 | Dashboard & Visualizations | ✅ Completed | Charts, metrics, quick stats |
| 6 | Budget Management | ✅ Completed | Budget tracking, alerts, progress |
| 7 | Reports & Analytics | ✅ Completed | Advanced reports, exports, trends |
| 8 | Search & Filtering | ✅ Completed | Full-text search, advanced filters |
| 9 | Firebase Integration | ✅ Completed | Auth, Firestore, real-time sync, route guards |
| 10 | Sharing & Collaboration | 🔲 Not Started | Shareable links, friends, groups |
| 11 | Polish & Optimization | 🔲 Not Started | Performance, accessibility, PWA |

---

### Phase 1: Project Setup & Core UI ✅
**Goal**: Transform the existing statue-ssg site into the Expense Manager app shell

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Update site.config.js for Expense Manager branding | ✅ | Name, description, nav items |
| 1.2 | Create app color theme/CSS variables | ✅ | Expense-focused colors (green/red) |
| 1.3 | Update main layout with app navigation | ✅ | Dashboard, Expenses, Add, Categories, Reports, Settings |
| 1.4 | Create placeholder pages for all routes | ✅ | Basic page structure |
| 1.5 | Add bottom navigation for mobile | ✅ | Responsive mobile nav |
| 1.6 | Create base UI components | ✅ | Cards, buttons, inputs, modals |
| 1.7 | Set up icon system | ✅ | Category icons, action icons |
| 1.8 | Add loading states and empty states | ✅ | Skeleton loaders, empty illustrations |

#### Deliverables
- [x] Branded Expense Manager app shell
- [x] All main routes accessible
- [x] Responsive navigation (top nav + mobile bottom nav)
- [x] Base component library

---

### Phase 2: Data Layer & Storage ✅
**Goal**: Implement local data management with Svelte stores and localStorage

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Define TypeScript interfaces for all data models | ✅ | Expense, Category, Budget, User, Group |
| 2.2 | Create Svelte stores for each data type | ✅ | Reactive stores with persistence |
| 2.3 | Implement localStorage persistence layer | ✅ | Auto-save, load on init |
| 2.4 | Add seed data / demo data | ✅ | Sample expenses, categories for testing |
| 2.5 | Create data utility functions | ✅ | Calculations, aggregations, formatting |
| 2.6 | Implement user preferences store | ✅ | Currency, date format, theme |
| 2.7 | Add data export functionality | ✅ | Export to JSON/CSV |
| 2.8 | Add data import functionality | ✅ | Import from JSON/CSV |

#### Deliverables
- [x] Complete data layer with TypeScript types
- [x] Persistent storage that survives page refresh
- [x] Demo data for development/testing
- [x] Import/Export functionality

---

### Phase 3: Expense Management ✅
**Goal**: Full CRUD functionality for expenses

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Create Add Expense form | ✅ | Amount, description, category, date, optional fields |
| 3.2 | Implement form validation | ✅ | Required fields, amount validation |
| 3.3 | Create Expense List view | ✅ | Table/card view with sorting |
| 3.4 | Create Expense Detail view | ✅ | Full expense details with view/edit modes |
| 3.5 | Implement Edit Expense functionality | ✅ | Edit form with pre-populated data |
| 3.6 | Implement Delete Expense with confirmation | ✅ | Confirm dialog with modal |
| 3.7 | Add bulk selection and actions | ✅ | Multi-select, bulk delete, bulk category change |
| 3.8 | Create quick-add expense widget | ✅ | Modal form for fast entry from dashboard |
| 3.9 | Add receipt upload placeholder | ✅ | UI ready for Firebase Storage later |

#### Deliverables
- [x] Complete expense CRUD operations
- [x] Expense list with sorting and filtering
- [x] Form validation and error handling
- [x] Bulk operations (delete, category change)

---

### Phase 4: Category Management ✅
**Goal**: User-customizable expense categories

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Create default system categories | ✅ | 12 categories in seed-data.ts |
| 4.2 | Create Category List page | ✅ | Grid view with stats |
| 4.3 | Implement Add Category form | ✅ | Name, icon, color, budget |
| 4.4 | Create icon picker component | ✅ | EmojiPicker with categorized emojis |
| 4.5 | Create color picker component | ✅ | ColorPicker with presets + custom |
| 4.6 | Implement Edit Category functionality | ✅ | Update all category properties |
| 4.7 | Implement Delete Category with reassignment | ✅ | Reassign or delete expenses options |
| 4.8 | Add category hierarchy (subcategories) | ⏸️ | Deferred - not critical for MVP |
| 4.9 | Show expense count per category | ✅ | Total and monthly expense counts |

#### Deliverables
- [x] Category CRUD operations
- [x] Visual category customization (icons, colors)
- [x] Category-expense relationship management

---

### Phase 5: Dashboard & Visualizations ✅
**Goal**: Rich visual dashboard with charts and metrics

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Create chart components | ✅ | SVG-based DonutChart, BarChart, SparkLine |
| 5.2 | Create metric cards component | ✅ | StatCard with today, period, average, budget |
| 5.3 | Build pie/donut chart for category breakdown | ✅ | Interactive with legend |
| 5.4 | Build bar chart for spending over time | ✅ | Last 7 days daily spending |
| 5.5 | Build sparkline for spending trends | ✅ | 14-day trend mini chart |
| 5.6 | Create recent expenses widget | ✅ | Last 5 expenses |
| 5.7 | Create top spending categories widget | ✅ | Top 5 categories with progress bars |
| 5.8 | Add quick stats (average, biggest, etc.) | ✅ | Biggest expense, top category, daily avg |
| 5.9 | Create budget progress indicators | ✅ | Category budget bars with status colors |
| 5.10 | Add date range selector for dashboard | ✅ | Week/Month/Year period selector |

#### Deliverables
- [x] Interactive dashboard with multiple charts
- [x] Key metrics at a glance
- [x] Period-based filtering
- [x] Budget progress visualization

---

### Phase 6: Budget Management ✅
**Goal**: Set and track spending budgets

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Create Budget List page | ✅ | All budgets overview with real store data |
| 6.2 | Implement Add Budget form | ✅ | Modal with category, amount, period |
| 6.3 | Create budget progress component | ✅ | Visual progress bars with status colors |
| 6.4 | Implement spent vs budget calculation | ✅ | Real-time from expenses store |
| 6.5 | Add budget alerts (80%, 100%, over) | ✅ | Visual alerts section at top |
| 6.6 | Create overall budget (all categories) | ✅ | Total spending limit with edit/delete |
| 6.7 | Implement Edit/Delete budget | ✅ | Full CRUD with confirmation modals |
| 6.8 | Add budget history/comparison | ⏸️ | Deferred - nice-to-have |
| 6.9 | Create budget notifications | ⏸️ | Deferred - requires notification system |

#### Deliverables
- [x] Budget CRUD operations
- [x] Real-time budget tracking
- [x] Visual progress indicators
- [x] Budget alerts and notifications

---

### Phase 7: Reports & Analytics ✅
**Goal**: Detailed expense analysis and reporting

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Create Reports page layout | ✅ | Period selector, charts, tables |
| 7.2 | Implement period comparison | ✅ | Current vs previous with % change |
| 7.3 | Create category deep-dive report | ✅ | Full table with stats |
| 7.4 | Build spending heatmap (calendar view) | ✅ | Daily spending with intensity colors |
| 7.5 | Add day-of-week analysis | ✅ | Horizontal bar chart by weekday |
| 7.6 | Create merchant/payee analysis | ✅ | Top merchants + payment methods |
| 7.7 | Implement monthly trend chart | ✅ | 6-month bar chart |
| 7.8 | Add report export (CSV) | ✅ | Period-based export |
| 7.9 | Create printable report view | ✅ | Print-friendly CSS styles |

#### Deliverables
- [x] Comprehensive reports page
- [x] Multiple visualization types
- [x] Period comparisons
- [x] Export/print functionality

---

### Phase 8: Search & Filtering ✅
**Goal**: Powerful search and filter capabilities

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Implement full-text search | ✅ | Searches description, merchant, notes, tags |
| 8.2 | Create filter panel component | ✅ | Collapsible advanced filter panel |
| 8.3 | Add date range filter | ✅ | Date pickers with min/max constraints |
| 8.4 | Add category filter | ✅ | Multi-select category chips |
| 8.5 | Add amount range filter | ✅ | Min/max amount inputs |
| 8.6 | Add payment method filter | ✅ | Cash, card, digital, bank, other |
| 8.7 | Add active filter indicators | ✅ | Filter tags bar with clear buttons |
| 8.8 | Implement saved filters | ⏸️ | Deferred - nice-to-have |
| 8.9 | Add quick filter buttons | ✅ | Today, This Week, This Month, This Year |
| 8.10 | Add results summary | ✅ | Count and total for filtered results |

#### Deliverables
- [x] Fast, accurate search
- [x] Comprehensive filter options
- [x] Quick filter shortcuts
- [x] Active filter visibility

---

### Phase 9: Firebase Integration
**Goal**: Cloud storage, authentication, and real-time sync

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Create Firebase project | ✅ | Firebase console setup - spendwise-5fb27 |
| 9.2 | Install Firebase SDK | 🔄 | `npm install firebase` required |
| 9.3 | Configure Firebase in app | ✅ | `src/lib/firebase/config.ts` with App Check |
| 9.4 | Implement Email/Password auth | ✅ | `src/lib/firebase/auth.ts` - register, login, logout |
| 9.5 | Create auth UI (login/register pages) | ✅ | `/login`, `/register`, `/forgot-password` pages |
| 9.6 | Migrate stores to Firestore | ✅ | Stores sync with Firestore when authenticated |
| 9.7 | Implement Firestore security rules | ✅ | `firestore.rules` with user isolation |
| 9.8 | Add real-time listeners | ✅ | `subscribeToExpenses`, `subscribeToCategories`, `subscribeToBudgets` |
| 9.9 | Implement offline persistence | ✅ | Firestore offline mode + localStorage fallback |
| 9.10 | Add user profile management | ✅ | `setUserProfile`, `getUserProfile` functions |
| 9.11 | Implement password reset | ✅ | `resetPassword` function and forgot-password page |
| 9.12 | Add loading states for async operations | ✅ | Loading states in auth store and pages |

#### Deliverables
- [x] User authentication (register/login/logout)
- [x] Firebase configuration and services
- [x] Auth UI pages
- [x] Firestore service layer
- [x] Security rules
- [x] Store integration with Firestore
- [x] Route guards
- [x] Google sign-in support

---

### Phase 10: Sharing & Collaboration
**Goal**: Share expenses with friends and groups

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | Implement shareable expense links | 🔲 | Generate/revoke public links |
| 10.2 | Create public expense view page | 🔲 | Read-only public view |
| 10.3 | Implement friend system | 🔲 | Add/remove friends |
| 10.4 | Create friend request flow | 🔲 | Send/accept/decline |
| 10.5 | Implement share with friends | 🔲 | Share expenses with specific users |
| 10.6 | Create Groups feature | 🔲 | Create/manage groups |
| 10.7 | Implement group expenses | 🔲 | Add expenses to groups |
| 10.8 | Build expense splitting | 🔲 | Equal/custom/percentage splits |
| 10.9 | Create settle up calculator | 🔲 | Who owes whom |
| 10.10 | Add public profile feature | 🔲 | Optional public user profile |
| 10.11 | Create group shareable links | 🔲 | Public group view |

#### Deliverables
- [ ] Shareable expense links
- [ ] Friend system
- [ ] Group expense management
- [ ] Expense splitting and settlement

---

### Phase 11: Polish & Optimization
**Goal**: Production-ready application

#### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 11.1 | Performance audit and optimization | 🔲 | Lighthouse, bundle size |
| 11.2 | Accessibility audit (WCAG AA) | 🔲 | Screen reader, keyboard nav |
| 11.3 | Add keyboard shortcuts | 🔲 | Power user features |
| 11.4 | Implement PWA features | 🔲 | Install prompt, icons |
| 11.5 | Add service worker for offline | 🔲 | Cache static assets |
| 11.6 | Create onboarding flow | 🔲 | First-time user experience |
| 11.7 | Add help/documentation | 🔲 | In-app help |
| 11.8 | Implement error boundaries | 🔲 | Graceful error handling |
| 11.9 | Add analytics (privacy-respecting) | 🔲 | Usage tracking |
| 11.10 | Final testing and bug fixes | 🔲 | QA pass |
| 11.11 | Production deployment | 🔲 | GitHub Pages deployment |

#### Deliverables
- [ ] Optimized, accessible application
- [ ] PWA capabilities
- [ ] Polished user experience
- [ ] Production deployment

---

### Status Legend

| Symbol | Meaning |
|--------|---------|
| 🔲 | Not Started |
| 🔄 | In Progress |
| ✅ | Completed |
| ⏸️ | On Hold |
| ❌ | Cancelled |

---

**Document Version**: 1.10  
**Last Updated**: 2026-01-12  
**Status**: Development Phase - Phase 9 Completed, Phase 10 Ready
