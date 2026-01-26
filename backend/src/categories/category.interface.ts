export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
}

export interface CreateCategoryDto {
  name: string;
  color?: string;
  icon?: string;
}
