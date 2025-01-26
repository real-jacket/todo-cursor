import { Todo } from './Todo';
import { storage } from '@/utils/storage';
import type { FilterType, TodoItem, TodoListState } from '@/types/todo';
import type { SortKey } from '@/types/sort';

const STORAGE_KEY = 'todos';

export class TodoList {
  private todos: Todo[];
  private currentSortKey: SortKey = 'createdAt';
  private isManualOrder: boolean = false;
  private manualOrder: number[] = [];

  constructor() {
    const state = this.load();
    this.todos = (state.todos ?? []).map(Todo.fromJSON);
    this.currentSortKey = state.currentSortKey ?? 'createdAt';
    this.isManualOrder = state.isManualOrder ?? false;
    this.manualOrder = state.manualOrder ?? [];

    if (this.isManualOrder && this.manualOrder.length > 0) {
      this.restoreManualOrder();
    } else if (!this.isManualOrder) {
      this.sort(this.currentSortKey);
    }
  }

  private load(): TodoListState {
    const defaultState: TodoListState = {
      todos: [],
      currentSortKey: 'createdAt',
      isManualOrder: false,
      manualOrder: [],
    };

    const savedState = storage.get<TodoListState>(STORAGE_KEY, defaultState);

    // 确保返回的状态包含所有必要的字段
    return {
      todos: savedState.todos ?? defaultState.todos,
      currentSortKey: savedState.currentSortKey ?? defaultState.currentSortKey,
      isManualOrder: savedState.isManualOrder ?? defaultState.isManualOrder,
      manualOrder: savedState.manualOrder ?? defaultState.manualOrder,
    };
  }

  private save(): void {
    const state: TodoListState = {
      todos: this.todos.map((todo) => todo.toJSON()),
      currentSortKey: this.currentSortKey,
      isManualOrder: this.isManualOrder,
      manualOrder: this.isManualOrder ? this.todos.map((todo) => todo.id) : [],
    };
    storage.set(STORAGE_KEY, state);
  }

  add(text: string): Todo {
    const todo = new Todo(text);

    if (this.isManualOrder) {
      // 在手动排序模式下，新项目添加到顶部
      this.todos.unshift(todo);
    } else {
      // 非手动排序模式，添加到末尾并按当前方式排序
      this.todos.push(todo);
      this.sort(this.currentSortKey);
    }

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
    if (key === this.currentSortKey) {
      return this.todos;
    }

    this.currentSortKey = key;
    this.isManualOrder = key === 'manual';

    if (key === 'manual') {
      if (this.manualOrder.length > 0) {
        this.restoreManualOrder();
      }
      this.save();
      return this.todos;
    }

    // 执行排序
    this.todos.sort((a, b) => {
      switch (key) {
        case 'createdAt':
          return b.createdAt - a.createdAt;
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

    this.currentSortKey = 'manual';
    this.isManualOrder = true;
    this.manualOrder = newOrder;
    this.save();
  }

  update(id: number, data: Partial<Omit<TodoItem, 'id'>>): void {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      Object.assign(todo, data);
      this.save();
    }
  }

  getCurrentSort(): { key: SortKey; isManual: boolean; text: string } {
    const sortTexts: Record<SortKey, string> = {
      manual: '自定义排序',
      createdAt: '创建时间',
      text: '名称',
      completed: '完成状态',
    };

    return {
      key: this.currentSortKey,
      isManual: this.isManualOrder,
      text: sortTexts[this.currentSortKey],
    };
  }

  resetSort(): void {
    // 重置为默认排序（创建时间）
    this.isManualOrder = false;
    this.sort('createdAt');
  }

  canChangeSort(newKey: SortKey): boolean {
    // 检查是否可以切换到新的排序方式
    if (newKey === this.currentSortKey) return false;
    if (!this.isManualOrder) return true;
    return newKey === 'manual';
  }

  private restoreManualOrder(): void {
    const todoMap = new Map(this.todos.map((todo) => [todo.id, todo]));
    const orderedTodos = this.manualOrder
      .map((id) => todoMap.get(id))
      .filter((todo): todo is Todo => todo !== undefined);

    // 添加新增的待办项（不在手动排序列表中的）
    const newTodos = this.todos.filter(
      (todo) => !this.manualOrder.includes(todo.id)
    );

    this.todos = [...orderedTodos, ...newTodos];
  }
}
