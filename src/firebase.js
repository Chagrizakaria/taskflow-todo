// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let analytics;

// Initialize Analytics only in the client side and if measurementId exists
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isSupported().then(yes => yes && (analytics = getAnalytics(app)));
}

// Firestore collections
export const tasksCollection = 'tasks';
export const categoriesCollection = 'categories';

// Auth functions
export { auth };

// Firestore functions
export { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  orderBy 
};

// Analytics
export { analytics };

// Helper function to get user's tasks
export const getUserTasks = (userId, onSuccess, onError) => {
  console.log('getUserTasks called with userId:', userId);
  
  if (!userId) {
    console.log('No userId provided, returning empty array');
    onSuccess?.([]);
    return () => {};
  }
  
  try {
    console.log('Setting up Firestore query for tasks');
    const q = query(
      collection(db, tasksCollection),
      where('userId', '==', userId)
    );
    
    console.log('Setting up onSnapshot listener');
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        console.log('Received snapshot from Firestore');
        const tasks = [];
        querySnapshot.forEach((doc) => {
          console.log('Processing document:', doc.id, doc.data());
          const data = doc.data();
          const createdAt = data.createdAt;
          const updatedAt = data.updatedAt;

          // Handle both Firestore Timestamps and string dates gracefully
          const processedCreatedAt = (createdAt && typeof createdAt.toDate === 'function')
            ? createdAt.toDate().toISOString()
            : createdAt || new Date().toISOString();

          const processedUpdatedAt = (updatedAt && typeof updatedAt.toDate === 'function')
            ? updatedAt.toDate().toISOString()
            : updatedAt || new Date().toISOString();

          tasks.push({ 
            id: doc.id, 
            ...data,
            createdAt: processedCreatedAt,
            updatedAt: processedUpdatedAt
          });
        });
        console.log('Processed tasks:', tasks);
        console.log('Firestore listener triggered. Tasks received:', tasks);
        onSuccess?.(tasks);
      },
      (error) => {
        console.error('Error in tasks listener:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        onError?.(error);
      }
    );
    
    console.log('onSnapshot listener set up successfully');
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up tasks listener:', error);
    onError?.(error);
    return () => {};
  }
};

// Helper function to add a new task
export const addTask = async (userId, taskData) => {
  console.log('addTask called with userId:', userId, 'taskData:', taskData);
  
  if (!userId) {
    const error = new Error('User not authenticated');
    console.error('Authentication error:', error);
    throw error;
  }
  
  try {
    const taskWithMetadata = {
      ...taskData,
      userId,
      completed: taskData.completed || false,
      locked: taskData.locked || false,
      order: taskData.order || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log('Adding task to Firestore:', taskWithMetadata);
    const docRef = await addDoc(collection(db, tasksCollection), taskWithMetadata);
    console.log('Task added successfully with ID:', docRef.id);
    
    // Return the task with the generated ID
    const result = { 
      id: docRef.id, 
      ...taskWithMetadata,
      // Convert Firestore timestamps to ISO strings for consistency
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Returning task:', result);
    return result;
  } catch (error) {
    console.error('Error in addTask:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

// Helper function to update a task
export const updateTask = async (taskId, updates) => {
  const taskRef = doc(db, tasksCollection, taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Helper function to delete a task
export const deleteTask = async (taskId) => {
  await deleteDoc(doc(db, tasksCollection, taskId));
};

// Helper function to get user's categories
export const getUserCategories = (userId, callback) => {
  if (!userId) return () => {};
  
  const q = query(
    collection(db, categoriesCollection),
    where('userId', '==', userId),
    orderBy('createdAt')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const categories = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    callback(categories);
  });
};

// Helper function to add a new category
export const addCategory = async (userId, categoryData) => {
  if (!userId) throw new Error('User not authenticated');
  
  const categoryWithMetadata = {
    ...categoryData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(collection(db, categoriesCollection), categoryWithMetadata);
  return { id: docRef.id, ...categoryWithMetadata };
};

// Helper function to update a category
export const updateCategory = async (categoryId, updates) => {
  const categoryRef = doc(db, categoriesCollection, categoryId);
  await updateDoc(categoryRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Helper function to delete a category
export const deleteCategory = async (categoryId) => {
  await deleteDoc(doc(db, categoriesCollection, categoryId));
};
