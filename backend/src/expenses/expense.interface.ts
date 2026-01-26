export interface Expense {
  id: string;
  description?: string;
  amount: number;
  categoryId: string;
  date: Date;
  createdAt: Date;
}

export interface CreateExpenseDto {
  description?: string;
  amount: number;
  categoryId: string;
  date?: string;
}

export interface ExpensePattern {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  count: number;
  averageAmount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  byCategory: { [categoryId: string]: number };
}
