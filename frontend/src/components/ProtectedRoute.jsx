import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ userRole, requiredRole, children }) {
  // 1. If no one is logged in, send them to the login page
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // 2. If the logged-in user is the wrong role, send them to the home page
  if (userRole !== requiredRole) {
    return <Navigate to="/" replace />; 
  }

  // 3. If they pass the checks, let them in!
  return children;
}

export default ProtectedRoute;