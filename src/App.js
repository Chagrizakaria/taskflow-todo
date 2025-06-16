import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getUserTasks,
    addTask,
    updateTask,
    deleteTask,
    tasksCollection,
    db
} from './firebase';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Pencil, Trash, GripVertical, Gear } from 'react-bootstrap-icons';

// Combined Sortable Todo Item Component
const SortableTodoItem = React.memo(({
    todo,
    isEditing,
    editingText,
    onToggle,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onConfirmDelete,
    onEditingTextChange
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: todo.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`list-group-item d-flex align-items-center ${todo.completed ? 'bg-light' : ''}`}
        >
            {isEditing ? (
                <div className="d-flex flex-grow-1 align-items-center">
                    <input
                        type="text"
                        className="form-control form-control-sm me-2"
                        value={editingText}
                        onChange={onEditingTextChange}
                        onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(todo.id)}
                        autoFocus
                    />
                    <button className="btn btn-sm btn-success me-1" onClick={() => onSaveEdit(todo.id)}>Save</button>
                    <button className="btn btn-sm btn-secondary" onClick={onCancelEdit}>Cancel</button>
                </div>
            ) : (
                <div className="d-flex flex-grow-1 align-items-center">
                    <input
                        type="checkbox"
                        className="form-check-input me-3"
                        checked={todo.completed}
                        onChange={() => onToggle(todo.id)}
                        style={{ transform: 'scale(1.2)' }}
                    />
                    <span
                        className={`flex-grow-1 ${todo.completed ? 'text-decoration-line-through text-muted' : ''}`}
                        onDoubleClick={() => onStartEdit(todo)}
                    >
                        {todo.text}
                    </span>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => onStartEdit(todo)}><Pencil /></button>
                    <button className="btn btn-sm btn-outline-danger me-2" onClick={() => onConfirmDelete(todo.id)}><Trash /></button>
                    <span {...listeners} style={{ cursor: 'grab', touchAction: 'none' }}><GripVertical /></span>
                </div>
            )}
        </li>
    );
});

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ onConfirm, onCancel, themeColor }) => (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-header" style={{ backgroundColor: themeColor, color: 'white' }}>
                    <h5 className="modal-title">Confirm Delete</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
                </div>
                <div className="modal-body">Are you sure you want to delete this task?</div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button type="button" className="btn btn-danger" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    </div>
);

