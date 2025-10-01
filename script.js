let tasks = [];
let sortAsc = true;
let filterStatus = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {

  const container = document.createElement('div');
  container.className = 'container';
  document.body.appendChild(container);

  const title = document.createElement('h1');
  title.textContent = 'Список задач';
  container.appendChild(title);

  const taskInputDiv = document.createElement('div');
  taskInputDiv.className = 'task-input';
  
  const taskInput = document.createElement('input');
  taskInput.type = 'text';
  taskInput.placeholder = 'Название задачи';
  
  const taskDate = document.createElement('input');
  taskDate.type = 'date';
  
  const addButton = document.createElement('button');
  addButton.textContent = 'Добавить';
  
  taskInputDiv.append(taskInput, taskDate, addButton);
  container.appendChild(taskInputDiv);

  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'task-controls';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Поиск...';
  
  const statusFilter = document.createElement('select');
  const optionAll = document.createElement('option');
  optionAll.value = 'all';
  optionAll.textContent = 'Все';
  const optionCompleted = document.createElement('option');
  optionCompleted.value = 'completed';
  optionCompleted.textContent = 'Выполненные';
  const optionIncomplete = document.createElement('option');
  optionIncomplete.value = 'incomplete';
  optionIncomplete.textContent = 'Невыполненные';
  statusFilter.append(optionAll, optionCompleted, optionIncomplete);
  
  const sortButton = document.createElement('button');
  sortButton.textContent = 'Сортировать по дате';
  
  controlsDiv.append(searchInput, statusFilter, sortButton);
  container.appendChild(controlsDiv);

  const taskList = document.createElement('ul');
  taskList.id = 'taskList';
  container.appendChild(taskList);

  loadTasks();
  renderTasks();

  addButton.addEventListener('click', addTask);
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderTasks();
  });
  statusFilter.addEventListener('change', () => {
    filterStatus = statusFilter.value;
    renderTasks();
  });
  sortButton.addEventListener('click', () => {
    sortTasks();
  });

  function addTask() {
    const text = taskInput.value.trim();
    const date = taskDate.value;
    if (text === '') {
      alert('Введите название задачи!');
      return;
    }
    const task = {
      id: Date.now(),
      text: text,
      date: date,
      completed: false
    };
    tasks.push(task);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskDate.value = '';
  }

  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
  }

  function toggleTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    }
  }

  function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    const newText = prompt('Редактировать название задачи:', task.text);
    if (newText !== null) {
      task.text = newText;
    }
    const newDate = prompt('Редактировать дату задачи (YYYY-MM-DD):', task.date);
    if (newDate !== null) {
      task.date = newDate;
    }
    saveTasks();
    renderTasks();
  }

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  function loadTasks() {
    const tasksJSON = localStorage.getItem('tasks');
    if (tasksJSON) {
      tasks = JSON.parse(tasksJSON);
    }
  }

  function sortTasks() {
    tasks.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date) - new Date(b.date);
      } else {
        return 0;
      }
    });
    if (!sortAsc) {
      tasks.reverse();
    }
    sortAsc = !sortAsc;
    renderTasks();
    saveTasks();
  }

  function renderTasks() {
 
    while (taskList.firstChild) {
      taskList.removeChild(taskList.firstChild);
    }

    let filteredTasks = tasks.filter(task => {
      if (filterStatus === 'completed' && !task.completed) return false;
      if (filterStatus === 'incomplete' && task.completed) return false;
      if (searchQuery && !task.text.toLowerCase().includes(searchQuery)) return false;
      return true;
    });

    filteredTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      if (task.completed) {
        li.classList.add('completed');
      }
      li.draggable = true;
      li.dataset.id = task.id;
 
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => toggleTask(task.id));
 
      const textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = task.text;

      const dateSpan = document.createElement('span');
      dateSpan.className = 'task-date';
      dateSpan.textContent = task.date;

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Редактировать';
      editBtn.className = 'edit-btn';
      editBtn.addEventListener('click', () => editTask(task.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Удалить';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => deleteTask(task.id));
 
      li.append(checkbox, textSpan, dateSpan, editBtn, deleteBtn);
      taskList.appendChild(li);

      li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        li.classList.add('dragging');
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
      });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        const dragId = e.dataTransfer.getData('text/plain');
        const dropId = li.dataset.id;
        if (dragId === dropId) return;
        const dragIndex = tasks.findIndex(t => t.id === Number(dragId));
        const dropIndex = tasks.findIndex(t => t.id === Number(dropId));
        const [dragTask] = tasks.splice(dragIndex, 1);
        tasks.splice(dropIndex, 0, dragTask);
        saveTasks();
        renderTasks();
      });
    });
  }
});
