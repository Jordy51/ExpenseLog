import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CategoryEntity } from '../categories/category.entity';

export type TransactionType = 'expense' | 'lent' | 'borrowed';

@Entity('expenses')
export class ExpenseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string | null;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column()
    categoryId: number;

    @ManyToOne(() => CategoryEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'categoryId' })
    category: CategoryEntity;

    @Column({ type: 'timestamp' })
    date: Date;

    @Column({ type: 'varchar', length: 20, default: 'expense' })
    type: TransactionType;

    @Column({ type: 'varchar', length: 100, nullable: true })
    personName: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