// Theme Picker Modal
const ThemePickerModal = ({ isOpen, onClose, onSelectTheme, currentTheme }) => {
    if (!isOpen) return null;
    const themeColors = ['#20c997', '#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#198754'];

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header" style={{ backgroundColor: currentTheme, color: 'white' }}>
                        <h5 className="modal-title">Choose a Theme</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body d-flex flex-wrap gap-3 justify-content-center">
                        {themeColors.map(color => (
                            <div
                                key={color}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: color,
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    border: color === currentTheme ? '3px solid #000' : 'none',
                                    transition: 'transform 0.2s',
                                }}
                                onClick={() => onSelectTheme(color)}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [todos, setTodos] = useState([]);
    const [newTodoText, setNewTodoText] = useState('');
    const [editingTodoId, setEditingTodoId] = useState(null);
    const [editingTodoText, setEditingTodoText] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [todoToDelete, setTodoToDelete] = useState(null);
    const [themeColor, setThemeColor] = useState('#20c997');
    const [showThemePicker, setShowThemePicker] = useState(false);

    const { currentUser, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (!currentUser) {
            setTodos([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = getUserTasks(
            currentUser.uid,
            (tasks) => {
                const sortedTasks = tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
                setTodos(sortedTasks);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching tasks:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTodoText.trim() || !currentUser) return;

        const newTodo = {
            text: newTodoText,
            completed: false,
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
            order: todos.length > 0 ? Math.max(...todos.map(t => t.order)) + 1 : 0,
        };

        const tempId = `temp-${Date.now()}`;
        setTodos(prevTodos => [...prevTodos, { ...newTodo, id: tempId, createdAt: new Date().toISOString() }]);
        setNewTodoText('');

        try {
            await addTask(currentUser.uid, newTodo);
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
            setTodos(prevTodos => prevTodos.filter(todo => todo.id !== tempId));
        }
    };

    const toggleTodo = async (id) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        const updatedTodos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setTodos(updatedTodos);

        try {
            await updateTask(id, { completed: !todo.completed });
        } catch (error) {
            console.error('Error toggling task:', error);
            alert('Failed to update task status.');
            setTodos(todos); // Revert on failure
        }
    };

    const startEdit = (todo) => {
        setEditingTodoId(todo.id);
        setEditingTodoText(todo.text);
    };

    const cancelEdit = () => {
        setEditingTodoId(null);
        setEditingTodoText('');
    };

    const saveEdit = async (todoId) => {
        if (!editingTodoText.trim()) {
            alert('Task text cannot be empty.');
            return;
        }

        const originalTodos = [...todos];
        const updatedTodos = todos.map(t => t.id === todoId ? { ...t, text: editingTodoText } : t);
        setTodos(updatedTodos);
        cancelEdit();

        try {
            await updateTask(todoId, { text: editingTodoText });
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task. Reverting changes.');
            setTodos(originalTodos);
        }
    };

    const confirmDelete = (id) => {
        setTodoToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!todoToDelete) return;

        const originalTodos = [...todos];
        setTodos(todos.filter(todo => todo.id !== todoToDelete));
        setShowDeleteModal(false);

        try {
            await deleteTask(todoToDelete);
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task. Reverting changes.');
            setTodos(originalTodos);
        }
        setTodoToDelete(null);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = todos.findIndex(t => t.id === active.id);
        const newIndex = todos.findIndex(t => t.id === over.id);
        const updatedTodos = arrayMove(todos, oldIndex, newIndex);
        setTodos(updatedTodos);

        const batch = writeBatch(db);
        updatedTodos.forEach((todo, index) => {
            const taskRef = doc(db, tasksCollection, todo.id);
            batch.update(taskRef, { order: index });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error('Error reordering tasks:', error);
            alert('Failed to reorder tasks. Reverting changes.');
            setTodos(todos); // Revert on failure
        }
    };

    const resetAll = async () => {
        if (!currentUser || todos.length === 0) return;
        if (window.confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
            const originalTodos = [...todos];
            setTodos([]);
            try {
                const batch = writeBatch(db);
                originalTodos.forEach(todo => {
                    const taskRef = doc(db, tasksCollection, todo.id);
                    batch.delete(taskRef);
                });
                await batch.commit();
            } catch (error) {
                console.error('Error deleting all tasks:', error);
                alert('Failed to delete all tasks. Reverting changes.');
                setTodos(originalTodos);
            }
        }
    };

    const progress = useMemo(() => {
        const completed = todos.filter(todo => todo.completed).length;
        return todos.length > 0 ? Math.round((completed / todos.length) * 100) : 0;
    }, [todos]);

    // Loading state
    if (loading) {
        return (
            <div className="vh-100 d-flex justify-content-center align-items-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Login prompt if not authenticated
    if (!currentUser) {
        return (
            <div className="container-fluid vh-100 d-flex justify-content-center align-items-center bg-light">
                <div className="text-center">
                    <h1>Welcome to TaskFlow</h1>
                    <p>Please log in to manage your tasks.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
                </div>
            </div>
        );
    }

    // Main App UI
    return (
        <div className="container-fluid vh-100 d-flex flex-column p-0 bg-light">
            {showDeleteModal && <DeleteConfirmationModal onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} themeColor={themeColor} />}
            <ThemePickerModal isOpen={showThemePicker} onClose={() => setShowThemePicker(false)} onSelectTheme={setThemeColor} currentTheme={themeColor} />

            <header className="d-flex justify-content-between align-items-center p-3 shadow-sm" style={{ backgroundColor: themeColor, color: 'white' }}>
                <h1 className="h4 mb-0">TaskFlow</h1>
                <div className="d-flex align-items-center">
                    {currentUser && <span className="navbar-text me-3">Welcome, {currentUser.displayName || currentUser.email}</span>}
                    <button className="btn btn-sm btn-outline-light me-2" onClick={() => setShowThemePicker(true)}><Gear /></button>
                    <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="flex-grow-1 d-flex justify-content-center align-items-start p-4" style={{ overflowY: 'auto' }}>
                <div className="w-100" style={{ maxWidth: '800px' }}>
                    <div className="card shadow-lg">
                        <div className="card-header p-4" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                            <form onSubmit={addTodo} className="d-flex gap-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newTodoText}
                                    onChange={(e) => setNewTodoText(e.target.value)}
                                    placeholder="Add a new task..."
                                />
                                <button type="submit" className="btn" style={{ backgroundColor: themeColor, color: 'white' }}>Add</button>
                            </form>
                            <div className="mt-3">
                                <div className="progress">
                                    <div className="progress-bar" role="progressbar" style={{ width: `${progress}%`, backgroundColor: themeColor }} aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
                                        {progress > 0 && `${progress}%`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-body p-0">
                            {loading ? (
                                <div className="d-flex justify-content-center p-4">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                        <ul className="list-group list-group-flush">
                                            {todos.map(todo => (
                                                <SortableTodoItem
                                                    key={todo.id}
                                                    todo={todo}
                                                    isEditing={editingTodoId === todo.id}
                                                    editingText={editingTodoText}
                                                    onToggle={toggleTodo}
                                                    onStartEdit={startEdit}
                                                    onSaveEdit={saveEdit}
                                                    onCancelEdit={cancelEdit}
                                                    onConfirmDelete={confirmDelete}
                                                    onEditingTextChange={(e) => setEditingTodoText(e.target.value)}
                                                />
                                            ))}
                                        </ul>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>

                        {todos.length > 0 && (
                            <div className="card-footer text-center">
                                <button className="btn btn-sm btn-outline-danger" onClick={resetAll}>Delete All Tasks</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <footer className="text-center py-3 mt-auto" style={{ backgroundColor: themeColor, color: 'white' }}>
                <div className="container">
                    <span>TaskFlow © {new Date().getFullYear()} | Your Modern Todo-List</span>
                </div>
            </footer>
        </div>
    );
}

export default App;
