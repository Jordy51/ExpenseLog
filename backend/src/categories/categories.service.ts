import { Injectable } from '@nestjs/common';
import { Category, CreateCategoryDto } from './category.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CategoriesService {
  private categories: Category[] = [];
  private dataPath = path.join(__dirname, '..', '..', 'data', 'categories.json');

  constructor() {
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
        this.categories = JSON.parse(data);
      } else {
        // Initialize with default categories
        this.categories = [
          { id: '1', name: 'Food & Dining', color: '#FF6384', icon: '🍔', createdAt: new Date() },
          { id: '2', name: 'Transportation', color: '#36A2EB', icon: '🚗', createdAt: new Date() },
          { id: '3', name: 'Shopping', color: '#FFCE56', icon: '🛒', createdAt: new Date() },
          { id: '4', name: 'Entertainment', color: '#4BC0C0', icon: '🎬', createdAt: new Date() },
          { id: '5', name: 'Bills & Utilities', color: '#9966FF', icon: '💡', createdAt: new Date() },
          { id: '6', name: 'Healthcare', color: '#FF9F40', icon: '🏥', createdAt: new Date() },
          { id: '7', name: 'Other', color: '#C9CBCF', icon: '📦', createdAt: new Date() },
        ];
        this.saveData();
      }
    } catch (error) {
      this.categories = [];
    }
  }

  private saveData(): void {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.categories, null, 2));
  }

  findAll(): Category[] {
    return this.categories;
  }

  findOne(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  create(dto: CreateCategoryDto): Category {
    const category: Category = {
      id: Date.now().toString(),
      name: dto.name,
      color: dto.color || this.generateColor(),
      icon: dto.icon || '📁',
      createdAt: new Date(),
    };
    this.categories.push(category);
    this.saveData();
    return category;
  }

  update(id: string, dto: Partial<CreateCategoryDto>): Category | null {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.categories[index] = { ...this.categories[index], ...dto };
    this.saveData();
    return this.categories[index];
  }

  delete(id: string): boolean {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.categories.splice(index, 1);
    this.saveData();
    return true;
  }

  private generateColor(): string {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
