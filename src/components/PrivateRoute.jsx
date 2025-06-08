import { Navigate, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

// eslint-disable-next-line react/prop-types
const PrivateRoute = ({ children }) => {
  const { user, session } = UserAuth();
  const location = useLocation();

  // session might be undefined during loading
  if (session === undefined) {
    return <div className="p-4 text-center">Loading authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
