import { TodoList } from '@/models/TodoList';
import { ui } from '@/utils/ui';
import type { FilterType, TodoContextMenu } from '@/types/todo';
import type { SortKey } from '@/types/sort';

class TodoApp {
  private todoList: TodoList;
  private currentFilter: FilterType;
  private todoInput!: HTMLInputElement;
  private todoListEl!: HTMLUListElement;
  private addBtn!: HTMLButtonElement;
  private navItems!: NodeListOf<HTMLButtonElement>;
  private clearBtn!: HTMLButtonElement;
  private draggedItem: HTMLLIElement | null = null;
  private contextMenu: HTMLElement | null = null;

  constructor() {
    this.todoList = new TodoList();
    this.currentFilter = 'all';
    this.initElements();
    this.initEventListeners();
    this.render();
  }

  private initElements(): void {
    this.todoInput = document.getElementById('todoInput') as HTMLInputElement;
    this.todoListEl = document.getElementById('todoList') as HTMLUListElement;
    this.addBtn = document.getElementById('addBtn') as HTMLButtonElement;
    this.navItems = document.querySelectorAll('.nav-item');
    this.clearBtn = document.getElementById(
      'clearCompleted'
    ) as HTMLButtonElement;
    this.createContextMenu();
  }

  private createContextMenu(): void {
    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'context-menu';
    this.contextMenu.innerHTML = `
      <ul>
        <li data-action="edit">编辑 <span class="shortcut">F2</span></li>
        <li data-action="toggle">标记完成 <span class="shortcut">Space</span></li>
        <li data-action="delete">删除 <span class="shortcut">Del</span></li>
      </ul>
    `;
    document.body.appendChild(this.contextMenu);
  }

