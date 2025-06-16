import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db, tasksCollection } from '../../firebase';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      console.log('User already logged in, redirecting...');
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Signup form submitted');
    
    // Validation
    if (!email || !password || !confirmPassword || !displayName.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting to sign up...');
      const userCredential = await signup(email, password, displayName.trim());
      console.log('Signup successful:', userCredential);
      
      if (userCredential?.user) {
        await createDefaultTasks(userCredential.user.uid);
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create an account. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting Google sign up...');
      const userCredential = await signInWithGoogle();
      if (userCredential?.user) {
        await createDefaultTasks(userCredential.user.uid);
      }
      navigate('/');
    } catch (error) {
      console.error('Google sign up error:', error);
      setError(error.message || 'Failed to sign up with Google.');
      setIsLoading(false);
    }
  };

  const createDefaultTasks = async (userId) => {
    console.log(`Creating default tasks for user ${userId}`);
    const defaultTasks = [
      { text: 'Welcome to your new task list!', completed: false },
      { text: 'Complete a task to unlock the next one', completed: false },
      { text: 'Drag and drop to reorder tasks', completed: false },
      { text: 'Click the settings icon to change your theme', completed: false },
      { text: 'Click \'Delete All\' to clear your list', completed: false },
    ];

    try {
      const batch = writeBatch(db);
      defaultTasks.forEach((task, index) => {
        const newTaskRef = doc(tasksCollection);
        batch.set(newTaskRef, {
          ...task,
          userId,
          order: index,
          locked: index !== 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      console.log('Default tasks created successfully.');
    } catch (error) {
      console.error('Error creating default tasks:', error);
      // We can choose to inform the user or just log the error
    }
  };

  return (
    <div className="row justify-content-center min-vh-100 align-items-center">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white text-center py-3">
            <h1 className="h4 mb-0">Create an Account</h1>
          </div>
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-warning alert-dismissible fade show" role="alert">
                {error}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setError('')}
                  aria-label="Close"
                ></button>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="displayName" className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoFocus
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <div className="form-text">Password must be at least 6 characters</div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="d-grid gap-2">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : 'Sign Up'}
                </button>
                
                <div className="text-center my-3">
                  <span className="text-muted">or</span>
                </div>
                
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                >
                  <i className="bi bi-google me-2"></i>
                  Sign up with Google
                </button>
              </div>
              
              <div className="mt-4 pt-3 border-top text-center">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-decoration-none fw-bold">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
