import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ExpensesModule } from './expenses/expenses.module';
import { CategoriesModule } from './categories/categories.module';
import { CategoryEntity } from './categories/category.entity';
import { ExpenseEntity } from './expenses/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'expense_tracker',
      entities: [CategoryEntity, ExpenseEntity],
      synchronize: true, // Set to false in production
    }),
    ServeStaticModule.forRoot({
      // When running with ts-node: __dirname = backend/src
      // When running compiled: __dirname = backend/dist
      rootPath: (() => {
        const path = join(__dirname, '..', '..', 'frontend');
        console.log('Serving static files from:', path);
        return path;
      })(),
    }),
    ExpensesModule,
    CategoriesModule,
  ],
})
export class AppModule { }
