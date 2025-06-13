import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPassword = ({ themeColor }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { resetPassword } = useAuth();

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
      await resetPassword(email);
      setMessage('Password reset email sent. Please check your inbox.');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header text-white" style={{ backgroundColor: themeColor }}>
            <h1 className="h4 mb-0">Reset Password</h1>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}
            
            <p className="mb-4">Enter your email address and we'll send you a link to reset your password.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn w-100 mb-3"
                style={{ backgroundColor: themeColor, color: 'white' }}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              <div className="text-center mt-3">
                <Link 
                  to="/login" 
                  className="text-decoration-none"
                  style={{ color: themeColor }}
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
