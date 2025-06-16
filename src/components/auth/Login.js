import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();

  console.log('Login component rendered');
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      console.log('User already logged in, redirecting...');
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', { email });
    
    // Simple validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    console.log('Attempting to log in...');
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      console.log('Login successful:', result);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    console.log('Demo login clicked');
    setEmail('demo@example.com');
    setPassword('password123');
    // Don't auto-submit, let the user see the filled form
  };

  return (
    <div className="row justify-content-center min-vh-100 align-items-center">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white text-center py-3">
            <h1 className="h4 mb-0">Sign In</h1>
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
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
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
                      Signing In...
                    </>
                  ) : 'Sign In'}
                </button>
                
                <div className="text-center my-3">
                  <span className="text-muted">or</span>
                </div>
                
                <button 
                  type="button" 
                  className="btn btn-outline-primary"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                >
                  Try Demo Account
                </button>
              </div>
              
              <div className="mt-4 pt-3 border-top text-center">
                <p className="mb-2">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-decoration-none fw-bold">
                    Sign Up
                  </Link>
                </p>
                <p className="mb-0">
                  <Link to="/forgot-password" className="text-decoration-none text-muted small">
                    Forgot your password?
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

export default Login;
