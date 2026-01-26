import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from './category.entity';
import { CreateCategoryDto } from './category.interface';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
  ) { }

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  private async seedDefaultCategories(): Promise<void> {
    const count = await this.categoryRepository.count();
    if (count === 0) {
      const defaultCategories = [
        { name: 'Food & Dining', color: '#FF6384', icon: '🍔' },
        { name: 'Transportation', color: '#36A2EB', icon: '🚗' },
        { name: 'Shopping', color: '#FFCE56', icon: '🛒' },
        { name: 'Entertainment', color: '#4BC0C0', icon: '🎬' },
        { name: 'Bills & Utilities', color: '#9966FF', icon: '💡' },
        { name: 'Healthcare', color: '#FF9F40', icon: '🏥' },
        { name: 'Other', color: '#C9CBCF', icon: '📦' },
      ];

      for (const cat of defaultCategories) {
        await this.categoryRepository.save(cat);
      }
    }
  }

  async findAll(): Promise<CategoryEntity[]> {
    return this.categoryRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: string): Promise<CategoryEntity | null> {
    return this.categoryRepository.findOne({ where: { id: parseInt(id) } });
  }

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const category = this.categoryRepository.create({
      name: dto.name,
      color: dto.color || this.generateColor(),
      icon: dto.icon || '📁',
    });
    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: Partial<CreateCategoryDto>): Promise<CategoryEntity | null> {
    const category = await this.categoryRepository.findOne({ where: { id: parseInt(id) } });
    if (!category) return null;

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.categoryRepository.delete(parseInt(id));
    return (result.affected ?? 0) > 0;
  }

  private generateColor(): string {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
