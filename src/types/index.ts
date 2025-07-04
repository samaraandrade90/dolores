export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date: string; // YYYY-MM-DD format
  categoryId?: string;
  userId: string;
  frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  customFrequencyMonths?: number;
  value?: number;
  time?: string; // HH:MM format
  createdAt: string;
  updatedAt: string;
}

export interface TaskInstance extends Task {
  instanceDate: string;
  isRecurringInstance: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Form data types
export interface CreateTaskData extends Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {}
export interface CreateCategoryData extends Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {}