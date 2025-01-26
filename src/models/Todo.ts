import type { TodoItem } from '@/types/todo';

export class Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;

  constructor(text: string) {
    this.id = Date.now();
    this.text = text;
    this.completed = false;
    this.createdAt = Date.now();
  }

  toggle(): void {
    this.completed = !this.completed;
  }

  toJSON(): TodoItem {
    return {
      id: this.id,
      text: this.text,
      completed: this.completed,
      createdAt: this.createdAt,
    };
  }

  static fromJSON(data: TodoItem): Todo {
    const todo = new Todo(data.text);
    todo.id = data.id;
    todo.completed = data.completed;
    todo.createdAt = data.createdAt;
    return todo;
  }
}
