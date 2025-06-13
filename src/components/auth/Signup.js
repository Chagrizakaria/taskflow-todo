import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Signup = ({ themeColor }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { signup, signInWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      await signup(email, password, displayName.trim());
      navigate('/');
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header text-white" style={{ backgroundColor: themeColor }}>
            <h1 className="h4 mb-0">Create an Account</h1>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="displayName" className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
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
                  minLength="6"
                  required
                />
                <div className="form-text">Password must be at least 6 characters long</div>
              </div>
              
              <button 
                type="submit" 
                className="btn w-100 mb-3"
                style={{ backgroundColor: themeColor, color: 'white' }}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>
              
              <div className="text-center mb-3">
                <span className="text-muted">Or sign up with</span>
              </div>
              
              <button
                type="button"
                className="btn btn-outline-danger w-100 mb-3"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <i className="bi bi-google me-2"></i>
                Sign up with Google
              </button>
              
              <div className="text-center mt-3">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: themeColor }}>Sign in</Link>
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
