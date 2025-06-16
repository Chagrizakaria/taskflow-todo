import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';
import App from './App';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import reportWebVitals from './reportWebVitals';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Error message:', event.message);
  console.error('Error stack:', event.error?.stack);
  // You can also show a user-friendly error message here
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection (promise):', event.reason);
  // You can also show a user-friendly error message here
});

// Create a wrapper component to handle authentication state
function AppWrapper() {
  const { currentUser, loading } = useAuth();
  
  console.log('[AppWrapper] Current user:', currentUser);
  console.log('[AppWrapper] Loading:', loading);
  
  if (loading) {
    console.log('[AppWrapper] Auth state loading...');
    return <div>Loading...</div>; // or a loading spinner
  }
  
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          currentUser ? (
            <App />
          ) : (
            <Navigate to="/login" state={{ from: '/' }} replace />
          )
        } 
      />
      <Route 
        path="/login" 
        element={
          !currentUser ? (
            <div className="container py-5">
              <Login />
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/signup" 
        element={
          !currentUser ? (
            <div className="container py-5">
              <Signup />
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          !currentUser ? (
            <div className="container py-5">
              <ForgotPassword />
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Get the root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Determine the basename based on the current environment
const isProduction = process.env.NODE_ENV === 'production';
const basename = isProduction ? '/taskflow-todo' : '';

root.render(
  <React.StrictMode>
    <Router
      basename={basename}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true
      }}
    >
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
