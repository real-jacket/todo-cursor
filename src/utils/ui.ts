type ToastType = 'error' | 'success' | 'info';

export const ui = {
  showToast(message: string, type: ToastType = 'error'): void {
    const toast = document.getElementById('errorToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add(type);
    toast.hidden = false;

    setTimeout(() => {
      toast.hidden = true;
      toast.classList.remove(type);
    }, 3000);
  },

  updateStats(total: number, completed: number): void {
    const stats = document.getElementById('todoStats');
    const clearBtn = document.getElementById('clearCompleted');

    if (stats) {
      stats.textContent = `共 ${total} 项，已完成 ${completed} 项`;
    }

    if (clearBtn) {
      clearBtn.hidden = completed === 0;
    }
  },

  showLoading(show: boolean): void {
    const todoList = document.getElementById('todoList');
    if (!todoList) return;

    if (show) {
      todoList.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      `;
    }
  },

  showError(message: string): void {
    this.showToast(message, 'error');
  },
};
