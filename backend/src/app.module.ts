import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ExpensesModule } from './expenses/expenses.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
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
