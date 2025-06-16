import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, resetPassword } = useAuth();
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
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      console.log('Sending password reset email to:', email);
      await resetPassword(email);
      setMessage('Password reset email sent. Please check your inbox.');
      setEmail('');
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setError(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="row justify-content-center min-vh-100 align-items-center">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white text-center py-3">
            <h1 className="h4 mb-0">Reset Password</h1>
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
            
            {message ? (
              <div className="alert alert-success">
                {message}
                <div className="mt-2">
                  <Link to="/login" className="btn btn-outline-success btn-sm">
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-muted mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <form onSubmit={handleSubmit}>
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
                      autoFocus
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
                          Sending...
                        </>
                      ) : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
                
                <div className="mt-4 pt-3 border-top text-center">
                  <p className="mb-0">
                    Remember your password?{' '}
                    <Link to="/login" className="text-decoration-none fw-bold">
                      Sign In
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
