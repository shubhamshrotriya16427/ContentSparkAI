import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../components/Context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        // Redirect them to the login page, but save the current location they were trying to go to
        return <Navigate to="/" />;
    };

    return children;
};

export default ProtectedRoute; 
