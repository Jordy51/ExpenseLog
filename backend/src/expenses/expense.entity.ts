import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CategoryEntity } from '../categories/category.entity';

@Entity('expenses')
export class ExpenseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column()
    categoryId: number;

    @ManyToOne(() => CategoryEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'categoryId' })
    category: CategoryEntity;

    @Column({ type: 'timestamp' })
    date: Date;

    @CreateDateColumn()
    createdAt: Date;
}
