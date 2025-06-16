import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy, writeBatch } from 'firebase/firestore';

const TASKS_COLLECTION = 'tasks';

// Get all tasks for a user
export const getTasks = async (userId) => {
  try {
    const tasksQuery = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('order', 'asc')
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    const tasks = [];
    
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // If no tasks, initialize with default tasks
    if (tasks.length === 0) {
      const defaultTasks = [
        { text: 'Check wind speed', completed: false, locked: false, order: 0 },
        { text: 'Inspect gear', completed: false, locked: true, order: 1 },
        { text: 'Load gear in van', completed: false, locked: true, order: 2 },
        { text: 'Drive to beach', completed: false, locked: true, order: 3 },
        { text: 'Set up sail', completed: false, locked: true, order: 4 },
        { text: 'Begin windsurfing', completed: false, locked: true, order: 5 },
      ];
      
      const batch = writeBatch(db);
      
      defaultTasks.forEach((task, index) => {
        const taskRef = doc(collection(db, TASKS_COLLECTION));
        const taskWithUser = {
          ...task,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        batch.set(taskRef, taskWithUser);
        tasks.push({ id: taskRef.id, ...taskWithUser });
      });
      
      await batch.commit();
    }
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

// Add a new task
export const addTask = async (userId, task) => {
  try {
    const taskRef = doc(collection(db, TASKS_COLLECTION));
    const newTask = {
      ...task,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(taskRef, newTask);
    return { id: taskRef.id, ...newTask };
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (taskId, updates) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Reorder tasks
export const reorderTasks = async (taskIds) => {
  try {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();
    
    taskIds.forEach((taskId, index) => {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      batch.update(taskRef, { 
        order: index,
        updatedAt: timestamp 
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error reordering tasks:', error);
    throw error;
  }
};
