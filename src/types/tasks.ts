
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date | string;
  priority: TaskPriority;
  status: TaskStatus;
  tags?: string[];
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  relatedSubject?: string;
  estimatedTime?: number; // in minutes
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: Date | string;
  priority: TaskPriority;
  status: TaskStatus;
  tags?: string[];
  relatedSubject?: string;
  estimatedTime?: number;
}
