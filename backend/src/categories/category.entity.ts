import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('categories')
export class CategoryEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ default: '#C9CBCF' })
    color: string;

    @Column({ default: '📁' })
    icon: string;

    @CreateDateColumn()
    createdAt: Date;
}
