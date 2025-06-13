import React, { useState, useCallback, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CategoryManager from './components/CategoryManager';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { CheckCircleFill, XCircle, CheckCircle, Pencil, Trash, Check, X, GripVertical, Book, ListCheck, Gear } from 'react-bootstrap-icons';

const SortableItem = React.memo(React.forwardRef(({ id, children, disabled = false }, ref) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDndNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'grab',
    touchAction: 'none',
  };

  // Create a ref callback to handle both the forwarded ref and the internal setNodeRef
  const setRefs = useCallback((node) => {
    // Set the node for the drag and drop functionality
    setDndNodeRef(node);
    
    // Forward the ref if one was provided
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }
  }, [ref, setDndNodeRef]);

  // If children is a function, call it with the necessary props
  if (typeof children === 'function') {
    return (
      <div 
        ref={setRefs}
        style={style}
        {...attributes}
      >
        {children({
          listeners: !disabled ? listeners : {},
          attributes,
          isDragging,
          style,
          setNodeRef: setRefs
        })}
      </div>
    );
  }
  
  // Otherwise, render children as is
  return (
    <div 
      ref={setRefs}
      style={style}
      {...attributes}
    >
      {children}
    </div>
  );
}));

// Add display name for better debugging
SortableItem.displayName = 'SortableItem';

