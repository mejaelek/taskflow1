let tasks = [];
let currentFilter = 'all';

// Tailwind script already loaded in HTML
function initTailwind() {
    tailwind.config = { content: ["./**/*.{html,js}"], darkMode: 'class' };
}

function loadTasks() {
    const saved = localStorage.getItem('taskflow-tasks');
    tasks = saved ? JSON.parse(saved) : [];
}

function saveTasks() {
    localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
}

function renderTasks(filteredTasks) {
    const container = document.getElementById('task-list');
    container.innerHTML = '';

    if (filteredTasks.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-400">No tasks found</div>`;
        return;
    }

    filteredTasks.forEach((task, index) => {
        const globalIndex = tasks.findIndex(t => t.id === task.id);
        const card = document.createElement('div');
        card.className = `task-card bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm flex items-center gap-4 cursor-move`;
        card.draggable = true;
        card.dataset.index = globalIndex;
        card.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} class="w-6 h-6 accent-blue-600" onchange="toggleComplete(${globalIndex})">
            <div class="flex-1">
                <div class="flex items-center gap-3">
                    <span class="font-medium ${task.completed ? 'line-through text-gray-400' : ''}">${task.title}</span>
                    <span class="px-3 py-1 text-xs rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}">
                        ${task.priority}
                    </span>
                    ${task.dueDate ? `<span class="text-xs text-gray-500">${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
            <button onclick="editTask(${globalIndex}); event.stopImmediatePropagation()" class="text-blue-600 hover:text-blue-700"><i class="fa-solid fa-pen"></i></button>
            <button onclick="deleteTask(${globalIndex}); event.stopImmediatePropagation()" class="text-red-500 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
        `;
        // Drag events
        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragover', dragOver);
        card.addEventListener('drop', drop);
        container.appendChild(card);
    });
    updateStats();
}

function addTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-input').value.trim();
    const dueDate = document.getElementById('due-date').value;
    const priority = document.getElementById('priority').value;

    if (!title) return;

    tasks.unshift({
        id: Date.now(),
        title,
        completed: false,
        dueDate,
        priority,
        createdAt: new Date().toISOString()
    });

    saveTasks();
    document.getElementById('task-form').reset();
    renderTasks(getFilteredTasks());
}

function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks(getFilteredTasks());
}

function deleteTask(index) {
    if (confirm('Delete this task?')) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks(getFilteredTasks());
    }
}

function editTask(index) {
    const newTitle = prompt('Edit task:', tasks[index].title);
    if (newTitle !== null && newTitle.trim() !== '') {
        tasks[index].title = newTitle.trim();
        saveTasks();
        renderTasks(getFilteredTasks());
    }
}

function getFilteredTasks() {
    let filtered = tasks;
    const today = new Date().toISOString().split('T')[0];

    if (currentFilter === 'today') {
        filtered = tasks.filter(t => t.dueDate === today);
    } else if (currentFilter === 'upcoming') {
        filtered = tasks.filter(t => t.dueDate && t.dueDate > today && !t.completed);
    } else if (currentFilter === 'completed') {
        filtered = tasks.filter(t => t.completed);
    }
    return filtered;
}

function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active', 'bg-blue-100', 'dark:bg-blue-900'));
    document.getElementById(`filter-${filter}`).classList.add('active', 'bg-blue-100', 'dark:bg-blue-900');
    renderTasks(getFilteredTasks());
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const today = new Date().toISOString().split('T')[0];
    const dueToday = tasks.filter(t => t.dueDate === today && !t.completed).length;

    document.getElementById('stats').innerHTML = `
        <div class="flex justify-between"><span class="text-gray-500">Total Tasks</span><span class="font-semibold">${total}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Completed</span><span class="font-semibold text-green-600">${completed}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Pending</span><span class="font-semibold">${pending}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Due Today</span><span class="font-semibold text-orange-600">${dueToday}</span></div>
    `;
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const text = document.getElementById('mode-text');
    text.textContent = document.documentElement.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
}

function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'taskflow-backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Drag & Drop functions
function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.currentTarget.dataset.index);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = parseInt(e.currentTarget.dataset.index);
    
    if (fromIndex !== toIndex) {
        const [movedTask] = tasks.splice(fromIndex, 1);
        tasks.splice(toIndex, 0, movedTask);
        saveTasks();
        renderTasks(getFilteredTasks());
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initTailwind();
    loadTasks();
    document.getElementById('task-form').addEventListener('submit', addTask);
    renderTasks(getFilteredTasks());
    
    // Keyboard shortcut: Ctrl/Cmd + K to focus input
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('task-input').focus();
        }
    });
});
