import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../../firebase';

const PrivateRoute = ({ children }) => {
  const user = auth.currentUser;
  const location = useLocation();

  if (user === null) {
    // Redirect to the login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
