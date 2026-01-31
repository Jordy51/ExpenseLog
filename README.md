# Expense Tracker

A full-stack expense tracking application with a NestJS (TypeScript) backend, PostgreSQL database, and a Progressive Web App (PWA) frontend that works offline.

## Features

- ✅ **Track Expenses** - Add, edit, and delete expenses
- ✅ **Categories** - Organize expenses with customizable categories
- ✅ **Add New Categories** - Create custom categories with icons and colors
- ✅ **Graphs & Charts** - Visualize spending with:
  - Doughnut chart showing spending by category
  - Bar chart showing monthly trends
- ✅ **Patterns Analysis** - See spending patterns with percentages and averages
- ✅ **Summary Dashboard** - View this month's total, overall spending, and transaction count
- ✅ **Date Picker** - Select expense dates with Flatpickr
- ✅ **Progressive Web App (PWA)** - Install on desktop or mobile
- ✅ **Offline Support** - Full offline functionality with local IndexedDB storage
- ✅ **Background Sync** - Automatically syncs data when back online

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)

## Installation

1. **Set up PostgreSQL:**
   - Create a new PostgreSQL database for the application
   - Create a `.env` file in the `backend/` directory with your database credentials:
     ```env
     DB_HOST=localhost
     DB_PORT=5432
     DB_USERNAME=your_username
     DB_PASSWORD=your_password
     DB_NAME=expense_tracker
     ```

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Migrate existing data (optional):**
   If you have existing JSON data in `backend/data/`, run the migration script:
   ```bash
   npm run migrate
   ```

4. **Start the server:**
   ```bash
   npm run start:dev
   ```
   
   Or on Windows, simply double-click `start-server.bat` in the root folder.

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ExpenseLog/
├── start-server.bat             # Quick start script (Windows)
├── backend/
│   ├── src/
│   │   ├── main.ts              # Application entry point
│   │   ├── app.module.ts        # Root module with TypeORM config
│   │   ├── migrate-data.ts      # JSON to PostgreSQL migration script
│   │   ├── categories/          # Categories module
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   ├── category.entity.ts
│   │   │   └── category.interface.ts
│   │   └── expenses/            # Expenses module
│   │       ├── expenses.module.ts
│   │       ├── expenses.controller.ts
│   │       ├── expenses.service.ts
│   │       ├── expense.entity.ts
│   │       └── expense.interface.ts
│   ├── data/                    # Legacy JSON data (for migration)
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── index.html               # Main HTML page
    ├── styles.css               # Styles
    ├── app.js                   # Frontend JavaScript
    ├── offline-db.js            # IndexedDB for offline storage
    ├── sync.js                  # Background sync functionality
    ├── sw.js                    # Service Worker for PWA/offline
    ├── manifest.json            # PWA manifest
    ├── icons/                   # App icons
    └── lib/                     # Third-party libraries
        ├── chart.min.js
        ├── flatpickr.min.js
        └── flatpickr.min.css
```

## API Endpoints

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get a category by ID
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get an expense by ID
- `POST /api/expenses` - Create a new expense
- `PUT /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense
- `GET /api/expenses/summary` - Get expense summary
- `GET /api/expenses/patterns` - Get spending patterns
- `GET /api/expenses/trends` - Get monthly trends

## Database Schema

### Categories Table
| Column    | Type         | Description                    |
|-----------|--------------|--------------------------------|
| id        | SERIAL       | Primary key                    |
| name      | VARCHAR      | Category name                  |
| color     | VARCHAR      | Hex color code (default: #C9CBCF) |
| icon      | VARCHAR      | Emoji icon (default: 📁)       |
| createdAt | TIMESTAMP    | Record creation timestamp      |

### Expenses Table
| Column      | Type         | Description                    |
|-------------|--------------|--------------------------------|
| id          | SERIAL       | Primary key                    |
| description | VARCHAR      | Expense description (nullable) |
| amount      | DECIMAL(10,2)| Expense amount                 |
| categoryId  | INTEGER      | Foreign key to categories      |
| date        | TIMESTAMP    | Expense date                   |
| createdAt   | TIMESTAMP    | Record creation timestamp      |

## Tech Stack

- **Backend:** NestJS, TypeScript, TypeORM
- **Database:** PostgreSQL
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **PWA:** Service Worker, IndexedDB, Web App Manifest
- **Charts:** Chart.js
- **Date Picker:** Flatpickr
