// Replace with your API Gateway endpoint URL
const API_URL = 'https://kpdu9d8n1a.execute-api.us-east-1.amazonaws.com/prod';

// DOM elements
const todoForm = document.getElementById('todo-form');
const titleInput = document.getElementById('todo-title');
const descriptionInput = document.getElementById('todo-description');
const todosContainer = document.getElementById('todos-container');
const loadingSpinner = document.getElementById('loading-spinner');
const noTodosMessage = document.getElementById('no-todos-message');
const editTodoModal = new bootstrap.Modal(document.getElementById('editTodoModal'));
const editTodoForm = document.getElementById('edit-todo-form');
const editTodoId = document.getElementById('edit-todo-id');
const editTodoTitle = document.getElementById('edit-todo-title');
const editTodoDescription = document.getElementById('edit-todo-description');
const saveEditBtn = document.getElementById('save-edit-btn');

// Event listeners
todoForm.addEventListener('submit', handleAddTodo);
saveEditBtn.addEventListener('click', handleSaveEdit);

// Initialize the app
document.addEventListener('DOMContentLoaded', loadTodos);

// Load all todos
async function loadTodos() {
    try {
        showLoading();
        
        const response = await fetch(`${API_URL}/todos`);
        const data = await response.json();
        
        todosContainer.innerHTML = '';
        
        if (data.todos && data.todos.length > 0) {
            data.todos.forEach(todo => {
                addTodoToDOM(todo);
            });
            showTodosContainer();
        } else {
            showNoTodosMessage();
        }
    } catch (error) {
        console.error('Error loading todos:', error);
        showError('Error loading todos. Please try again.');
        showNoTodosMessage();
    } finally {
        hideLoading();
    }
}

// Add a new todo
async function handleAddTodo(e) {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    
    if (!title) {
        showError('Please enter a title');
        return;
    }
    
    const todo = {
        todoid: Date.now().toString(), // Simple ID generation
        title: title,
        description: description,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    try {
        const response = await fetch(`${API_URL}/todo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(todo)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            addTodoToDOM(todo);
            todoForm.reset();
            hideNoTodosMessage();
            showTodosContainer();
        } else {
            showError('Error adding todo: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error adding todo:', error);
        showError('Error adding todo. Please try again.');
    }
}

// Add todo to the DOM
function addTodoToDOM(todo) {
    const todoElement = document.createElement('div');
    todoElement.className = `todo-item mb-3 p-3 rounded ${todo.status === 'completed' ? 'completed' : ''}`;
    todoElement.dataset.id = todo.todoid;
    
    const statusClass = todo.status === 'completed' ? 'bg-success' : 'bg-secondary';
    
    todoElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="me-3">
                <h5 class="todo-title mb-1">${todo.title}</h5>
                <p class="todo-description mb-2 text-muted">${todo.description || 'No description'}</p>
                <span class="status-badge badge ${statusClass}">${todo.status}</span>
            </div>
            <div class="todo-actions btn-group">
                <button class="btn btn-sm btn-outline-primary edit-btn" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-success toggle-btn" title="Toggle Status">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    todosContainer.prepend(todoElement);
    
    // Add event listeners to the buttons
    todoElement.querySelector('.edit-btn').addEventListener('click', () => openEditModal(todo));
    todoElement.querySelector('.toggle-btn').addEventListener('click', () => toggleTodoStatus(todo.todoid));
    todoElement.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.todoid));
}

// Open edit modal
function openEditModal(todo) {
    editTodoId.value = todo.todoid;
    editTodoTitle.value = todo.title;
    editTodoDescription.value = todo.description || '';
    editTodoModal.show();
}

// Save edited todo
async function handleSaveEdit() {
    const todoId = editTodoId.value;
    const title = editTodoTitle.value.trim();
    const description = editTodoDescription.value.trim();
    
    if (!title) {
        showError('Please enter a title');
        return;
    }
    
    try {
        // First update title and description
        await Promise.all([
            updateTodoField(todoId, 'title', title),
            updateTodoField(todoId, 'description', description)
        ]);
        
        // Update the DOM
        const todoElement = document.querySelector(`.todo-item[data-id="${todoId}"]`);
        if (todoElement) {
            todoElement.querySelector('.todo-title').textContent = title;
            todoElement.querySelector('.todo-description').textContent = description || 'No description';
        }
        
        editTodoModal.hide();
    } catch (error) {
        console.error('Error updating todo:', error);
        showError('Error updating todo. Please try again.');
    }
}

// Toggle todo status
async function toggleTodoStatus(todoId) {
    try {
        const todoElement = document.querySelector(`.todo-item[data-id="${todoId}"]`);
        const currentStatus = todoElement.querySelector('.status-badge').textContent;
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        
        await updateTodoField(todoId, 'status', newStatus);
        
        // Update the DOM
        const statusBadge = todoElement.querySelector('.status-badge');
        statusBadge.textContent = newStatus;
        statusBadge.classList.toggle('bg-success');
        statusBadge.classList.toggle('bg-secondary');
        todoElement.classList.toggle('completed');
        
        const titleElement = todoElement.querySelector('.todo-title');
        titleElement.classList.toggle('text-decoration-line-through');
        titleElement.classList.toggle('text-muted');
    } catch (error) {
        console.error('Error toggling todo status:', error);
        showError('Error updating todo status. Please try again.');
    }
}

// Delete todo
async function deleteTodo(todoId) {
    if (!confirm('Are you sure you want to delete this todo?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/todo`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                todoId: todoId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            document.querySelector(`.todo-item[data-id="${todoId}"]`)?.remove();
            
            // Check if there are no todos left
            if (todosContainer.children.length === 0) {
                showNoTodosMessage();
                hideTodosContainer();
            }
        } else {
            showError('Error deleting todo: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
        showError('Error deleting todo. Please try again.');
    }
}

// Helper function to update a single todo field
async function updateTodoField(todoId, field, value) {
    const response = await fetch(`${API_URL}/todo`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            todoId: todoId,
            updateKey: field,
            updateValue: value
        })
    });
    
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update todo');
    }
}

// UI Helper functions
function showLoading() {
    loadingSpinner.classList.remove('d-none');
    todosContainer.classList.add('d-none');
    noTodosMessage.classList.add('d-none');
}

function hideLoading() {
    loadingSpinner.classList.add('d-none');
}

function showTodosContainer() {
    todosContainer.classList.remove('d-none');
    noTodosMessage.classList.add('d-none');
}

function hideTodosContainer() {
    todosContainer.classList.add('d-none');
}

function showNoTodosMessage() {
    noTodosMessage.classList.remove('d-none');
    todosContainer.classList.add('d-none');
}

function hideNoTodosMessage() {
    noTodosMessage.classList.add('d-none');
}

function showError(message) {
    // You could implement a more sophisticated error display
    alert(message);
}