# Expense Tracker

A full-stack expense tracking application with a NestJS (TypeScript) backend and HTML/JavaScript frontend.

## Features

- ✅ **Track Expenses** - Add, edit, and delete expenses
- ✅ **Categories** - Organize expenses with customizable categories
- ✅ **Add New Categories** - Create custom categories with icons and colors
- ✅ **Graphs & Charts** - Visualize spending with:
  - Doughnut chart showing spending by category
  - Bar chart showing monthly trends
- ✅ **Patterns Analysis** - See spending patterns with percentages and averages
- ✅ **Summary Dashboard** - View this month's total, overall spending, and transaction count

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the server:**
   ```bash
   npm run start:dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ExpenseLog/
├── backend/
│   ├── src/
│   │   ├── main.ts              # Application entry point
│   │   ├── app.module.ts        # Root module
│   │   ├── categories/          # Categories module
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   └── category.interface.ts
│   │   └── expenses/            # Expenses module
│   │       ├── expenses.module.ts
│   │       ├── expenses.controller.ts
│   │       ├── expenses.service.ts
│   │       └── expense.interface.ts
│   ├── data/                    # JSON data storage (auto-created)
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── index.html               # Main HTML page
    ├── styles.css               # Styles
    └── app.js                   # Frontend JavaScript
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

## Data Storage

Data is stored in JSON files in the `backend/data/` directory:
- `categories.json` - Category definitions
- `expenses.json` - Expense records

## Tech Stack

- **Backend:** NestJS, TypeScript, Express
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Charts:** Chart.js
- **Storage:** JSON files (can be upgraded to a database)
