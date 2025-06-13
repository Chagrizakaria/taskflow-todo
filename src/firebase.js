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
export const getUserTasks = (userId, callback) => {
  if (!userId) return () => {};
  
  const q = query(
    collection(db, tasksCollection),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    callback(tasks);
  });
};

// Helper function to add a new task
export const addTask = async (userId, taskData) => {
  if (!userId) throw new Error('User not authenticated');
  
  const taskWithMetadata = {
    ...taskData,
    userId,
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(collection(db, tasksCollection), taskWithMetadata);
  return { id: docRef.id, ...taskWithMetadata };
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
