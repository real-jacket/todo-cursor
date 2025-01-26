import type { SortKey } from './sort';

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
  order?: number; // 用于排序
}

export type FilterType = 'all' | 'active' | 'completed';

export interface TodoContextMenu {
  x: number;
  y: number;
  todoId: number;
}

export interface TodoListState {
  todos: TodoItem[];
  currentSortKey: SortKey;
  isManualOrder: boolean;
  manualOrder: number[];
}
