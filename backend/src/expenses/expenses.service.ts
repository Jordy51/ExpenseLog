import { Injectable } from '@nestjs/common';
import { Expense, CreateExpenseDto, ExpensePattern, MonthlyTrend } from './expense.interface';
import { CategoriesService } from '../categories/categories.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExpensesService {
  private expenses: Expense[] = [];
  private dataPath = path.join(__dirname, '..', '..', 'data', 'expenses.json');

  constructor(private readonly categoriesService: CategoriesService) {
    this.loadData();
  }

  private loadData(): void {
    try {
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        this.expenses = JSON.parse(data);
      }
    } catch (error) {
      this.expenses = [];
    }
  }

  private saveData(): void {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.expenses, null, 2));
  }

  findAll(): Expense[] {
    return this.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  findOne(id: string): Expense | undefined {
    return this.expenses.find(e => e.id === id);
  }

  create(dto: CreateExpenseDto): Expense {
    const expense: Expense = {
      id: Date.now().toString(),
      description: dto.description,
      amount: dto.amount,
      categoryId: dto.categoryId,
      date: dto.date ? new Date(dto.date) : new Date(),
      createdAt: new Date(),
    };
    this.expenses.push(expense);
    this.saveData();
    return expense;
  }

  update(id: string, dto: Partial<CreateExpenseDto>): Expense | null {
    const index = this.expenses.findIndex(e => e.id === id);
    if (index === -1) return null;

    this.expenses[index] = {
      ...this.expenses[index],
      ...dto,
      date: dto.date ? new Date(dto.date) : this.expenses[index].date
    };
    this.saveData();
    return this.expenses[index];
  }

  delete(id: string): boolean {
    const index = this.expenses.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.expenses.splice(index, 1);
    this.saveData();
    return true;
  }

  getPatterns(): ExpensePattern[] {
    const categories = this.categoriesService.findAll();
    const totalExpenses = this.expenses.reduce((sum, e) => sum + e.amount, 0);

    const patterns: ExpensePattern[] = categories.map(category => {
      const categoryExpenses = this.expenses.filter(e => e.categoryId === category.id);
      const totalAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const count = categoryExpenses.length;

      return {
        categoryId: category.id,
        categoryName: category.name,
        totalAmount,
        count,
        averageAmount: count > 0 ? totalAmount / count : 0,
        percentage: totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0,
      };
    });

    return patterns.filter(p => p.count > 0).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  getMonthlyTrends(months: number = 6): MonthlyTrend[] {
    const trends: MonthlyTrend[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthExpenses = this.expenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate.getFullYear() === year && expDate.getMonth() === month;
      });

      const byCategory: { [key: string]: number } = {};
      monthExpenses.forEach(e => {
        byCategory[e.categoryId] = (byCategory[e.categoryId] || 0) + e.amount;
      });

      trends.push({
        month: monthStr,
        total: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
        byCategory,
      });
    }

    return trends;
  }

  getSummary() {
    const now = new Date();
    const thisMonth = this.expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const lastMonth = this.expenses.filter(e => {
      const d = new Date(e.date);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });

    const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonth.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalExpenses: this.expenses.reduce((sum, e) => sum + e.amount, 0),
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      monthlyChange: lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0,
      totalTransactions: this.expenses.length,
    };
  }
}
