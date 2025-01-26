import { Todo } from './Todo';
import { storage } from '@/utils/storage';
import type { FilterType, TodoItem } from '@/types/todo';

const STORAGE_KEY = 'todos';

export type SortKey = 'createdAt' | 'text' | 'completed';

export class TodoList {
  private todos: Todo[];
  private currentSortKey: SortKey = 'createdAt';

  constructor() {
    this.todos = this.load();
    // 默认按创建时间排序
    this.sort('createdAt');
  }

  private load(): Todo[] {
    const data = storage.get<TodoItem[]>(STORAGE_KEY, []);
    return data.map(Todo.fromJSON);
  }

  private save(): void {
    storage.set(
      STORAGE_KEY,
      this.todos.map((todo) => todo.toJSON())
    );
  }

  add(text: string): Todo {
    const todo = new Todo(text);
    this.todos.push(todo);
    // 添加后按当前排序方式重新排序
    this.sort(this.currentSortKey);
    this.save();
    return todo;
  }

  toggle(id: number): Todo | undefined {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.toggle();
      this.save();
    }
    return todo;
  }

  delete(id: number): boolean {
    const index = this.todos.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.todos.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  clearCompleted(): void {
    this.todos = this.todos.filter((todo) => !todo.completed);
    this.save();
  }

  filter(type: FilterType): Todo[] {
    switch (type) {
      case 'active':
        return this.todos.filter((todo) => !todo.completed);
      case 'completed':
        return this.todos.filter((todo) => todo.completed);
      default:
        return this.todos;
    }
  }

  getStats(): { total: number; completed: number } {
    const total = this.todos.length;
    const completed = this.todos.filter((todo) => todo.completed).length;
    return { total, completed };
  }

  sort(key: SortKey): Todo[] {
    this.currentSortKey = key;

    this.todos.sort((a, b) => {
      switch (key) {
        case 'createdAt':
          return b.createdAt - a.createdAt; // 最新的在前面
        case 'text':
          return a.text.localeCompare(b.text);
        case 'completed':
          return Number(a.completed) - Number(b.completed);
        default:
          return 0;
      }
    });

    this.save();
    return this.todos;
  }

  getCounts(): { all: number; active: number; completed: number } {
    return {
      all: this.todos.length,
      active: this.todos.filter((todo) => !todo.completed).length,
      completed: this.todos.filter((todo) => todo.completed).length,
    };
  }

  reorder(newOrder: number[]): void {
    const todoMap = new Map(this.todos.map((todo) => [todo.id, todo]));

    this.todos = newOrder
      .map((id) => todoMap.get(id))
      .filter((todo): todo is Todo => todo !== undefined);

    this.save();
  }

  update(id: number, data: Partial<Omit<TodoItem, 'id'>>): void {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      Object.assign(todo, data);
      this.save();
    }
  }
}
