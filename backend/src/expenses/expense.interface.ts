import { TransactionType } from './expense.entity';

export interface Expense {
  id: string;
  description?: string;
  amount: number;
  categoryId: string;
  date: Date;
  type: TransactionType;
  personName?: string;
  createdAt: Date;
}

export interface CreateExpenseDto {
  description?: string;
  amount: number;
  categoryId: string;
  date?: string;
  type?: TransactionType;
  personName?: string;
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

export interface LendingBorrowingSummary {
  totalLent: number;
  totalBorrowed: number;
  netBalance: number;
  lentByPerson: { [personName: string]: number };
  borrowedByPerson: { [personName: string]: number };
}
