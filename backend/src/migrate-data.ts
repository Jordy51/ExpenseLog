import { DataSource } from 'typeorm';
import { CategoryEntity } from './categories/category.entity';
import { ExpenseEntity } from './expenses/expense.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface JsonCategory {
    id: string;
    name: string;
    color: string;
    icon: string;
    createdAt: string;
}

interface JsonExpense {
    id: string;
    description: string;
    amount: number;
    categoryId: string;
    date: string;
    createdAt: string;
}

async function migrate() {
    console.log('Starting data migration from JSON to PostgreSQL...\n');

    // Create data source
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'expense_tracker',
        entities: [CategoryEntity, ExpenseEntity],
        synchronize: true,
    });

    try {
        // Initialize connection
        await dataSource.initialize();
        console.log('✓ Connected to PostgreSQL database\n');

        // Read JSON files
        const categoriesPath = path.join(__dirname, '..', 'data', 'categories.json');
        const expensesPath = path.join(__dirname, '..', 'data', 'expenses.json');

        const categoriesJson: JsonCategory[] = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
        const expensesJson: JsonExpense[] = JSON.parse(fs.readFileSync(expensesPath, 'utf-8'));

        console.log(`Found ${categoriesJson.length} categories and ${expensesJson.length} expenses to migrate\n`);

        // Get repositories
        const categoryRepo = dataSource.getRepository(CategoryEntity);
        const expenseRepo = dataSource.getRepository(ExpenseEntity);

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('Clearing existing data...');
        await expenseRepo.createQueryBuilder().delete().from(ExpenseEntity).execute();
        await categoryRepo.createQueryBuilder().delete().from(CategoryEntity).execute();
        console.log('✓ Existing data cleared\n');

        // Map old string IDs to new numeric IDs
        const categoryIdMap = new Map<string, number>();

        // Migrate categories
        console.log('Migrating categories...');
        for (const cat of categoriesJson) {
            const newCategory = categoryRepo.create({
                name: cat.name,
                color: cat.color,
                icon: cat.icon,
                createdAt: new Date(cat.createdAt),
            });
            const saved = await categoryRepo.save(newCategory);
            categoryIdMap.set(cat.id, saved.id);
            console.log(`  ✓ Category "${cat.name}" (old ID: ${cat.id} → new ID: ${saved.id})`);
        }
        console.log(`\n✓ Migrated ${categoriesJson.length} categories\n`);

        // Migrate expenses
        console.log('Migrating expenses...');
        let migratedCount = 0;
        let skippedCount = 0;

        for (const exp of expensesJson) {
            const newCategoryId = categoryIdMap.get(exp.categoryId);

            if (!newCategoryId) {
                console.log(`  ⚠ Skipping expense "${exp.description}" - category ID ${exp.categoryId} not found`);
                skippedCount++;
                continue;
            }

            const newExpense = expenseRepo.create({
                description: exp.description,
                amount: exp.amount,
                categoryId: newCategoryId,
                date: new Date(exp.date),
                createdAt: new Date(exp.createdAt),
            });
            await expenseRepo.save(newExpense);
            migratedCount++;
        }
        console.log(`\n✓ Migrated ${migratedCount} expenses`);
        if (skippedCount > 0) {
            console.log(`⚠ Skipped ${skippedCount} expenses due to missing categories`);
        }

        // Print summary
        console.log('\n========== Migration Summary ==========');
        console.log(`Categories migrated: ${categoriesJson.length}`);
        console.log(`Expenses migrated: ${migratedCount}`);
        console.log(`Expenses skipped: ${skippedCount}`);
        console.log('========================================\n');

        // Verify data
        const categoryCount = await categoryRepo.count();
        const expenseCount = await expenseRepo.count();
        console.log('Verification:');
        console.log(`  Categories in database: ${categoryCount}`);
        console.log(`  Expenses in database: ${expenseCount}`);

        console.log('\n✓ Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await dataSource.destroy();
    }
}

migrate();
