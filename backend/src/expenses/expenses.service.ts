import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ExpenseEntity } from './expense.entity';
import { CreateExpenseDto, ExpensePattern, MonthlyTrend } from './expense.interface';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private expenseRepository: Repository<ExpenseEntity>,
    private readonly categoriesService: CategoriesService,
  ) { }

  async findAll(sortBy?: string, sortOrder?: string): Promise<ExpenseEntity[]> {
    const order: any = {};
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    switch (sortBy) {
      case 'amount':
        order.amount = orderDirection;
        break;
      case 'category':
        order.categoryId = orderDirection;
        break;
      case 'date':
      default:
        order.date = orderDirection;
        break;
    }

    return this.expenseRepository.find({ order });
  }

  async findOne(id: string): Promise<ExpenseEntity | null> {
    return this.expenseRepository.findOne({ where: { id: parseInt(id) } });
  }

  async create(dto: CreateExpenseDto): Promise<ExpenseEntity> {
    const categoryId = parseInt(dto.categoryId);
    if (isNaN(categoryId)) {
      throw new BadRequestException('Invalid categoryId: must be a valid number');
    }
    const expense = this.expenseRepository.create({
      description: dto.description,
      amount: dto.amount,
      categoryId,
      date: dto.date ? new Date(dto.date) : new Date(),
    });
    return this.expenseRepository.save(expense);
  }

  async update(id: string, dto: Partial<CreateExpenseDto>): Promise<ExpenseEntity | null> {
    const expense = await this.expenseRepository.findOne({ where: { id: parseInt(id) } });
    if (!expense) return null;

    if (dto.description !== undefined) expense.description = dto.description;
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.categoryId !== undefined) {
      const categoryId = parseInt(dto.categoryId);
      if (isNaN(categoryId)) {
        throw new BadRequestException('Invalid categoryId: must be a valid number');
      }
      expense.categoryId = categoryId;
    }
    if (dto.date !== undefined) expense.date = new Date(dto.date);

    return this.expenseRepository.save(expense);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.expenseRepository.delete(parseInt(id));
    return (result.affected ?? 0) > 0;
  }

  async getPatterns(): Promise<ExpensePattern[]> {
    const categories = await this.categoriesService.findAll();
    const expenses = await this.expenseRepository.find();
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const patterns: ExpensePattern[] = categories.map(category => {
      const categoryExpenses = expenses.filter(e => e.categoryId === category.id);
      const totalAmount = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const count = categoryExpenses.length;

      return {
        categoryId: category.id.toString(),
        categoryName: category.name,
        totalAmount,
        count,
        averageAmount: count > 0 ? totalAmount / count : 0,
        percentage: totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0,
      };
    });

    return patterns.filter(p => p.count > 0).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
    const expenses = await this.expenseRepository.find();
    const trends: MonthlyTrend[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthExpenses = expenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate.getFullYear() === year && expDate.getMonth() === month;
      });

      const byCategory: { [key: string]: number } = {};
      monthExpenses.forEach(e => {
        byCategory[e.categoryId.toString()] = (byCategory[e.categoryId.toString()] || 0) + Number(e.amount);
      });

      trends.push({
        month: monthStr,
        total: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
        byCategory,
      });
    }

    return trends;
  }

  async getSummary() {
    const expenses = await this.expenseRepository.find();
    const now = new Date();

    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const lastMonth = expenses.filter(e => {
      const d = new Date(e.date);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });

    const thisMonthTotal = thisMonth.reduce((sum, e) => sum + Number(e.amount), 0);
    const lastMonthTotal = lastMonth.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      monthlyChange: lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0,
      totalTransactions: expenses.length,
    };
  }
}
