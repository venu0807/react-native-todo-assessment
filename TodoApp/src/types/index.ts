export type Priority = 'low' | 'medium' | 'high';

export interface User {
  _id: string;
  email: string;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  dateTime: string;
  deadline: string;
  priority: Priority;
  completed: boolean;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface TaskFormData {
  title: string;
  description: string;
  dateTime: string;
  deadline: string;
  priority: Priority;
  category: string;
  tags: string[];
}
