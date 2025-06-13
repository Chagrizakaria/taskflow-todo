import React, { useState, useEffect, useContext } from 'react';
import { 
  addCategory, 
  updateCategory, 
  deleteCategory, 
  getUserCategories 
} from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import { Plus, Pencil, Trash, X, Check } from 'react-bootstrap-icons';

const CategoryManager = () => {
  const { currentUser } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState('#20c997');

  // Color options for the color picker
  const colorOptions = [
    '#20c997', // Teal
    '#0d6efd', // Blue
    '#6f42c1', // Purple
    '#d63384', // Pink
    '#dc3545', // Red
    '#fd7e14', // Orange
    '#ffc107', // Yellow
    '#198754', // Green
    '#0dcaf0', // Cyan
    '#6c757d'  // Gray
  ];

  // Load categories from Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    setIsLoading(true);
    
    const unsubscribe = getUserCategories(currentUser.uid, (loadedCategories) => {
      setCategories(loadedCategories);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Add a new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim() || !currentUser?.uid) return;

    try {
      await addCategory(currentUser.uid, {
        name: newCategory.trim(),
        color: selectedColor
      });
      setNewCategory('');
      setSelectedColor('#20c997');
      setError('');
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category. Please try again.');
    }
  };

  // Start editing a category
  const startEditing = (category) => {
    setEditingId(category.id);
    setEditValue(category.name);
    setSelectedColor(category.color || '#20c997');
  };

  // Save edited category
  const handleSaveEdit = async (categoryId) => {
    if (!editValue.trim()) return;

    try {
      await updateCategory(categoryId, {
        name: editValue.trim(),
        color: selectedColor
      });
      setEditingId(null);
      setError('');
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category. Please try again.');
    }
  };

  // Delete a category
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This will not delete tasks in this category.')) {
      try {
        await deleteCategory(categoryId);
        setError('');
      } catch (error) {
        console.error('Error deleting category:', error);
        setError('Failed to delete category. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="category-manager card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Categories</h5>
        <small className="text-muted">{categories.length} categories</small>
      </div>
      
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError('')}
              aria-label="Close"
            ></button>
          </div>
        )}
        
        <form onSubmit={handleAddCategory} className="mb-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Add a new category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              disabled={!currentUser}
              aria-label="Category name"
            />
            <button 
              className="btn btn-primary" 
              type="submit"
              disabled={!newCategory.trim() || !currentUser}
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="mt-2 d-flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className="btn btn-sm p-0 m-0"
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: color,
                  border: selectedColor === color ? '2px solid #000' : '1px solid #ddd',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={() => setSelectedColor(color)}
                title={color}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </form>

        <div className="list-group">
          {categories.length === 0 ? (
            <div className="text-center py-3 text-muted">
              <p className="mb-1">No categories yet</p>
              <small>Add your first category above</small>
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2"
              >
                {editingId === category.id ? (
                  <div className="d-flex w-100 align-items-center">
                    <div
                      className="me-2"
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: selectedColor,
                        borderRadius: '50%',
                        flexShrink: 0
                      }}
                    />
                    <input
                      type="text"
                      className="form-control form-control-sm me-2"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(category.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-success"
                        onClick={() => handleSaveEdit(category.id)}
                        disabled={!editValue.trim()}
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setEditingId(null)}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="d-flex align-items-center">
                      <span
                        className="me-2"
                        style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          backgroundColor: category.color || '#20c997',
                          borderRadius: '50%',
                          flexShrink: 0
                        }}
                        aria-hidden="true"
                      ></span>
                      <span className="text-truncate">{category.name}</span>
                    </div>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => startEditing(category)}
                        title="Edit category"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteCategory(category.id)}
                        title="Delete category"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
