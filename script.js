// 获取待办事项列表
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// 渲染待办事项列表
function renderTodos() {
  const todoList = document.getElementById('todoList');
  todoList.innerHTML = '';

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
            <span onclick="toggleTodo(${index})" style="cursor: pointer; flex: 1;">
                ${todo.text}
            </span>
            <button class="delete-btn" onclick="deleteTodo(${index})">删除</button>
        `;

    if (todo.completed) {
      li.classList.add('completed');
    }

    todoList.appendChild(li);
  });

  // 保存到本地存储
  localStorage.setItem('todos', JSON.stringify(todos));
}

// 添加新的待办事项
function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();

  if (text) {
    todos.push({
      text: text,
      completed: false,
    });
    input.value = '';
    renderTodos();
  }
}

// 切换待办事项的完成状态
function toggleTodo(index) {
  todos[index].completed = !todos[index].completed;
  renderTodos();
}

// 删除待办事项
function deleteTodo(index) {
  todos.splice(index, 1);
  renderTodos();
}

// 监听回车键添加待办事项
document.getElementById('todoInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    addTodo();
  }
});

// 初始化渲染
renderTodos();