  private initEventListeners(): void {
    // 添加任务
    this.addBtn.addEventListener('click', () => this.addTodo());
    this.todoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTodo();
    });

    // 导航切换
    this.navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter as FilterType;
        this.filterTodos(filter);
        this.updateNavigation(filter);
      });
    });

    // 清除已完成
    this.clearBtn.addEventListener('click', () => {
      this.todoList.clearCompleted();
      this.render();
    });

    // 拖拽排序
    this.todoListEl.addEventListener(
      'dragstart',
      this.handleDragStart.bind(this)
    );
    this.todoListEl.addEventListener(
      'dragover',
      this.handleDragOver.bind(this)
    );
    this.todoListEl.addEventListener('drop', this.handleDrop.bind(this));
    this.todoListEl.addEventListener('dragend', () => {
      this.draggedItem = null;
    });

    // 右键菜单
    this.todoListEl.addEventListener(
      'contextmenu',
      this.handleContextMenu.bind(this)
    );
    document.addEventListener('click', () => {
      if (this.contextMenu) this.contextMenu.style.display = 'none';
    });

    // 全局键盘快捷键
    document.addEventListener('keydown', this.handleKeyboard.bind(this));

    // 添加移动端菜单控制
    this.initMobileMenu();

    // 初始化自定义下拉菜单
    this.initCustomSelect();
  }

  private addTodo(): void {
    const text = this.todoInput.value.trim();
    if (!text) {
      ui.showToast('请输入待办事项');
      return;
    }

    this.todoList.add(text);
    this.todoInput.value = '';
    this.render();
  }

  private filterTodos(filterType: FilterType): void {
    this.currentFilter = filterType;
    this.render();
  }

  private updateNavigation(filterType: FilterType): void {
    this.navItems.forEach((btn) => {
      const isActive = btn.dataset.filter === filterType;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  private sortTodos(key: SortKey): void {
    // 添加排序动画类
    const items = this.todoListEl.querySelectorAll('.todo-item');
    items.forEach((item) => item.classList.add('sorting'));

    // 显示排序提示
    this.showSortIndicator(key);

    // 延迟执行排序以显示动画
    setTimeout(() => {
      this.todoList.sort(key);

      // 更新排序选择器的显示和选中状态
      const selectEl = document.getElementById('sortSelect');
      const selectedValue = selectEl?.querySelector('.selected-value');
      const options = selectEl?.querySelectorAll('.select-dropdown li');

      if (selectedValue && options) {
        const currentSort = this.todoList.getCurrentSort();
        selectedValue.textContent = currentSort.text;

        options.forEach((option) => {
          option.setAttribute(
            'aria-selected',
            (option as HTMLElement).dataset.value === key ? 'true' : 'false'
          );
        });
      }

      this.render();

      // 移除排序动画类
      requestAnimationFrame(() => {
        this.todoListEl.querySelectorAll('.todo-item').forEach((item) => {
          item.classList.remove('sorting');
        });
      });
    }, 300);
  }

  private showSortIndicator(key: SortKey): void {
    const sortTexts: Record<SortKey, string> = {
      manual: '切换为自定义排序',
      createdAt: '按创建时间排序',
      text: '按名称排序',
      completed: '按完成状态排序',
    };

    const indicator = document.createElement('div');
    indicator.className = 'sort-indicator';
    indicator.textContent = sortTexts[key];
    document.body.appendChild(indicator);

    // 显示提示
    requestAnimationFrame(() => {
      indicator.classList.add('show');
    });

    // 自动移除提示
    setTimeout(() => {
      indicator.classList.remove('show');
      setTimeout(() => {
        indicator.remove();
      }, 300);
    }, 2000);
  }

  private updateCounts(): void {
    const counts = this.todoList.getCounts();
    document.getElementById('allCount')!.textContent = String(counts.all);
    document.getElementById('activeCount')!.textContent = String(counts.active);
    document.getElementById('completedCount')!.textContent = String(
      counts.completed
    );

    // 更新清除按钮显示状态
    this.clearBtn.hidden = counts.completed === 0;
  }

  private handleDragStart(e: DragEvent): void {
    const target = e.target as HTMLElement;
    const item = target.closest('.todo-item');
    if (!item) return;

    this.draggedItem = item as HTMLLIElement;
    item.classList.add('dragging');
    e.dataTransfer?.setData('text/plain', '');
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const item = target.closest('.todo-item');
    if (!item || !this.draggedItem || item === this.draggedItem) return;

    const rect = item.getBoundingClientRect();
    const mid = (rect.bottom - rect.top) / 2;
    const relY = e.clientY - rect.top;

    if (relY < mid) {
      item.parentNode?.insertBefore(this.draggedItem, item);
    } else {
      item.parentNode?.insertBefore(this.draggedItem, item.nextSibling);
    }
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    if (!this.draggedItem) return;

    this.draggedItem.classList.remove('dragging');
    this.updateTodoOrder();

    // 更新排序选择器的显示
    const sortSelect = document.querySelector('#sortSelect .selected-value');
    if (sortSelect) {
      sortSelect.textContent = '自定义排序';
    }

    // 更新选中状态
    const options = document.querySelectorAll(
      '#sortSelect .select-dropdown li'
    );
    options.forEach((option) => {
      option.setAttribute(
        'aria-selected',
        (option as HTMLElement).dataset.value === 'manual' ? 'true' : 'false'
      );
    });
  }

  private updateTodoOrder(): void {
    const items = this.todoListEl.querySelectorAll('.todo-item');
    const newOrder = Array.from(items).map((item) =>
      Number((item as HTMLLIElement).dataset.id)
    );
    this.todoList.reorder(newOrder);
    // 设置当前排序方式为手动排序
    this.todoList.sort('manual');
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
    if (!this.contextMenu) return;

    const target = e.target as HTMLElement;
    const item = target.closest('.todo-item');
    if (!item) return;

    const todoId = Number((item as HTMLLIElement).dataset.id);
    this.showContextMenu({ x: e.pageX, y: e.pageY, todoId });
  }

  private showContextMenu(ctx: TodoContextMenu): void {
    if (!this.contextMenu) return;

    this.contextMenu.style.display = 'block';
    this.contextMenu.style.left = `${ctx.x}px`;
    this.contextMenu.style.top = `${ctx.y}px`;
    this.contextMenu.dataset.todoId = String(ctx.todoId);

    // 确保菜单不超出视窗
    const rect = this.contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.contextMenu.style.left = `${ctx.x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.contextMenu.style.top = `${ctx.y - rect.height}px`;
    }
  }

  private handleKeyboard(e: KeyboardEvent): void {
    const target = document.activeElement;
    const item = target?.closest('.todo-item');

    if (item) {
      const id = Number((item as HTMLLIElement).dataset.id);

      switch (e.key) {
        case 'F2':
          e.preventDefault();
          this.editTodo(id);
          break;
        case ' ': // Space
          if (target?.tagName !== 'INPUT') {
            e.preventDefault();
            this.todoList.toggle(id);
            this.render();
          }
          break;
        case 'Delete':
          e.preventDefault();
          this.todoList.delete(id);
          this.render();
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          this.navigateTodos(e.key === 'ArrowUp' ? -1 : 1);
          break;
      }
    }

    // 全局快捷键
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'a':
          if (target !== this.todoInput) {
            e.preventDefault();
            this.todoInput.focus();
          }
          break;
        case '/':
          e.preventDefault();
          this.filterTodos('all');
          break;
        case '.':
          e.preventDefault();
          this.filterTodos('active');
          break;
        case ',':
          e.preventDefault();
          this.filterTodos('completed');
          break;
      }
    }
  }

  private navigateTodos(direction: number): void {
    const items = Array.from(this.todoListEl.querySelectorAll('.todo-item'));
    const currentIndex = items.findIndex((item) =>
      item.contains(document.activeElement)
    );

    const nextIndex = Math.max(
      0,
      Math.min(items.length - 1, currentIndex + direction)
    );

    const nextItem = items[nextIndex];
    if (nextItem) {
      (nextItem.querySelector('.todo-check') as HTMLElement)?.focus();
    }
  }

  private editTodo(id: number): void {
    const item = this.todoListEl.querySelector(`[data-id="${id}"]`);
    if (!item) return;

    const textEl = item.querySelector('.todo-text') as HTMLElement;
    const currentText = textEl.textContent || '';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'edit-input';

    const finishEdit = () => {
      const newText = input.value.trim();
      if (newText && newText !== currentText) {
        this.todoList.update(id, { text: newText });
        this.render();
      } else {
        textEl.textContent = currentText;
      }
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        textEl.textContent = currentText;
        input.blur();
      }
    });

    textEl.replaceWith(input);
    input.focus();
    input.select();
  }

  private render(): void {
    const todos = this.todoList.filter(this.currentFilter);
    const { total, completed } = this.todoList.getStats();

    // 移除旧的事件监听器
    this.todoListEl.removeEventListener('click', this.handleTodoClick);

    if (todos.length === 0) {
      // 显示空状态
      const message = this.getEmptyStateMessage();
      this.todoListEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-text">${message.text}</div>
          <div class="empty-state-hint">${message.hint}</div>
        </div>
      `;
    } else {
      // 显示待办列表
      this.todoListEl.innerHTML = todos
        .map(
          (todo) => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" 
                data-id="${todo.id}"
                draggable="true"
                tabindex="0"
            >
              <input 
                type="checkbox" 
                class="todo-check"
                ${todo.completed ? 'checked' : ''}
                aria-label="${todo.completed ? '标记为未完成' : '标记为已完成'}"
              >
              <span class="todo-text">${todo.text}</span>
              <button class="delete-btn" aria-label="删除">删除</button>
            </li>
          `
        )
        .join('');

      // 添加新的事件监听器
      this.todoListEl.addEventListener('click', this.handleTodoClick);
    }

    // 更新统计信息
    ui.updateStats(total, completed);
    this.updateCounts();
  }

  private getEmptyStateMessage(): { text: string; hint: string } {
    switch (this.currentFilter) {
      case 'active':
        return {
          text: '暂无待处理的任务',
          hint: '添加新任务或查看其他分类',
        };
      case 'completed':
        return {
          text: '暂无已完成的任务',
          hint: '完成一些任务后再来看看吧',
        };
      default:
        return {
          text: '暂无待办事项',
          hint: '点击上方的输入框添加新任务',
        };
    }
  }

  // 将事件处理器定义为类的方法
  private handleTodoClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const li = target.closest('.todo-item');
    if (!li) return;

    const id = Number((li as HTMLLIElement).dataset.id);
    if (target.matches('.todo-check')) {
      this.todoList.toggle(id);
      this.render();
    } else if (target.matches('.delete-btn')) {
      this.todoList.delete(id);
      this.render();
    }
  };

  // 添加移动端菜单控制
  private initMobileMenu(): void {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    const toggleMenu = () => {
      sidebar?.classList.toggle('active');
      overlay?.classList.toggle('active');
      document.body.style.overflow = sidebar?.classList.contains('active')
        ? 'hidden'
        : '';
    };

    menuBtn?.addEventListener('click', toggleMenu);
    overlay?.addEventListener('click', toggleMenu);

    // 点击导航项后关闭菜单
    this.navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          toggleMenu();
        }
      });
    });
  }

  private initCustomSelect(): void {
    const selectEl = document.getElementById('sortSelect');
    const buttonEl = selectEl?.querySelector('.select-button');
    const selectedValue = selectEl?.querySelector('.selected-value');
    const dropdownEl = selectEl?.querySelector('.select-dropdown');

    if (!selectEl || !buttonEl || !selectedValue || !dropdownEl) return;

    const closeDropdown = () => {
      selectEl.classList.remove('open');
      buttonEl.setAttribute('aria-expanded', 'false');
    };

    const openDropdown = () => {
      selectEl.classList.add('open');
      buttonEl.setAttribute('aria-expanded', 'true');
    };

    // 切换下拉菜单
    buttonEl.addEventListener('click', (e) => {
      e.stopPropagation();
      selectEl.classList.contains('open') ? closeDropdown() : openDropdown();
    });

    // 选择选项
    dropdownEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (!target.matches('li')) return;

      const value = target.dataset.value;
      if (!value) return;

      // 更新选中状态
      dropdownEl.querySelectorAll('li').forEach((li) => {
        li.setAttribute('aria-selected', li === target ? 'true' : 'false');
      });

      // 更新显示文本
      selectedValue.textContent = target.textContent;

      // 关闭下拉菜单
      closeDropdown();

      // 触发排序并重新渲染
      this.sortTodos(value as SortKey);
    });

    // 点击外部关闭下拉菜单
    document.addEventListener('click', () => {
      closeDropdown();
    });

    // 初始化选中状态
    const currentSort = this.todoList.getCurrentSort();
    selectedValue.textContent = currentSort.text;
  }
}

// 创建应用实例
new TodoApp();

// 支持暗色模式切换
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
}