function App() {
  // Theme state
  const [themeColor, setThemeColor] = useState('#20c997');
  const [showThemePicker, setShowThemePicker] = useState(false);
  
  const { currentUser, logout, loading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  // Set loading to false when auth state changes
  React.useEffect(() => {
    if (currentUser !== undefined) {
      // Auth state has been determined
    }
  }, [currentUser]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Theme colors for the theme picker
  const themeColors = [
    '#20c997', // Teal
    '#0d6efd', // Blue
    '#6f42c1', // Purple
    '#d63384', // Pink
    '#fd7e14', // Orange
    '#198754', // Green
  ];
  
  // Apply theme color
  const applyTheme = useCallback((color) => {
    setThemeColor(color);
    setShowThemePicker(false);
  }, []);
  
  const [todos, setTodos] = useState([
    { id: 1, text: 'Check wind speed', completed: false, locked: false },
    { id: 2, text: 'Inspect gear', completed: false, locked: true },
    { id: 3, text: 'Load gear in van', completed: false, locked: true },
    { id: 4, text: 'Drive to beach', completed: false, locked: true },
    { id: 5, text: 'Set up sail', completed: false, locked: true },
    { id: 6, text: 'Begin windsurfing', completed: false, locked: true },
  ]);
  
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );



  const toggleTodo = (id) => {
    setTodos(prevTodos => {
      const newTodos = [...prevTodos];
      const todoIndex = newTodos.findIndex(t => t.id === id);
      
      if (todoIndex === -1) return prevTodos;
      
      // Toggle the completed status
      const updatedTodo = { 
        ...newTodos[todoIndex], 
        completed: !newTodos[todoIndex].completed 
      };
      newTodos[todoIndex] = updatedTodo;
      
      // Update locking logic for all tasks
      let allPreviousCompleted = updatedTodo.completed;
      
      // Update subsequent tasks' locked status
      for (let i = todoIndex + 1; i < newTodos.length; i++) {
        newTodos[i] = { 
          ...newTodos[i], 
          locked: !allPreviousCompleted || !newTodos[i-1].completed
        };
        allPreviousCompleted = allPreviousCompleted && newTodos[i].completed;
      }
      
      return newTodos;
    });
  };
  
  const startEditing = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };
  
  const saveEdit = (id) => {
    if (editText.trim()) {
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? { ...todo, text: editText.trim() } : todo
        )
      );
      setEditingId(null);
      setEditText('');
    }
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };
  
  // Delete functionality is now handled by handleDeleteClick and confirmDelete
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    setTodos((items) => {
      // Convert string IDs to numbers for comparison
      const oldIndex = items.findIndex(item => item.id === parseInt(active.id));
      const newIndex = items.findIndex(item => item.id === parseInt(over.id));
      
      if (oldIndex === -1 || newIndex === -1) return items;
      
      // Don't allow moving locked or completed items
      if (items[oldIndex].locked || items[oldIndex].completed) return items;
      
      // Don't allow moving items after a completed task
      if (newIndex > 0 && !items[newIndex - 1].completed) return items;
      
      // Create a new array with the moved item
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Update locked status for all items
      return newItems.map((item, index) => {
        // First item is never locked
        if (index === 0) return { ...item, locked: false };
        
        // Item is locked if the previous one isn't completed
        return {
          ...item,
          locked: !newItems[index - 1].completed
        };
      });
    });
  };

  const resetAll = () => {
    setTodos(todos.map((todo, index) => ({
      ...todo,
      completed: false,
      locked: index !== 0 // Lock all except first item
    })));
    setEditingId(null);
    setEditText('');
  };

  const addTodo = (text) => {
    // Check for duplicate task text
    if (todos.some(todo => todo.text.toLowerCase() === text.toLowerCase())) {
      alert('This task already exists!');
      return;
    }
    
    const newTodo = {
      id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1,
      text,
      completed: false,
      // New tasks are locked unless they're the first task or all previous tasks are completed
      locked: todos.length > 0 && !todos.every(t => t.completed)
    };
    
    setTodos([...todos, newTodo]);
  };

  // Render function for each todo item
  const TodoItem = React.forwardRef(({ todo, dragHandleProps = {}, isDragging = false, style = {} }, ref) => {
    // Remove unused showDragHandle since we're using the disabled prop from parent
    return (
    <li 
      className={`list-group-item d-flex justify-content-between align-items-center ${todo.locked ? 'text-muted' : ''} ${isDragging ? 'bg-light' : ''}`}
      style={style}
    >
      <div className="d-flex align-items-center" style={{ flex: 1 }}>
        {!todo.locked && !todo.completed && (
          <div 
            className="me-2 drag-handle" 
            {...(dragHandleProps || {})}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="text-muted" />
          </div>
        )}
        <div className="d-flex align-items-center" style={{ flex: 1 }}>
          <div 
            onClick={() => !todo.locked && toggleTodo(todo.id)}
            style={{ 
              cursor: todo.locked ? 'not-allowed' : 'pointer',
              flex: 1
            }}
          >
            {todo.completed ? (
              <CheckCircleFill 
                className="text-success me-2" 
                size={24} 
              />
            ) : todo.locked ? (
              <XCircle className="text-muted me-2" size={24} />
            ) : (
              <CheckCircle 
                className="text-primary me-2" 
                size={24} 
              />
            )}
          </div>
          
          {editingId === todo.id ? (
            <input
              type="text"
              className="form-control form-control-sm"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(todo.id);
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
            />
          ) : (
            <span 
              className={todo.completed ? 'text-decoration-line-through' : ''}
              style={{ flex: 1 }}
            >
              {todo.text}
            </span>
          )}
        </div>
      </div>
      
      <div className="ms-2">
        {editingId === todo.id ? (
          <>
            <button 
              className="btn btn-sm btn-success me-1" 
              onClick={() => saveEdit(todo.id)}
            >
              <Check size={16} />
            </button>
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={cancelEdit}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            {!todo.completed && !todo.locked && (
              <button 
                className="btn me-1" 
                style={{ color: '#20c997', borderColor: '#20c997' }}
                onClick={() => startEditing(todo.id, todo.text)}
              >
                <Pencil size={14} />
              </button>
            )}
            <button 
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteClick(todo.id)}
              disabled={todo.locked}
              title={todo.locked ? 'Complete previous tasks to unlock' : 'Delete task'}
            >
              <Trash size={14} />
            </button>
          </>
        )}
      </div>
      
      {todo.locked && !todo.completed && (
        <span className="badge bg-secondary ms-2" title="Complete previous tasks to unlock">
          <i className="bi bi-lock-fill me-1"></i>Locked
        </span>
      )}
    </li>
    );
  });
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);

  const handleDeleteClick = (id) => {
    setTodoToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (todoToDelete) {
      setTodos(prevTodos => {
        // Filter out the deleted todo
        const newTodos = prevTodos.filter(todo => todo.id !== todoToDelete);
        
        // Find the index of the first incomplete task
        const firstIncompleteIndex = newTodos.findIndex(todo => !todo.completed);
        
        // Update locked status for all tasks
        return newTodos.map((todo, index) => ({
          ...todo,
          // A task is locked if it's not the first task and either:
          // 1. It's after the first incomplete task, or
          // 2. It's the first task and there are incomplete tasks after it
          locked: index > 0 && (firstIncompleteIndex !== -1 && index > firstIncompleteIndex)
        }));
      });
      setShowDeleteModal(false);
      setTodoToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTodoToDelete(null);
  };

  const DeleteConfirmationModal = () => (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', /* Semi-transparent black */
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1050
    }}>
      <div className="modal-content" style={{
        backgroundColor: '#20c997',
        color: 'white',
        borderRadius: '0.5rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
      }}>
        <div className="modal-header" style={{
          padding: '1rem',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h5 className="modal-title" style={{ margin: 0, fontWeight: 600, color: 'white' }}>Confirm Deletion</h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={cancelDelete}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              opacity: 0.7
            }}
            aria-label="Close"
          ></button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '1rem', margin: 0, opacity: 0.9 }}>This action cannot be undone.</p>
        </div>
        <div className="modal-footer" style={{
          padding: '1rem',
          borderTop: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem'
        }}>
          <button 
            type="button" 
            className="btn btn-light" 
            onClick={cancelDelete}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.25rem',
              border: '1px solid #f8f9fa',
              backgroundColor: '#f8f9fa',
              color: '#20c997',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={confirmDelete}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.25rem',
              border: '1px solid #dc3545',
              backgroundColor: '#dc3545',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500
            }}
          >
            <Trash size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Add display name for better debugging
  TodoItem.displayName = 'TodoItem';
  
  // Calculate progress
  const progress = useMemo(() => {
    const completed = todos.filter(todo => todo.completed).length;
    return todos.length > 0 ? Math.round((completed / todos.length) * 100) : 0;
  }, [todos]);
  
  // Menu state and handlers
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  
  // Toggle theme picker
  const toggleThemePicker = useCallback(() => {
    setShowThemePicker(prev => !prev);
  }, []);
  
  // Theme Picker Modal component
  const ThemePickerModal = () => (
    <div 
      className="modal-backdrop" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1080
      }}
      onClick={() => setShowThemePicker(false)}
    >
      <div 
        className="bg-white rounded p-4" 
        style={{ width: '90%', maxWidth: '400px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Choose Theme Color</h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setShowThemePicker(false)}
            aria-label="Close"
          ></button>
        </div>
        <div className="d-flex flex-wrap gap-3 justify-content-center">
          {themeColors.map((color) => (
            <button
              key={color}
              className="btn"
              onClick={() => applyTheme(color)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: color,
                border: themeColor === color ? '3px solid #333' : '3px solid #fff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
              aria-label={`Set theme color to ${color}`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );

  // Show empty state if no tasks
  if (todos.length === 0) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: themeColor }}>
          <div className="container">
            <a className="navbar-brand d-flex align-items-center" href="/">
              <Book className="me-2" size={24} />
              TaskFlow
            </a>
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-light"
                onClick={toggleThemePicker}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
              >
                <Gear size={16} />
                <span>Theme</span>
              </button>
            </div>
          </div>
        </nav>
        <main className="container my-4 flex-grow-1">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header text-white" style={{ backgroundColor: themeColor }}>
                  <h1 className="h4 mb-0">TaskFlow Checklist</h1>
                </div>
                <div className="card-body text-center py-5">
                  <i className="bi bi-list-check display-1 text-muted mb-3"></i>
                  <h2>No tasks yet</h2>
                  <p className="text-muted mb-4">Add your first task to get started!</p>
                  
                  {/* Task Input Form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.target.elements.todoInput;
                      if (input.value.trim()) {
                        addTodo(input.value.trim());
                        input.value = '';
                      }
                    }} 
                    className="mt-4"
                    style={{ maxWidth: '500px', margin: '0 auto' }}
                  >
                    <div className="input-group">
                      <input
                        type="text"
                        name="todoInput"
                        className="form-control"
                        placeholder="Enter your first task..."
                        aria-label="Enter your first task"
                        autoFocus
                      />
                      <button 
                        className="btn" 
                        type="submit"
                        style={{ 
                          backgroundColor: themeColor, 
                          borderColor: themeColor, 
                          color: 'white' 
                        }}
                      >
                        Add Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="py-3 mt-auto" style={{ backgroundColor: themeColor }}>
          <div className="container text-center">
            <p className="mb-0 text-white">
              &copy; {new Date().getFullYear()} Zchagri. All rights reserved.
            </p>
          </div>
        </footer>
        
        {/* Theme Picker Modal */}
        {showThemePicker && <ThemePickerModal />}
      </div>
    );
  }
  
  // Render the main component

  // Render loading state
  if (isAuthLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Render login/signup if not authenticated
  if (!currentUser) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: themeColor }}>
          <div className="container">
            <a className="navbar-brand d-flex align-items-center" href="/">
              <Book className="me-2" size={24} />
              TaskFlow
            </a>
          </div>
        </nav>
        <main className="container my-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header text-white" style={{ backgroundColor: themeColor }}>
                  <h1 className="h4 mb-0">Welcome to TaskFlow</h1>
                </div>
                <div className="card-body text-center py-5">
                  <i className="bi bi-list-check display-1 text-muted mb-3"></i>
                  <h2>Please sign in to continue</h2>
                  <p className="text-muted mb-4">Manage your tasks with ease</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/login'}
                    style={{ backgroundColor: themeColor, borderColor: themeColor }}
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main app when authenticated
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: themeColor }}>
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="/">
            <Book className="me-2" size={24} />
            TaskFlow
          </a>
          
          <div className="d-flex align-items-center">
            {currentUser && (
              <div className="dropdown me-3">
                <button 
                  className="btn btn-outline-light dropdown-toggle d-flex align-items-center" 
                  type="button" 
                  id="userDropdown" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    padding: '0.25rem 0.75rem'
                  }}
                >
                  <i className="bi bi-person-circle me-2"></i>
                  <span className="d-none d-md-inline">
                    {currentUser.displayName || 'User'}
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  <li><a className="dropdown-item" href="#" onClick={toggleThemePicker}>
                    <i className="bi bi-palette me-2"></i>Change Theme
                  </a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) || (
              <button 
                className="btn btn-outline-light me-3"
                onClick={toggleThemePicker}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
              >
                <Gear size={16} />
                <span>Theme</span>
              </button>
            )}
            <span className="text-white d-none d-md-inline" style={{ minWidth: '80px' }}>
              Progress: {progress}%
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container my-4 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-md-8">
            {/* Category Manager - Only show when authenticated */}
            {currentUser && (
              <CategoryManager themeColor={themeColor} />
            )}
            
            {/* Tasks Card */}
            <div className="card mt-4">
              <div className="card-header text-white" style={{ backgroundColor: themeColor }}>
                <h1 className="h4 mb-0">TaskFlow Checklist</h1>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                <div className="progress" style={{ height: '25px' }}>
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated" 
                    role="progressbar" 
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: '#20c997' 
                    }}
                    aria-valuenow={progress} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {progress}%
                  </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.target.elements.todoInput;
                  if (input.value.trim()) {
                    addTodo(input.value.trim());
                    input.value = '';
                  }
                }} className="input-group">
                  <input
                    type="text"
                    name="todoInput"
                    className="form-control"
                    placeholder="Add a new task..."
                    aria-label="Add a new task"
                  />

                  <button 
                    className="btn" 
                    type="submit"
                    style={{ backgroundColor: themeColor, borderColor: themeColor, color: 'white' }}
                  >
                    Add Task
                  </button>
                </form>
              </div>

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={todos.map(todo => todo.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="list-group">
                    {todos.map((todo) => (
                      <SortableItem 
                        key={todo.id} 
                        id={todo.id.toString()}
                        disabled={todo.locked || todo.completed}
                      >
                        {(props) => {
                          const { listeners, attributes, isDragging, setNodeRef, transform, transition } = props;
                          const style = {
                            transform: CSS.Transform.toString(transform),
                            transition: transition || undefined,
                            opacity: isDragging ? 0.5 : 1,
                            cursor: todo.locked || todo.completed ? 'not-allowed' : 'grab',
                            touchAction: 'none',
                          };
                          
                          return (
                            <TodoItem 
                              todo={todo} 
                              dragHandleProps={{
                                ...listeners,
                                ...attributes,
                                style: { 
                                  cursor: 'grab', 
                                  display: 'inline-flex',
                                  touchAction: 'none' // Prevent scrolling on touch devices
                                }
                              }}
                              isDragging={isDragging}
                              style={style}
                              ref={setNodeRef}
                            />
                          );
                        }}
                      </SortableItem>
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
              
              <div className="mt-4 text-center">
                <button 
                  onClick={resetAll}
                  className="btn btn-outline-secondary"
                >
                  Reset All
                </button>
              </div>
            </div>
            <div className="card-footer text-muted text-center">
              Complete each step to unlock the next one!
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-3 mt-auto" style={{ backgroundColor: themeColor }}>
        <div className="container text-center">
          <p className="mb-0 text-white">
            &copy; {new Date().getFullYear()} Zchagri. All rights reserved.
          </p>
        </div>
      </footer>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && <DeleteConfirmationModal />}
      
      {/* Theme Picker Modal */}
      {showThemePicker && <ThemePickerModal />}
    </div>
  );
}

export default App;
